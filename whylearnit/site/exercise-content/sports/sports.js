/*****************************************************
  sports.js
  Code for producing interactive elements for sports
  exercises
  (Sports.S-ID)

  @author ngillani
  @date 5.1.12

 **************************************************/

{% extends "packet.js" %}
{% block extra %}
google.load('visualization', '1.0', {'packages':['corechart']});

var CHART_WIDTH = 500,
	CHART_HEIGHT = 300,
    STAT_CATEGORIES = {
		'Games' : 0, 'Games Started' : 1, 'Minutes Per Game' : 2, 
		'Field Goal %' : 3, '3-Point %' : 4, 'Free Throw %' : 5, 
		'Offensive Rebounds' : 6, 'Defensive Rebounds' : 7, 
		'Rebounds Per Game' : 8, 'Assists Per Game' : 9, 'Steals Per Game' : 10, 
		'Blocks Per Game' : 11, 'Turnovers' : 12, 'Personal Fouls' : 13, 'Points Per Game' : 14
	};

// File names for company stock data to visualize
var _allPlayerData = {};
_allPlayerData['Kobe Bryant'] = '/site/exercise-content/sports/player-data/kobe_bryant.csv';
_allPlayerData['Lebron James'] = '/site/exercise-content/sports/player-data/lebron_james.csv';
_allPlayerData['Dirk Nowitzki'] = '/site/exercise-content/sports/player-data/dirk_nowitzki.csv';
_allPlayerData['Dwight Howard'] = '/site/exercise-content/sports/player-data/dwight_howard.csv';
_allPlayerData['Kevin Durant'] = '/site/exercise-content/sports/player-data/kevin_durant.csv';

// TODO:  For testing only - remove!
var CURR_PLAYER = 'Kobe Bryant';

var _allStatsData = {};

(function init () {
  $.each(_allPlayerData, function(key, value) {
    // Retrieve stock data and store closing prices
    var request = $.ajax({type : "GET", url : value, async : false});
    request.done(function(data){
	  console.log('stats for: ' + key + '\n');
      var lines = data.split('\n');

      _allStatsData[key] = [[]];

	  // For each season in the league
      for (var i = 0; i < lines.length; i++){

		var currSeasonStats = lines[i].split(',');
		_allStatsData[key][i] = new Array();

        // Start at 2 to avoid the season and team info!
        // Don't consider the last entry because it is an empty string
		for (var j = 2; j < currSeasonStats.length - 1; j++){		
	        _allStatsData[key][i].push(parseFloat(currSeasonStats[j]));
		}
      }

    });
  });	
})();

function drawStatsVisual(companiesToPlot, chosenCategory, elementId){

  var chartId = elementId + '-chart';
  $('#'+elementId).css('display','inline');
  $('#'+elementId).html('<div id="' + chartId + '"></div>');
  var data = new google.visualization.DataTable();
  

  // First, build the table that we will use to create our visualization
  // Add columns for each company	
  data.addColumn('number', chosenCategory[0]);
  data.addColumn('number', chosenCategory[1]);

  // Now, add rows
  for(var i=0; i < _allStatsData[CURR_PLAYER].length - 1; i++){

    var rowArray = new Array();

    rowArray.push(_allStatsData[CURR_PLAYER][i][STAT_CATEGORIES[chosenCategory[0]]]);
    rowArray.push(_allStatsData[CURR_PLAYER][i][STAT_CATEGORIES[chosenCategory[1]]]);

    data.addRow(rowArray);
  }

  var colors = ['#139bdf'];

  // Now, define options
  var options = {
    width : CHART_WIDTH,
    height: CHART_HEIGHT,
    hAxis: {title : chosenCategory[0]},
    vAxis: {title: chosenCategory[1]},
    seriesType: 'scatter',
	title: chosenCategory[0] + ' vs. ' + chosenCategory[1],
	legend: 'none',
    colors: colors
  }

  var chart = new google.visualization.ScatterChart(document.getElementById(chartId));
  chart.draw(data, options);

  // Build the button chart
  var selectIds = addSelectBoxes(elementId);
  bindEventsToSelectBoxes(selectIds, chosenCategory, data, chart, options);
}

function addSelectBoxes(elementId){

	var selectIds = [];

	var selectPaneId = elementId + '-all-selects';
	var selectHtml = '<div id="' + selectPaneId + '" style="float:left;">';

	for(var col = 0; col < 2; col++){
		selectIds[col] = elementId + '-select-' + col;

		selectHtml += (col == 0 ? 'X: ' : 'Y: ') + '<select id="' + selectIds[col] + '" style="width:150px;margin-right:30px;">';

		for(stat in STAT_CATEGORIES){
			selectHtml += '<option value="' + stat + '">' + stat + '</option>';
		}

		selectHtml += '</select>';
	}

	selectHtml += '</div><br/>';

	// Write to the DOM
	$('#'+elementId).append(selectHtml);
	//$('#'+selectPaneId).css('float', 'left', 'padding-right', '20px', 'width', CHART_WIDTH);

	return selectIds;
}

function bindEventsToSelectBoxes(selectIds, chosenCategory, chartData, chart, options){
	for(var col = 0; col < 2; col++){

		$('#'+selectIds[col]).change(
			{currId : selectIds[col],
			 chartData : chartData,
			 chart : chart,
			 options : options,
			 allCategories : chosenCategory,
			 currCol : col
			},

			function(event){
				event.data.allCategories[event.data.currCol] = $('#' + event.data.currId + ' option:selected').text();
				console.log(event.data.allCategories[event.data.currCol]);
				options['title'] = event.data.allCategories[0] + ' vs. ' + event.data.allCategories[1];
				options['hAxis'] = {title: event.data.allCategories[0]};
				options['vAxis'] = {title: event.data.allCategories[1]};
				updateStatsAndRedraw(event.data.allCategories, event.data.chartData, event.data.chart, event.data.options);
			});
	}
}

function updateStatsAndRedraw(chosenCategory, data, chart, options){

	data.setColumnProperties(0, {name: chosenCategory[0]});
	data.setColumnProperties(1, {name: chosenCategory[1]});

	for(var i = 0; i < _allStatsData[CURR_PLAYER].length - 1; i++){

		for(var j = 0; j < 2; j++){
//			alert(chosenCategory[j] + ' ' + _allStatsData[CURR_PLAYER][i][STAT_CATEGORIES[chosenCategory[j]]]);
			data.setValue(i,j,_allStatsData[CURR_PLAYER][i][STAT_CATEGORIES[chosenCategory[j]]]);
		}
	}

    chart.draw(data, options);
}

{% endblock extra %}

{% block visuals %}
[ 
// render visual 1
// note this when called is the '#interactive-n' jQuery div
function (data) {
  chosenCategory = ['Games','Games'];
  console.log('CURR ID: ' + this.attr('id'));
  drawStatsVisual(_allStatsData['Kobe Bryant'], chosenCategory, this.attr('id'));
},

function (data) {},
function (data) {},

function (data) {
  chosenCategory = ['Games','Games'];
  console.log('CURR ID: ' + this.attr('id'));
  drawStatsVisual(_allStatsData['Kobe Bryant'], chosenCategory, this.attr('id'));
},

function (data) {},
function (data) {}
]
{% endblock visuals %}

