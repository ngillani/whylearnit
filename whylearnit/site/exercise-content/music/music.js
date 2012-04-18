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

function Curve(frequency, amplitude, xshift){		

	this.frequency = frequency;
	this.amplitude = amplitude;
	this.xshift = xshift;
	this.gridIncrement = 2*Math.PI*this.frequency / GRAPH_WIDTH;

	this.initializePoints = function(){
		this.ypoints = [];

		for(var i = 0; i <= GRAPH_WIDTH; i++){
			this.ypoints[i] = GRAPH_HEIGHT/2 + this.amplitude*Math.sin((i+xshift)*this.gridIncrement);
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

	var combinedCurve = [];
	ctx.strokeStyle = filterColor;
	ctx.beginPath();
	if(deltax > 0){

		newYPoints = [];
		for(var i = GRAPH_WIDTH; i > 0; i--){
			newYPoints[(i+shiftAmount) % GRAPH_WIDTH] = this.ypoints[i];
			combinedCurve[(i+shiftAmount) % GRAPH_WIDTH] = this.ypoints[i]+curvemainY[i] - GRAPH_HEIGHT/2;
		}

		moveTo(0, newYPoints[0]);
		for(var i = 1; i <= GRAPH_WIDTH; i++){
			console.log("x: " + i + " y: " + newYPoints[i]);
			ctx.lineTo(i, newYPoints[i]);
			ctx.stroke();
		}
		this.ypoints = newYPoints;
		/*moveTo(GRAPH_WIDTH, this.ypoints[GRAPH_WIDTH-1]);
		temp = this.ypoints[GRAPH_WIDTH];
		for(var i = GRAPH_WIDTH; i > 0; i--){
			this.ypoints[i] = this.ypoints[i-1];
			combinedCurve[i] = this.ypoints[i] + curvemainY[i] - GRAPH_HEIGHT/2;

			if(i-2 >= 0){
				ctx.lineTo(i-1, this.ypoints[i-2]);
				ctx.stroke();
			}
			
		}
		this.ypoints[0] = temp;
		combinedCurve[0] = this.ypoints[0] + curvemainY[0];

		ctx.lineTo(0, temp);
		ctx.stroke();*/

	}
	else{	
		moveTo(0, this.ypoints[1]);
		temp = this.ypoints[0];
		for(var i = 0; i < GRAPH_WIDTH; i++){
			this.ypoints[i] = this.ypoints[i+1];
			combinedCurve[i] = this.ypoints[i] + curvemainY[i] - GRAPH_HEIGHT/2;

			if(i+2 <= GRAPH_WIDTH){
				ctx.lineTo(i+1, this.ypoints[i+2]);
				ctx.stroke();
			}
		}
		this.ypoints[GRAPH_WIDTH] = temp;
		combinedCurve[GRAPH_WIDTH] = this.ypoints[GRAPH_WIDTH] + curvemainY[GRAPH_WIDTH];

		ctx.lineTo(GRAPH_WIDTH, temp);
		ctx.stroke();
	}

	ctx.closePath();
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

CombinedCurve.prototype.draw = function(color, ypoints, ctx){
	Curve.prototype.draw(color, ypoints, ctx);
}

CombinedCurve.prototype.setYPoints = function(ypoints){
	this.ypoints = ypoints;
}

function Graph(gridcolor, axiscolor){

	this.gridcolor = gridcolor;
	this.axiscolor = axiscolor;

	this.renderGraph = function(){

		// Draw the graph
		for(var i = 0; i <= GRAPH_WIDTH; i++){
			
		}

	}
	this.renderGraph();

	this.drawLegend = function(colors, titles, ctx){

		for(var i = 0; i < colors.length; i++){
			ctx.beginPath();
			ctx.rect(GRAPH_WIDTH - GRAPH_WIDTH/4, (i+1)*GRAPH_HEIGHT/30 + i*5, 20,10);
			ctx.fillStyle = colors[i];
			ctx.fill();
			
		}
	}
	
}

/* Responsible for rendering plots for each exercise*/
function renderPlot(currDiv, plotNum){
	
	// First, put a canvas in the div identified by currDiv
	var currChartId = 'chart-'+parseFloat(plotNum);
	$('#'+currDiv).append('<canvas id="' + currChartId + '"></canvas>');

	$('#'+currChartId).css('width',GRAPH_WIDTH);
	$('#'+currChartId).css('height',GRAPH_HEIGHT);
	$('#'+currChartId).css('background-color', 'white');

	// Next, define a context	
	var c = document.getElementById(currChartId);
	var ctx = c.getContext('2d');
	ctx.canvas.width = GRAPH_WIDTH;
	ctx.canvas.height = GRAPH_HEIGHT;

	// Now, create + draw the appropriate curves!
	var colors = ['#999999', '#139bdf', '#333333'];

	var curveMain = new Curve(3, -GRAPH_HEIGHT/8, -10);
	var curveFilter = new Curve(3, -GRAPH_HEIGHT/8, 0);
	var curveResult = new CombinedCurve([curveMain.ypoints, curveFilter.ypoints]);
	curveMain.draw(colors[0], curveMain.ypoints, ctx);
	curveFilter.draw(colors[1], curveFilter.ypoints, ctx);
	curveResult.draw(colors[2], curveResult.ypoints, ctx);

	// Now, create the grid for the graph + draw!
	var graph = new Graph();
	curveLabels = ['Main Song', 'Filter Song', 'Resulting Song'];
	graph.drawLegend(colors, curveLabels, ctx);

	// Lastly, set up the slider and bind callback to be triggered when using the slider!
	var sliderId = 'slider-'+parseFloat(plotNum);
	$('#'+currDiv).append('<div id="' + sliderId + '"></div>');
	console.log($('#'+currDiv).html());

	var prevSliderVal = 0;

	$('#'+sliderId).slider({slide : function(event, ui){
			ctx.clearRect(0,0,GRAPH_WIDTH, GRAPH_HEIGHT);
			combinedY = curveFilter.translateAndRedraw(ui.value - prevSliderVal, curveMain.ypoints, colors[1], ctx, 2);

			curveResult.setYPoints(combinedY);

			// Redraw curves
			curveMain.draw(colors[0], curveMain.ypoints, ctx);
			curveResult.draw(colors[2], curveResult.ypoints, ctx);

			// Redraw graph
			graph.drawLegend(colors, curveLabels, ctx);
		
			prevSliderVal = ui.value;
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
		renderPlot(this.attr('id'), 1);
	},

	function (){
		renderPlot(this.attr('id'), 2);
	}
]

{% endblock visuals %}
