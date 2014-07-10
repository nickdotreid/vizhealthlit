function draw_bars(data){
	var barHeight=20;

	var chart=$("#chart");
	chart.html("");
	chart.height(barHeight*data.length);

	var color = d3.scale.category10();

	var svg = d3.select("#chart").append("svg:svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

	var x = d3.scale.linear().domain([
		d3.min(data,function(d){ return d.length; }),
		d3.max(data, function(d){ return d.length; })
		]).range([
			0,
			chart.width()
		]);
	
	var bars = svg.selectAll("g").data(data).enter().append("g")
		.attr("transform", function(d,i){
		return "translate(0,"+barHeight*i+")";
	});
	bars.append("rect").attr({
		height:barHeight,
		width:function(d){
			return x(d.length);
		},
		fill:function(d){
			return color(d.score);
		},
	});
}

visualization_functions['bars'] = draw_bars;