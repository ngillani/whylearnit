/*************************************************
site.js
Houses the common javascript for whylearn.it

@authors sbirch, jconnuck, ngillani
@date 3.31.12


*************************************************/
var _currData = null;

// Function that takes dictionary of exercise
// data and populates the appropriate divs.  
// TODO:  Fill it in!
function populateExerciseContent(data){

	_currData = data;
	// First, let's plug in the right video + the packet intro text
	var videoCode = "<iframe class=\"youtube-player\" type=\"text/html\" width=\"640\" height=\"385\" src=\"" + data['AllMetadata']['VideoLink'] + "\" frameborder=\"0\"></iframe>";

	$('#watch-main-video').append(videoCode);

	$('#packet-intro-text').append(data['AllMetadata']['Description']);

	// Now, for each question, fill in the content in the corresponding div
	var numQuestions = data['AllQuestions'].length;
	for(var i = 1; i <= numQuestions; i++){
		var currId = '#exercise-' + i;
		$("p", currId).append(data['AllQuestions'][i-1]['QuestionText']);

		// TODO:  Write in the hint as well!
	}

	

}

// Shows next exercise by toggling the display to be not none
function showNextExercise(currExercise){
        var currExerciseID = '#exercise-' + currExercise;
        $(currExerciseID).removeClass('alert-info').addClass('alert-success');
        $('.next-button', currExerciseID).removeClass('btn-primary').addClass('btn-success');
	var nextExerciseId = 'exercise-' + (currExercise + 1);
	$('#'+nextExerciseId).css('display', 'block');
}
