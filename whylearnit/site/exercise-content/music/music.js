/******************************************************
  music.js
  Code for producing visualizations for music exercises
  (Music.F-TF)

  @author ngillani
  @date 4.17.12

 **************************************************/
{% extends "packet.js" %}

{% block extra %}

// Dimensions in pixels			
var GRAPH_WIDTH = 500;
var GRAPH_HEIGHT = 300;
var ONE_EQUIV = GRAPH_HEIGHT/8;

function Curve(frequency, amplitude, xshift){		

	this.frequency = frequency;
	this.amplitude = amplitude;
	this.xshift = xshift;
	this.gridIncrement = 2*Math.PI / GRAPH_WIDTH;

	this.initializePoints = function(){
		this.ypoints = [];

		for(var i = 0; i <= GRAPH_WIDTH; i++){
			this.ypoints[i] = GRAPH_HEIGHT/2 + this.amplitude*Math.sin((i*this.frequency+xshift)*this.gridIncrement);
		}
	}
	this.initializePoints();




}

function CombinedCurve(allCurves){

	this.ypoints = [];
	this.allCurves = allCurves;

	this.initializePoints = function(){

		for(var j = 0; j <= GRAPH_WIDTH; j++){
			this.ypoints[j] = GRAPH_HEIGHT/2;
		}

		for(var i = 0; i < allCurves.length; i++){
			for(var j=0; j <= GRAPH_WIDTH; j++){
				this.ypoints[j] += allCurves[i][j] - GRAPH_HEIGHT/2;
			}
		}

	}
	this.initializePoints();
	
}

// This function is responsible for:
// 1.  Determining the new points for the "filter" curve
// 2.  Computing the new "combined curve" as a result
Curve.prototype.translateAndRedraw = function(deltax, curvemainY, filterColor, ctx, shiftAmount){

	var	newYPoints = [];
	var combinedCurve = [];
	this.xshift = this.xshift + shiftAmount*deltax;

	if(deltax > 0){
		for(var i = GRAPH_WIDTH; i >= 0; i--){
			newYPoints[(i+shiftAmount) % GRAPH_WIDTH] = this.ypoints[i];
			combinedCurve[(i+shiftAmount) % GRAPH_WIDTH] = this.ypoints[i]+curvemainY[i] - GRAPH_HEIGHT/2;
		}
	}
	else{	
		for(var i = 0; i <= GRAPH_WIDTH; i++){
			newYPoints[((i-shiftAmount)+GRAPH_WIDTH) % GRAPH_WIDTH] = this.ypoints[i];
			combinedCurve[((i-shiftAmount)+GRAPH_WIDTH) % GRAPH_WIDTH] = this.ypoints[i]+curvemainY[i] - GRAPH_HEIGHT/2;
		}
	}

	this.ypoints = newYPoints;
	return combinedCurve;
}

