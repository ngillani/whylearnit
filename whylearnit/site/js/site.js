/*************************************************
site.js
Houses the common javascript for whylearn.it

@authors sbirch, jconnuck, ngillani
@date 3.31.12


*************************************************/

var V_WIDTH = 650;
var V_HEIGHT = 450;
var _currData = null;

// Shows exercise by toggling the display to be not none
function goToEx(currId, nextId) {
        var numQuestions = $('.exercise').length;

        if (nextId > numQuestions) {
          console.log("100");
          var percent = 100;

		  openPrintPage();

        }
        else {
          for (var i = currId; i < nextId; ++i) {
            $("#exercise-" + i).show();
            $("#exercise-" + i).removeClass('alert-info').addClass('alert-success');
            $(".btn-primary", "#exercise-" + i).removeClass('btn-primary').addClass('btn-success');
          }
          $("#exercise-" + nextId).show();
          $('html, body').animate({
            scrollTop: $('#exercise-' + nextId).offset().top - 158
          }, 1000);
          var percent = (nextId - 1)* 100 / numQuestions; 

		  // If we are on the last question, change the button text appropriately
		  if(nextId == numQuestions){
		    $(".btn-main", "#exercise-" + nextId).html("Finish and Print");

		    // TODO:  Add email button?
		  }
        }

        $('#exercises-progress > .bar').width( percent + '%');
}

function openPrintPage(){

	  // TODO:  Build formatted print page, open new tab, open print dialog
	  window.open("", "_newtab");
}
