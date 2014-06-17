var csrftoken = $.cookie('csrftoken');
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

$(window).resize(function(){
	var form = $('form');
	form.css({
		float:'left',
	});
	var chart = $('#chart');
	chart.css({
		float:'left',
		height:form.height(),
		width:form.parent().width() - form.width(),
	});
});

$(document).ready(function(){
	$(window).resize();
	$('form').submit(function(event){
		event.preventDefault();
		var form = $(this);
		$.ajax({
			url: form.attr("action"),
			type: form.attr("method"),
			data:form.serializeArray(),
			success:function(data){
				draw_streams(data['words']);
			},
		});
	});
});

function draw_streams(data){
	var chart=$("#chart");
	chart.html("");

	var color = d3.scale.category10();

	var svg = d3.select("#chart").append("svg:svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

	var val = function(d){
		return d.meanings + d.syllables;
	}

	var x = d3.scale.linear()
		.domain([0,data.length])
		.range([0,chart.width()]);
	var y = d3.scale.linear()
		.domain([d3.min(data, val),d3.max(data, val)])
		.range([0,chart.height()]);

	var num = 0;
	var rect = svg.selectAll("rect")
	    .data(data)
	  .enter().append("rect")
	    .attr("x", function(d) { num += 1; return x(num-1); })
	    .attr("y", function(d){ return chart.height()/2 - y(val(d))/2; })
	    .attr("width", chart.width()/data.length)
	    .attr("height", function(d){ return y(val(d)); })
	    .attr("fill", function(d){
	    	return color(d.stops);
	    });
}