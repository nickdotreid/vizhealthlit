function draw_bars(items){

	var display_paragraphs = true;

	var color = d3.scale.category10();

	var chart = $("#chart");
	var svg = d3.select("#chart").append("svg:svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

	var y = d3.scale.linear().domain([
			0,
			d3.max(items, function(d){ return d.length; })
		]).range([
			0,
			chart.height()/2
		]);
	
	var sentences = []
	items.forEach(function(d){
		d.sentences.forEach(function(s){
			s.paragraph = d;
			sentences.push(s);
		});
	});
	var barWidth = chart.width()/sentences.length;
	var items = svg.selectAll("g").data(items).enter().append("g");


	items.selectAll("rect").data(function(d){
		return d.sentences;
	}).enter().append("rect").attr({
		width:barWidth,
		height:function(d){
			return y(d.length);
		},
		fill:function(d){
			return color(d.score);
		},
	});
	items[0].forEach(function(d){
		ypos=0;
		xpos=0;
		d3.select(d).selectAll("rect").attr({
			x:function(d){
				if(display_paragraphs) return 0;
				xpos += barWidth;
				return xpos - barWidth;
			},
			y:function(d){
				if(!display_paragraphs) return this.getBBox().height/2;
				ypos += this.getBBox().height;
				return ypos - this.getBBox().height;
			}
		})
	});
}

visualization_functions['bars'] = draw_bars;