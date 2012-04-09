WhyLearnIt.packetLoaded((function(){
    // this should be overwritten with a function that returns
    // the html to be injected into the visual
    {% block render_visual %}
    {% endblock render_visual %}

    {% block load_exercises %}
        var exercises = [
        {% for question in questions %}
          {
              exid: {{forloop.counter}},
              question: "{{question.text}}",
              hint: "{{question.hint}}",
              responseType: "{{question.responseType}}",
              choices: "{{question.choices}}",
              visual: visuals[{{forloop.counter0}}]
          } {% if not forloop.last %}, {% endif %}
        {% endfor %}
        ]
    {% endblock load_exercises %}

    // individual packets can overwrite this info/extend it, but 
    // this is probably never necessary 
    var packet = {
          {% block packet %}
                    id: '{{id}}',
                    title: '{{title}}',
                    description: '{{description}}',
                    video: '{{videolink}}',
                    related: "{{related}}", 
                    exercises: exercises,
          {% endblock packet %}
    };
    return packet;

})());
