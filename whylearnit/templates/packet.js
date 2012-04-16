WhyLearnIt.packetLoaded((function(){
  {% block extra %}
  {% endblock extra %}

    
  var visuals = 
    {% block visuals%}
      // sample
      [ function (data) {
          console.log("visual 1: ", data);
        },
        function (data) {
          console.log("visual 2: ", data);
        }]
    {% endblock visuals %};

  var renderVisuals = function (data) {
    for (var i in visuals) {
      var n = 1 + parseInt(i);
      var selector = '#interactive-' + n;
      visuals[i].call($(selector), data);
    }
  }

  var exercises = 
    {% block load_exercises %}
    [ {% for question in questions %}
          {
              exid: {{forloop.counter}},
              question: "{{question.text}}",
              hint: "{{question.hint}}",
              responseType: "{{question.responseType}}",
              choices: {{question.choices|safe}},
              visual: visuals[{{forloop.counter0}}]
          } {% if not forloop.last %}, {% endif %}
      {% endfor %} ]
    {% endblock load_exercises %}

    // individual packets can overwrite this info/extend it, but 
    // this is probably never necessary 
  var packet = 
    {% block packet %}
    {
        id: '{{id}}',
        title: '{{title}}',
        description: '{{description}}',
        video: '{{videolink}}',
        related: "{{related}}", 
        exercises: exercises,
        renderVisuals: renderVisuals
    };
    {% endblock packet %} 

    {% block packet_mods %}
      //here you can put some javascript to break all the carefully constructed models & debug
    {% endblock packet_mods %}
   
    return packet;
})());

