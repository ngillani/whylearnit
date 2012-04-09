/*************************************************
site.js
Houses the common javascript for whylearn.it

@authors sbirch, jconnuck, ngillani
@date 3.31.12


*************************************************/


var V_WIDTH = 650;
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
		$("p", currId).append(data['AllQuestions'][i-1]['QuestionText']);

		// If this is a multiple choice question, write the choices
		if(data['AllQuestions'][i-1]['Choices'] != null){

			var buttonHtmlRoot = '<input type="radio" name="group1" value="';
			for(var c = 0; c < data['AllQuestions'][i-1]['Choices'].length; c++){

				// Make the first choice checked by default
				var checked = '';
				if(c == 0){
					checked = 'checked';
				}

				$(".response-medium", currId).append(buttonHtmlRoot + data['AllQuestions'][i-1]['Choices'][c] +'" ' + checked + '>' + data['AllQuestions'][i-1]['Choices'][c]);	
			}
		}

		// Otherwise, write a text area
		else{
			$(".response-medium", currId).append('<textarea></textarea>');
		}
				

		// TODO:  Write in the hint as well!
	}	
}

// Shows next exercise by toggling the display to be not none
function showNextExercise(currExercise){

	// First, update the interactive content 
	refreshAllExerciseContent(currExercise+1);		

	// Show the next exercise!
	var numExercises = $('.exercise').length;
    var currExerciseID = '#exercise-' + currExercise;
    $(currExerciseID).removeClass('alert-info').addClass('alert-success');
    $('.next-button', currExerciseID).removeClass('btn-primary').addClass('btn-success');
	var nextExerciseId = 'exercise-' + (currExercise + 1);
	$('#'+nextExerciseId).css('display', 'block');

	// update progress bar
	$('#exercises-progress').find('.bar').width(100 * currExercise/numExercises + '%');
}
