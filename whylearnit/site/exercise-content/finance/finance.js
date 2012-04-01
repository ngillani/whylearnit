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
var JS_FILE = 'finance.js';

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
	drawFirstChart();
}

function drawFirstChart(){
	
	var numPrices = findMaxEntries();
	var data = new google.visualization.DataTable();
	
	// Add column for days
	data.addColumn('string', 'days');

	// Add columns for each company	
	for(var company in _allCompanyData){
		data.addColumn('number', company);
	}

	// Now, add rows
	for(var i=0; i < numPrices; i++){

		var rowArray = new Array();
		rowArray.push(""+_allPriceData['days'][i]);

		for(var company in _allCompanyData){
			rowArray.push(_allPriceData[company][i]);
		}

		data.addRow(rowArray);
	}

	// Now, define options
	var options = {
		width : 500,
		height: 300,
		vAxis: {title : 'Price in USD($)'},
		hAxis: {title: 'Day ranging from March 30, 2011 to March 30, 2012'},
		seriesType: 'line',
	};

	var chart = new google.visualization.LineChart(document.getElementById("interactive-1"));
	chart.draw(data, options);
}
