/*************************************************
site.js
Houses the common javascript for whylearn.it

@authors sbirch, jconnuck, ngillani
@date 3.31.12


*************************************************/


var V_WIDTH = 700;
var V_HEIGHT = 450;
var _currData = null;

// Function that takes dictionary of exercise
// data and populates the appropriate divs.  
function populateExerciseContent(data){

	_currData = data;
	// First, let's plug in the right video + the packet intro text
	var videoCode = "<iframe class=\"youtube-player\" type=\"text/html\" width=\""+ V_WIDTH + "\" height=\""+ V_HEIGHT +"\" src=\"" + data['AllMetadata']['VideoLink'] + "?wmode=transparent\" frameborder=\"0\" wmode=\"Opaque\"></iframe>";

	$('#watch-main-video').append(videoCode);

	$('#video-title').append(data['AllMetadata']['Name']);

	$('#packet-intro-text').append(data['AllMetadata']['Description']);

	// Now, for each question, fill in the content in the corresponding div
	var numQuestions = data['AllQuestions'].length;
	for(var i = 1; i <= numQuestions; i++){
		var currId = '#exercise-' + i;
		$("p.question", currId).append(data['AllQuestions'][i-1]['QuestionText']);

		// TODO:  Check to see if there are any choices for a given question.  If so, populate as radio buttons
				

		// TODO:  Write in the hint as well!
                $(".hint", currId).attr('data-content', data['AllQuestions'][i-1]['Hint']);
                //$(".hint", currId).append(data['AllQuestions'][i-1]['Hint']);
	}	

        $('.hint').popover({
          "title": "Hint"
        });

}

// Shows next exercise by toggling the display to be not none
function showNextExercise(currExercise){
	var numExercises = $('.exercise').length;
        var currExerciseID = '#exercise-' + currExercise;
        $(currExerciseID).removeClass('alert-info').addClass('alert-success');
        $('.next-button', currExerciseID).removeClass('btn-primary').addClass('btn-success');
	var nextExerciseId = 'exercise-' + (currExercise + 1);
	$('#'+nextExerciseId).css('display', 'block');

	// update progress bar
	$('#exercises-progress').find('.bar').width(100 * currExercise/numExercises + '%');
}
