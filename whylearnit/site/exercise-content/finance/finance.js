/******************************************************
  finance.js
  Code for producing visualizations for finance exercises
  (Money.F-LE)

  @author ngillani
  @date 3.30.12



 **************************************************/

{% extends "packet.js" %}
{% block render_visual %}
// Constants!
var CHART_WIDTH = 600;
var CHART_HEIGHT = 300;

// File names for company stock data to visualize
var _allCompanyData = {};
_allCompanyData['Yahoo'] = '/site/exercise-content/finance/stock-data/yahoodata_march2011_march2012.csv';
_allCompanyData['Microsoft'] = '/site/exercise-content/finance/stock-data/microsoftdata_march2011_march2012.csv';
_allCompanyData['Infospace'] = '/site/exercise-content/finance/stock-data/infospacedata_march2011_march2012.csv';

var _allPriceData = {};


util = { 
  init: function(){ // Crack open the csv files and aggregate data to plot
          $.each(_allCompanyData, function(key, value){
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
        },
  findMaxEntries: function(){
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
                  },
  renderInteractiveContent: function(elementId){
                              // Build array of all company names
                              var keyArray = [];
                              for(key in _allCompanyData){
                                keyArray.push(key);
                              }
                              this.drawChart(keyArray, elementId);
                            },
  retrieveSelectedCompany: function(){
                             // First, get the company that the student has chosen
                             var chosenCompany = "";
                             $('.response-medium', '#exercise-1').each(function(){
                               chosenCompany = $(this).find('input:radio:checked')[0].value;
                             });

                             return chosenCompany;
                           },
  refreshAllExerciseContent: function(){ //Update the charts for problems 2 and 3 based on the selected company
                               this.drawChart([this.retrieveSelectedCompany()], 'interactive-2');
                               this.drawChart([this.retrieveSelectedCompany()], 'interactive-3');
                             },
  choiceOnClick: function(){ // Generic function, called whenever a radio button is selected
                   this.refreshAllExerciseContent();
                 }
};

util.init.call(util);
var visuals = [ function () { util.renderInteractiveContent.call(util, 'interactive-1'); }]
{% endblock render_visual %}
