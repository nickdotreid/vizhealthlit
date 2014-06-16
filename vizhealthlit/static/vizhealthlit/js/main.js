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
				draw_streams(data['words']['meanings']);
			},
		});
	});
});

function draw_streams(data){
	var chart=$("#chart");
	chart.html("");

	var svg = d3.select("#chart").append("svg:svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

	var num = 0;
	var rect = svg.selectAll("rect")
	    .data(data)
	  .enter().append("rect")
	    .attr("x", function(d) { num += 1; return num; })
	    .attr("y", 0)
	    .attr("width", 1)
	    .attr("height", function(d){ return d; });
}