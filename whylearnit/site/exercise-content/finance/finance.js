/******************************************************
finance.js
Code for producing visualizations for finance exercises
(Money.F-LE)

@author ngillani
@date 3.30.12



**************************************************/

/* Debugging!
$.ajaxSetup({"error":function(XMLHttpRequest,textStatus, errorThrown) {
  alert(textStatus);
  alert(errorThrown);
  alert(XMLHttpRequest.responseText);
}});*/

// Constants!
var CHART_WIDTH = 600;
var CHART_HEIGHT = 300;

// File names for company stock data to visualize
var _allCompanyData = {};
_allCompanyData['Yahoo'] = '/site/exercise-content/finance/stock-data/yahoodata_march2011_march2012.csv';
_allCompanyData['Microsoft'] = '/site/exercise-content/finance/stock-data/microsoftdata_march2011_march2012.csv';
_allCompanyData['Infospace'] = '/site/exercise-content/finance/stock-data/infospacedata_march2011_march2012.csv';

var _allPriceData = {};

// Crack open the csv files and aggregate data to plot
function init(){

	$.each(_allCompanyData, function(key, value){

			// Retrieve stock data and store closing prices
			var request = $.ajax({type : "GET", url : value, async : false});
				
			request.done(					
					function(data){
						var lines = data.split('\n');
					
						_allPriceData[key] = new Array();

						// Start at 1 to avoid the 'Close' text!
						for(var i = 1; i < lines.length; i++){
							_allPriceData[key].push(parseFloat(lines[i].split(',')[4]));
						}

					}
			);
		}
			
	);	
}

function findMaxEntries(){

	var numPrices = 0;
	for(var company in _allPriceData){
		if(_allPriceData[company].length > numPrices){
			numPrices = _allPriceData[company].length;
		}
	}

	_allPriceData['days'] = new Array();
	for(var i = 1; i <= numPrices; i++){
		_allPriceData['days'].push(i);
	}

	return numPrices;
}

function renderInteractiveContent(){

	// Build array of all company names
	var keyArray = [];
	for(key in _allCompanyData){
		keyArray.push(key);
	}

	drawChart(keyArray, 'interactive-1');
}

function drawChart(companiesToPlot, elementId){
	
	var numPrices = findMaxEntries();
	var data = new google.visualization.DataTable();
	
	// Add column for days
	data.addColumn('string', 'days');

	// Add columns for each company	
	for(var company in companiesToPlot){
		data.addColumn('number', companiesToPlot[company]);
	}


	// Now, add rows
	for(var i=0; i < numPrices; i++){

		var rowArray = new Array();
		rowArray.push(""+_allPriceData['days'][i]);

		for(var company in companiesToPlot){
			rowArray.push(_allPriceData[companiesToPlot[company]][i]);
		}

		data.addRow(rowArray);
	}

	// Now, define options
	var options = {
		width : CHART_WIDTH,
		height: CHART_HEIGHT,
		vAxis: {title : 'Price in USD($)'},
		hAxis: {title: 'Day ranging from March 30, 2011 to March 30, 2012'},
		seriesType: 'line',
	};

	var chart = new google.visualization.LineChart(document.getElementById(elementId));
	chart.draw(data, options);
}

function retrieveSelectedCompany(){
	// First, get the company that the student has chosen
	var chosenCompany = "";
	$('.response-medium', '#exercise-1').each(function(){
		chosenCompany = $(this).find('input:radio:checked')[0].value;
	});

	return chosenCompany;
}

//exerciseToRenderFor - the numerical value of the next exercise
function refreshAllExerciseContent(exerciseToRenderFor){
	
	for(var i = 2; i <= exerciseToRenderFor; i++){
		drawChart([retrieveSelectedCompany()], 'interactive-'+exerciseToRenderFor);
	}
}
