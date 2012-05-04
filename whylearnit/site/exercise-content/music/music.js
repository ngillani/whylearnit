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
var TONES = ['200Hz-5sec', '200Hz-5sec2', '1000Hz-5sec'];

// Array of sound objects
var _mySoundObjects = {};

(function(){

	for(var i = 0; i < TONES.length; i++){

		_mySoundObjects[TONES[i]] = soundManager.createSound({
			id: TONES[i],
			url: SONG_DIR + TONES[i] + SONG_EXT,
			autoPlay: false,
			autoLoad: true,	
			volume: 100,
		});

	}
	
})();

function playSingleTone(tone, delay){
	_mySoundObjects[tone].play();
}

function playBothTones(tones, delay){
	_mySoundObjects[tones[0]].play({onplay: function(){setTimeout(_mySoundObjects[tones[1]].play(),delay);}});
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

// Render the appropriate chart
function renderPlot(currDiv, plotNum, curves, origCurves, title, colors, tones){

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

	return {data: data, chart: chart, options: options};

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

function addResetButton(plotNum, controlDiv, curves, origCurves, chartInfo, sliderId){

	var resetButtonId = 'reset-'+plotNum;
	$('#'+controlDiv).append('<input id="' + resetButtonId + '" class="btn" type="button" value="Reset"/>');
	$('#'+resetButtonId).css('width',BUTTON_WIDTH, 'float', 'right');

	$('#'+resetButtonId).click(function(){
		resetCurveDataToOriginal(curves, origCurves);
		updatePointsAndRedraw(curves, chartInfo['data'], chartInfo['chart'], chartInfo['options']);
		$('#'+sliderId).slider('option', 'value', 0);
		
	});

}

function addSlider(plotNum, controlDiv, curves, chartInfo){

	var sliderId = 'slider-'+plotNum;

	$('#'+controlDiv).append('<div id="' + sliderId + '"></div>');
	$('#'+sliderId).css('width',CHART_WIDTH, 'float', 'left');

	var prevSliderVal = 0;

	$('#'+sliderId).slider({slide : function(event, ui){
			curves[1].translateAndRecompute(curves[0],curves[2],(ui.value - prevSliderVal)*TRANSLATE_STEP);
			updatePointsAndRedraw(curves, chartInfo['data'], chartInfo['chart'], chartInfo['options']);
			prevSliderVal = ui.value;
		}, 
	});

	return sliderId;

}

function addSoundButtons(plotNum, controlDiv, tones, delays){

	// Create a play button for each type of song
	var playMainSongButton = 'play-main-'+plotNum;
	$('#'+controlDiv).append('<input id="' + playMainSongButton + '" class="btn" type="button" value="Play Main Song"/>');

	var playFilterSongButton = 'play-filter-'+plotNum;
	$('#'+controlDiv).append('<input id="' + playFilterSongButton + '" class="btn" type="button" value="Play Filter Song"/>');

	var playResultSongButton = 'play-both-'+plotNum;
	$('#'+controlDiv).append('<input id="' + playResultSongButton + '" class="btn" type="button" value="Play Result Song"/>');	

	$('#'+playMainSongButton).click(function(){
		playSingleTone(tones[0], delays[0]);		 
	});

	$('#'+playFilterSongButton).click(function(){
		playSingleTone(tones[1], delays[1]);		 
	});

	$('#'+playResultSongButton).click(function(){
		playBothTones(tones, delays[1]);		 
	});

}

function buildControlUI(plotNum, currDiv){

	var controlDiv = currDiv + '-control-'+plotNum;
	$('#'+currDiv).append('<div id="' + controlDiv + '"></div>');
	$('#'+controlDiv).css('width', CHART_WIDTH, 'display', 'inline');
	
	return controlDiv;
}

{% endblock extra %}

{% block visuals %}
[
	function (){

		var plotNum = 1;

		// Render the wave chart
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with same frequency added to obtain a resulting wave';
		var delays = [0, -NUM_POINTS/6];

		var curveMain = new Curve(2, 1, delays[0]);
		var curveFilter = new Curve(2, 1, delays[1]);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);
		var curves = [curveMain, curveFilter, curveResult];

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		renderPlot(this.attr('id'), plotNum, curves, origCurves, title, colors);

		// Render play buttons for each song
		var controlDiv = buildControlUI(plotNum, this.attr('id'));
		addSoundButtons(plotNum, controlDiv, [TONES[0], TONES[1]], delays);
		
		
	},

	function (){

		var plotNum = 2;

		// Render chart
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with different frequencies added to obtain a resulting wave'
		var delays = [0, -NUM_POINTS/6];
										
		var curveMain = new Curve(2, 1, delays[0]);
		var curveFilter = new Curve(2, 1, delays[1]);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);
		var curves = [curveMain, curveFilter, curveResult];

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		var chartInfo = renderPlot(this.attr('id'), plotNum, curves, origCurves, title, colors);

		// Render controlUI, reset button, slider
		var controlDiv = buildControlUI(plotNum, this.attr('id'));
		var sliderId = addSlider(plotNum, controlDiv, curves, chartInfo);
		addResetButton(plotNum, controlDiv, curves, origCurves, chartInfo, sliderId);
	}, 

	function (){

		var plotNum = 3;

		// Render chart
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with different frequencies added to obtain a resulting wave'
		var delays = [0, 0];
										
		var curveMain = new Curve(2, 1, delays[0]);
		var curveFilter = new Curve(10, 1, delays[1]);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);
		var curves = [curveMain, curveFilter, curveResult];

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		renderPlot(this.attr('id'), plotNum, curves, origCurves, title, colors);

		// Render play buttons for each song
		var controlDiv = buildControlUI(plotNum, this.attr('id'));
		addSoundButtons(plotNum, controlDiv, [TONES[0], TONES[2]], delays);
	},

	function (){},

	function (){

		var plotNum = 4;

		// Render chart
		var colors = ['#999999', '#139bdf', '#333333'];
		var title = 'Two waves with different frequencies added to obtain a resulting wave'
		var delays = [0, 0];
										
		var curveMain = new Curve(2, 1, delays[0]);
		var curveFilter = new Curve(10, 1, delays[1]);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);
		var curves = [curveMain, curveFilter, curveResult];

		var origCurves = buildOriginalCurves(curveMain.frequency, curveMain.amplitude, curveMain.xshift, curveFilter.frequency, curveFilter.amplitude, curveFilter.xshift);

		var chartInfo = renderPlot(this.attr('id'), plotNum, curves, origCurves, title, colors);

		// Render controlUI, reset button, slider
		var controlDiv = buildControlUI(plotNum, this.attr('id'));
		var sliderId = addSlider(plotNum, controlDiv, curves, chartInfo);
		addResetButton(plotNum, controlDiv, curves, origCurves, chartInfo, sliderId);
	},

	function (){}
]

{% endblock visuals %}

/***********Web Audio Sandbox*************/
/*function setupWebAudio(){
	var context = new webkitAudioContext();
	var source = context.createBufferSource();
	var songName = SONG_DIR + '200Hz-5sec' + SONG_EXT;

	$.ajax({type : "GET", 
			url: songName,

    	    beforeSend: function( xhr ){
	    	    xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
	        }, 

			success: function(data){
				context.decodeAudioData(data, function(decoded_data){
					// Store the decoded buffer data in the source object
	    			source.buffer = decoded_data;
	 
				    // Connect the source node to the Web Audio destination node
		            source.connect( context.destination ); 		
				});
			}, 

			async:false,

			});
	return source;
}*/
