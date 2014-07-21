function draw_pizza(items, settings){
	var chart = $("#chart");
	var svg = d3.select("#chart").append("svg:svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

	var totalLength = 0;
	items.forEach(function(d){
		totalLength += d.words.length;
	});

	var degree = d3.scale.linear()
	.domain([0, totalLength])
	.range([0,360]);

	var radius = d3.scale.linear()
	.domain([0,totalLength])
	.range([0, function(){
		if(chart.width() > chart.height()) return chart.height()/4;
		return chart.width()/4
	}])

	svg.selectAll("g.wedge").data(items)
	.enter().append("g").attr("class","wedge")

}


visualization_functions['pizza'] = draw_pizza;