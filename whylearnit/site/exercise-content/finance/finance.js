/******************************************************
Code for producing visualizations for finance exercises
(Money.F-LE)

@author ngillani
@date 3.30.12



**************************************************/

// Debugging!
/*$.ajaxSetup({"error":function(XMLHttpRequest,textStatus, errorThrown) {
  alert(textStatus);
  alert(errorThrown);
  alert(XMLHttpRequest.responseText);
}});*/

// File names for company stock data to visualize
var _allCompanyData = {};
_allCompanyData['Yahoo'] = 'exercise-content/finance/stock-data/yahoodata_march2011_march2012.csv';
_allCompanyData['Microsoft'] = 'exercise-content/finance/stock-data/microsoftdata_march2011_march2012.csv';
_allCompanyData['Infospace'] = 'exercise-content/finance/stock-data/infospacedata_march2011_march2012.csv';

// Crack open the csv files and aggregate data to plot
function prepareStockData(){

	for(var company in _allCompanyData){
		$.get(_allCompanyData[company], 
				
				function(data){
					alert(data);
					var lines = data.split('\n');
				}
		);

			
	}	
}
