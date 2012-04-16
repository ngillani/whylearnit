
/******************************************************
  finance.js
  Code for producing visualizations for finance exercises
  (Money.F-LE)

  @author ngillani
  @date 3.30.12

  @author jconnuck
  @date 4.12.12

 **************************************************/

{% extends "packet.js" %}
{% block extra %}

var CHART_WIDTH = 600;
var CHART_HEIGHT = 300;

// File names for company stock data to visualize
var _allCompanyData = {};
_allCompanyData['Yahoo'] = '/site/exercise-content/finance/stock-data/yahoodata_march2011_march2012.csv';
_allCompanyData['Microsoft'] = '/site/exercise-content/finance/stock-data/microsoftdata_march2011_march2012.csv';
_allCompanyData['Infospace'] = '/site/exercise-content/finance/stock-data/infospacedata_march2011_march2012.csv';

var _allPriceData = {};

(function init () {
  $.each(_allCompanyData, function(key, value) {
    // Retrieve stock data and store closing prices
    var request = $.ajax({type : "GET", url : value, async : false});
    request.done(function(data){
      var lines = data.split('\n');

      _allPriceData[key] = new Array();

      // Start at 1 to avoid the 'Close' text!
      for(var i = 1; i < lines.length; i++){
        _allPriceData[key].push(parseFloat(lines[i].split(',')[4]));
      }
    });
  });	
})();

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

  var colors;
  if (companiesToPlot.length > 1) {
    colors = ['#dc3912', '#3366cc', '#ff9900'];
  } else if (companiesToPlot[0] == "Microsoft") {
    colors = ['#3366cc'];
  } else if (companiesToPlot[0] == 'Yahoo') {
    colors = ['#dc3912'];
  } else {
    colors = ['#ff9900'];
  }

  // Now, define options
  var options = {
    width : CHART_WIDTH,
    height: CHART_HEIGHT,
    vAxis: {title : 'Price in USD($)'},
    hAxis: {title: 'Day ranging from March 30, 2011 to March 30, 2012'},
    seriesType: 'line',
    colors: colors
  }

  var chart = new google.visualization.LineChart(document.getElementById(elementId));
  chart.draw(data, options);
}

function findMaxEntries() {
  var numPrices = 0;
  for(var company in _allPriceData){
    if (!_allPriceData.hasOwnProperty(company)){continue;}
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

{% endblock extra %}

{% block visuals %}
[ 
// render visual 1
// note this when called is the '#interactive-n' jQuery div
function (data) {
  drawChart(Object.keys(_allCompanyData), this.attr('id'));
},

function (data) {
  drawChart([data[1] || 'Microsoft'], this.attr('id'));
},

function (data) {
  drawChart([data[1] || 'Microsoft'], this.attr('id'));
}
]
{% endblock visuals %}



