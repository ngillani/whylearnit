/******************************************************
videogames.js

@author sbirch
@date 4.8.2012
**************************************************/

{% extends "packet.js" %}

{% block visuals %}
[
	function (data) {
		//visualization resize hooks
		this.append($("#videogames-visual-1").html());
	},
	function (data){
		this.append($("#videogames-visual-2").html());
	},
	function (data){
		this.append($("#videogames-visual-3").html());
	},
	function (data){
		this.append($("#videogames-visual-4").html());
	},
	function (data){
		this.append($("#videogames-visual-5").html());
	},
	function (data){
		this.append($("#videogames-visual-6").html());
	},
	function (data){
		this.append($("#videogames-visual-7").html());
	}
];
{% endblock visuals %}


{% block packet_mods %}

packet.video = 'Yo4YY8xRUAs'
packet.description = $('#videogames-description').html();

packet.exercises = [];
var i = 1;
while(document.getElementById('videogames-exercises-' + i)){
	var ts = i;
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