Curve.prototype.draw = function(color, ypoints, ctx){

	ctx.strokeStyle = color;
	ctx.beginPath();				
	ctx.moveTo(i,ypoints[0]);
	ctx.stroke();
	for(var i=1; i <= GRAPH_WIDTH; i++){
		ctx.lineTo(i,ypoints[i]);
		//console.log('X=' + i + ' Y=' + this.ypoints[i]);
		ctx.stroke();
	}
	ctx.closePath();
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

CombinedCurve.prototype.setYPoints = function(ypoints){
	this.ypoints = ypoints;
}

function Graph(gridcolor, stepx, stepy){

	this.gridcolor = gridcolor;
	this.stepx = stepx;
	this.stepy = stepy;

	this.renderGraph = function(ctx, eps){

		ctx.strokeStyle = this.gridcolor;

		// Draw the vertical grid lines
		for(var i = 0; i <= GRAPH_WIDTH; i+=this.stepx){
			ctx.moveTo(i, GRAPH_HEIGHT/2 - eps);
			ctx.lineTo(i, GRAPH_HEIGHT/2 + eps);
			ctx.stroke();

			var xVal = i/this.stepx;
			console.log(xVal);
			if(xVal % 4 == 0){
				ctx.fillStyle = '#000';
				ctx.fillText('yo', i, GRAPH_HEIGHT/2 + 2*eps);
			}
		}

		// Draw the horizontal grid lines
		var maxMarks = GRAPH_HEIGHT/(this.stepy*2);
		for(var i = 0; i <= GRAPH_HEIGHT; i+=this.stepy){
			ctx.moveTo(eps,i);
			ctx.lineTo(-eps, i);
			ctx.stroke();

			ctx.fillStyle = '#000';
			ctx.fillText(''+(maxMarks - i/this.stepy), 2*eps, i+eps);
		}

		// Draw horizontal axis
		ctx.moveTo(0, GRAPH_HEIGHT/2);
		ctx.lineTo(GRAPH_WIDTH, GRAPH_HEIGHT/2);
		ctx.stroke();

		// Draw in legend values

	}

	this.drawLegend = function(colors, titles, ctx){

		var boxWidth = 20;
		var boxHeight = 10;
		var eps = 5;
		for(var i = 0; i < colors.length; i++){
			ctx.beginPath();
			ctx.strokeStyle = colors[i];
			ctx.rect(GRAPH_WIDTH - GRAPH_WIDTH/4, (i+1)*GRAPH_HEIGHT/30 + i*eps, boxWidth, boxHeight);
			ctx.fillStyle = colors[i];
			ctx.fill();

			ctx.fillStyle = '#000';
			ctx.fillText(titles[i], GRAPH_WIDTH - GRAPH_WIDTH/4 + boxWidth + eps, (i+1)*GRAPH_HEIGHT/30 + i*eps + boxHeight/2 + eps);
			
		}
		
	}
	
}

/* Responsible for rendering plots for each exercise*/
function renderPlot(currDiv, plotNum, curves, graph, colors){
	
	// First, put a canvas in the div identified by currDiv
	var currChartId = 'chart-'+parseFloat(plotNum);
	$('#'+currDiv).append('<canvas id="' + currChartId + '"></canvas>');

	$('#'+currChartId).css('width',GRAPH_WIDTH);
	$('#'+currChartId).css('height',GRAPH_HEIGHT);
	$('#'+currChartId).css('background-color', 'white');
	$('#'+currChartId).css('border-radius', '5px');

	// Next, define a context	
	var c = document.getElementById(currChartId);
	var ctx = c.getContext('2d');
	ctx.canvas.width = GRAPH_WIDTH;
	ctx.canvas.height = GRAPH_HEIGHT;

	// Create the grid for the graph + draw!
	curveLabels = ['Main Song', 'Filter Song', 'Resulting Song'];
	var eps = 5;
	graph.drawLegend(colors, curveLabels, ctx, curveMain, curveFilter);
	graph.renderGraph(ctx, eps);

	// Plot the curves!
	var curveMain = curves[0];
	var curveFilter = curves[1];
	var curveResult = curves[2];
	curveMain.draw(colors[0], curveMain.ypoints, ctx);
	curveFilter.draw(colors[1], curveFilter.ypoints, ctx);
	curveResult.draw(colors[2], curveResult.ypoints, ctx);

	// Lastly, set up the slider and bind callback to be triggered when using the slider!
	var sliderId = 'slider-'+parseFloat(plotNum);
	$('#'+currDiv).append('<div id="' + sliderId + '"></div>');
	console.log($('#'+currDiv).html());

	var prevSliderVal = 0;

	$('#'+sliderId).slider({slide : function(event, ui){
			ctx.clearRect(0,0,GRAPH_WIDTH, GRAPH_HEIGHT);
			combinedY = curveFilter.translateAndRedraw(ui.value - prevSliderVal, curveMain.ypoints, colors[1], ctx, 3);

			curveResult.setYPoints(combinedY);

			// Redraw graph
			graph.drawLegend(colors, curveLabels, ctx, curves);
			graph.renderGraph(ctx, eps);
		
			// Redraw curves
			curveMain.draw(colors[0], curveMain.ypoints, ctx);
			curveFilter.draw(colors[1], curveFilter.ypoints, ctx);
			curveResult.draw(colors[2], curveResult.ypoints, ctx);

			prevSliderVal = ui.value;
			console.log(curveFilter.printFunction());
		}, 
		animate : true
	});

	// CSS for slider
	$('#'+sliderId).css('width',GRAPH_WIDTH);

}

{% endblock extra %}

{% block visuals %}
[
	function (){

		// Now, create + draw the appropriate curves!
		var colors = ['#999999', '#139bdf', '#333333'];
		var graph = new Graph('#000', GRAPH_WIDTH/16, GRAPH_HEIGHT/8);

		var curveMain = new Curve(4, -GRAPH_HEIGHT/8, 0);
		var curveFilter = new Curve(4, GRAPH_HEIGHT/8, GRAPH_WIDTH/4);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);

		renderPlot(this.attr('id'), 1, [curveMain, curveFilter, curveResult], graph, colors);
	},

	function (){
		// Now, create + draw the appropriate curves!
		var colors = ['#999999', '#139bdf', '#333333'];
		var graph = new Graph('#000', GRAPH_WIDTH/16, GRAPH_HEIGHT/8);
										
		var curveMain = new Curve(3, -GRAPH_HEIGHT/8, 0);
		var curveFilter = new Curve(2, GRAPH_HEIGHT/8, GRAPH_WIDTH/2);
		var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);

		renderPlot(this.attr('id'), 2, [curveMain, curveFilter, curveResult], graph, colors);
	}
]

{% endblock visuals %}
