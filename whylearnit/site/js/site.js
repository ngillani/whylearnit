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
        console.log(nextId);
        for (var i = currId; i < nextId; ++i) {
          $("#exercise-" + i).show();
          $("#exercise-" + i).removeClass('alert-info').addClass('alert-success');
          $(".btn-primary", "#exercise-" + i).removeClass('btn-primary').addClass('btn-success');
        }
        $("#exercise-" + nextId).show();
        $('html, body').animate({
          scrollTop: $('#exercise-' + nextId).offset().top - 158
        }, 1000);
}
