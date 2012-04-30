/******************************************************
  music.js
  Code for producing visualizations for music exercises
  (Music.F-TF)

  @author ngillani
  @date 4.17.12

 **************************************************/
{% extends "packet.js" %}

{% block extra %}

// CONSTANTS
var SONG_DIR = '/site/exercise-content/music/mp3files/';
var SONG_EXT = '.mp3';
var CHART_WIDTH = 600;
var CHART_HEIGHT = 400;
var NUM_POINTS = 200;
var GRID_INCREMENT = 2*Math.PI / NUM_POINTS;
var BUTTON_WIDTH = CHART_WIDTH / 10;
var TRANSLATE_STEP = 1;

function playTone(songName1, songName2, delay){

	var mySoundObject2 = soundManager.createSound({
		id: songName2, 
		url: SONG_DIR + songName2 + SONG_EXT,	
		autoPlay: false,
		autoLoad: true,
	});

	var mySoundObject1 = soundManager.createSound({
		 id: songName1,
		url: SONG_DIR + songName1 + SONG_EXT,
		autoLoad: true,	
		onplay: function(){
				setTimeout(function(){mySoundObject2.play()}, delay);
			},
		onfinish: function(){
				
		},
	});

	mySoundObject1.play();
	
}

// Load Google Viz
//google.load('visualization', '1.0', {'packages':['corechart']});

function Curve(frequency, amplitude, xshift){		

	this.frequency = frequency;
	this.amplitude = amplitude;
	this.xshift = xshift;

	this.initializePoints = function(){
		this.ypoints = [];

		for(var i = 0; i <= NUM_POINTS; i++){
			this.ypoints[i] = this.amplitude*Math.sin((i*this.frequency+xshift)*GRID_INCREMENT);
		}
	}
	this.initializePoints();




}

function CombinedCurve(allCurves){

	this.ypoints = [];
	this.allCurves = allCurves;

	this.initializePoints = function(){

		for(var j = 0; j <= NUM_POINTS; j++){
			this.ypoints[j] = 0;
		}

		for(var i = 0; i < allCurves.length; i++){
			for(var j=0; j <= NUM_POINTS; j++){
				this.ypoints[j] += allCurves[i][j];
			}
		}

	}
	this.initializePoints();
	
}

// This function is responsible for:
// 1.  Determining the new points for the "filter" curve
// 2.  Computing the new "combined curve" as a result
Curve.prototype.translateAndRecompute = function(curvemainY, combinedCurve, shiftAmount){

	var	newYPoints = [];
	this.xshift = this.xshift + shiftAmount;

	if(shiftAmount > 0){

		var temp = this.ypoints[NUM_POINTS];
		for(var i = NUM_POINTS; i > 0; i--){
			newYPoints[i] = this.ypoints[i-1];
			combinedCurve.ypoints[i] = newYPoints[i]+curvemainY.ypoints[i-1];
		}
		newYPoints[0] = temp;
		combinedCurve.ypoints[0] = newYPoints[0]+curvemainY.ypoints[0];
	}
	else{

		var temp = this.ypoints[0];
		for(var i = 0; i < NUM_POINTS; i++){
			newYPoints[i] = this.ypoints[i+1];
			combinedCurve.ypoints[i] = newYPoints[i]+curvemainY.ypoints[i+1];
		}
		newYPoints[NUM_POINTS] = temp;
		combinedCurve.ypoints[NUM_POINTS] = newYPoints[NUM_POINTS]+curvemainY.ypoints[NUM_POINTS];
	}

	this.ypoints = newYPoints;
	return combinedCurve;
}

Curve.prototype.printFunction = function(){
	
	// Do necessary preprocessing
	var coefStr = this.xshift > 0 ? '+' : '-';
	var realAmplitude = (this.amplitude/ONE_EQUIV).toFixed(2);
	var realShift = (this.xshift*this.gridIncrement).toFixed(2);
	return 'y='+realAmplitude+'*sin('+this.frequency+'x'+coefStr+realShift+')';
}

CombinedCurve.prototype.draw = function(color, ypoints, ctx){
	Curve.prototype.draw(color, ypoints, ctx);
}

