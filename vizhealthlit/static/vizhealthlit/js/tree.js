function draw_tree(data){
	var chart=$("#chart");
	chart.html("");

	chart.height($('form').height());
	chart.css("position","relative");

	var newdata = [];
	for(d in data){
		newdata.push({
			name:d,
			size:data[d].length,
			words:data[d],
			children:[],
		});
	}
	data = {
		name:"foozle",
		children:newdata,
	}

	var color = d3.scale.category20();

	var treemap = d3.layout.treemap()
	    .size([chart.width(), chart.height()])
	    .sticky(true)
	    .value(function(d) { return d.size; });

	function position() {
  	this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
	}

	var div = d3.select("#chart");
	div.datum(data).selectAll('.node')
		.data(treemap.nodes)
		.enter().append("div").attr('class','node')
		.call(position)
		.style('background-color',function(d){
			return color(d.name);
		})
		.style('position','absolute')
		.attr('data-words',function(d){ return d.words; })
		.attr('data-name',function(d){ return d.name; });

	$("#chart .node").click(function(event){
		event.preventDefault();
		alert($(this).data("name")+"\n"+$(this).data("words"));
	});
}

visualization_functions['tree'] = draw_tree;