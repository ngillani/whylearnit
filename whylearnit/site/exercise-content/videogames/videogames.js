/******************************************************
videogames.js

@author sbirch
@date 4.8.2012
**************************************************/

{% extends "packet.js" %}

{% block render_visual %}
var visuals = [ function (data) {
	console.log('visuals loaded')
	return '<p style="color: blue">Visual Oooooh</p>';
}]

{% endblock render_visual %}


{% block packet_mods %}
	console.log('does this work?');
{% endblock packet_mods %}