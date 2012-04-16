/******************************************************
videogames.js

@author sbirch
@date 4.8.2012
**************************************************/

{% extends "packet.js" %}

{% block visuals %}
[
	function (data) {
		this.append($("#videogames-visual-1").html())
	},
	function (data){
		
	},
	function (data){
		
	},
	function (data){
		
	},
	function (data){
		
	},
	function (data){

	}
];
{% endblock visuals %}


{% block packet_mods %}

packet.exercises = [];
var i = 1;
while(document.getElementById('videogames-exercises-' + i)){
	packet.exercises.push({
		exid: i,
		question: $('#videogames-exercises-' + i).html(),
		hint: '',
		responseType: '',
		choices: [],
		visual: visuals[i-1]
	});
	i++;
}

console.log(packet)

{% endblock packet_mods %}