/******************* RENDER FUNCTION ************************/
function renderPlot(currDiv, plotNum, curves, origCurves, title, colors){

	// Create the grid for the graph + draw!
	curveLabels = ['Original Song', 'Filter Song', 'Resulting Song'];

	/***** ADD IN GOOGLE CHART! *****/
	var data = new google.visualization.DataTable();

    // Add column for days
    data.addColumn('string', 'values');
	
	for(c in curveLabels){
		data.addColumn('number', curveLabels[c]);
	}

	for(var i = 0; i < NUM_POINTS; i++){
	
		var rowArray = [];
		rowArray.push(''+(i*GRID_INCREMENT.toFixed(2)));

		for(var j = 0; j < curves.length; j++){
			rowArray.push(curves[j].ypoints[i]);
		}

		data.addRow(rowArray);
	}

    // Now, define options
    var options = {
	  width : CHART_WIDTH,
	  height: CHART_HEIGHT,
	  vAxis: {title : 'Y-values', minValue : -3, maxValue : 3},
	  hAxis: {title: 'X-values (in radians)'},
	  seriesType: 'line',
	  title: title,
	  colors: colors,
	  series: {2: {lineWidth: 5}},
    }

    var chart = new google.visualization.LineChart(document.getElementById(currDiv));
    chart.draw(data, options);
	

	/***** END ADD IN GOOGLE CHART! *****/	

	//ctx.translate(0.5,0.5);

	// Lastly, set up the slider and reset button and bind callback to be triggered when using the slider!
	var controlDiv = currDiv + '-control-'+parseFloat(plotNum);
	var sliderId = 'slider-'+parseFloat(plotNum);
	$('#'+currDiv).append('<div id="' + controlDiv + '"></div>');
	$('#'+controlDiv).css('width', CHART_WIDTH, 'display', 'inline');

	$('#'+controlDiv).append('<div id="' + sliderId + '"></div>');
	$('#'+sliderId).css('width',CHART_WIDTH, 'float', 'left');

	var prevSliderVal = 0;

	$('#'+sliderId).slider({slide : function(event, ui){
			curves[1].translateAndRecompute(curves[0],curves[2],(ui.value - prevSliderVal)*TRANSLATE_STEP);
			updatePointsAndRedraw(curves, data, chart, options);
			prevSliderVal = ui.value;
		}, 
	});

	var resetButtonId = 'reset-'+parseFloat(plotNum);
	$('#'+controlDiv).append('<input id="' + resetButtonId + '" class="btn" type="button" value="Reset"/>');
	$('#'+resetButtonId).css('width',BUTTON_WIDTH, 'float', 'right');

	$('#'+resetButtonId).click(function(){
		resetCurveDataToOriginal(curves, origCurves);
		updatePointsAndRedraw(curves, data, chart, options);
		$('#'+sliderId).slider('option', 'value', 0);
		
	});

	// Sandbox for done playing button
	var playButtonId = 'play-'+parseFloat(plotNum);
	$('#'+controlDiv).append('<input id="' + playButtonId + '" class="btn" type="button" value="Play!"/>');
	$('#'+resetButtonId).css('width',BUTTON_WIDTH, 'float', 'right');

	$('#'+playButtonId).click(function(){
		playTone('200Hz-5sec', '100Hz-5sec2', 100);		
	});
	

}

function resetCurveDataToOriginal(curves, origCurves){
	
	for(var i = 0; i < curves.length; i++){
		for(var j=0; j <= NUM_POINTS; j++){
			curves[i].ypoints[j] = origCurves[i].ypoints[j];
		}
	}
}

function updatePointsAndRedraw(curves, data, chart, options){

	for(var i = 0; i < NUM_POINTS; i++){

		// No need to add in the main curve again!
		for(var j = 1; j < curves.length; j++){
			data.setValue(i, j+1, curves[j].ypoints[i]);
		}
	}

	chart.draw(data, options);
}

function buildOriginalCurves(f1, a1, s1, f2, a2, s2){

	// Store the original curve points to enable resetting
	var origCurveMain = new Curve(f1, a1, s1);
	var origCurveFilter = new Curve(f2, a2, s2);
	var origCurveResult = new CombinedCurve([origCurveMain.ypoints, origCurveFilter.ypoints]);
	return [origCurveMain, origCurveFilter, origCurveResult];

}

{% endblock extra %}

{% block visuals %}
[
	function (){

		// Now, create + draw the appropriate curves!
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with same frequency added to obtain a resulting wave';

		var curveMain = new Curve(2, 1, 0);
		var curveFilter = new Curve(2, 1, NUM_POINTS/6);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		renderPlot(this.attr('id'), 1, [curveMain, curveFilter, curveResult], origCurves, title, colors);
	},

	function (){
		// Now, create + draw the appropriate curves!
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with different frequencies added to obtain a resulting wave'
										
		var curveMain = new Curve(3, -1, 0);
		var curveFilter = new Curve(10, 1, 10);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		renderPlot(this.attr('id'), 2, [curveMain, curveFilter, curveResult], origCurves, title, colors);
	}, 

	function (){
		// Now, create + draw the appropriate curves!
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with different frequencies added to obtain a resulting wave'
										
		var curveMain = new Curve(3, -1, 0);
		var curveFilter = new Curve(2, 1, 10);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		renderPlot(this.attr('id'), 3, [curveMain, curveFilter, curveResult], origCurves, title, colors);
	}
]

{% endblock visuals %}
