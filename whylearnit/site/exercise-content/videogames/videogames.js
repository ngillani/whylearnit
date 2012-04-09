/******************************************************
videogames.js

@author sbirch
@date 4.8.2012
**************************************************/

WhyLearnIt.packetLoaded((function(){

	var questions = [<% for question in questions %>'<%question%>'<% if not forloop.last%>, <% endif %><% endfor %>];
	var hints = [<% for hint in hints %>'<%hint%>'<% if not forloop.last%>, <% endif %><% endfor %>];
	var reponseTypes = [<% for responseType in responseTypes %>'<%responseType%>'<% if not forloop.last%>, <% endif %><% endfor %>];
	var choices = [<% for choices in questionChoices %><% for choice in choices %>'<%choice%>'<% if not forloop.last%>, <% endif %><% endfor %><% if not forloop.last%>, <% endif %><% endfor %>];

	var packet = {
		id: 'videogames',
		title: '<%title%>',
		description: '<%description%>',
		video: '<%video-link%>',
		related: [<% for related_id in related %>'<%related_id%>'<% if not forloop.last%>, <% endif %><% endfor %>],
		exercises: [] //see loop below for format
	};

	for(var i=0;i<questions.length;i++){
		packet.exercises.push({
			question: questions[i],
			hint: hints[i],
			responseType: responseTypes[i],
			choices: choices[i]
		});
	}

	return packet;
})());