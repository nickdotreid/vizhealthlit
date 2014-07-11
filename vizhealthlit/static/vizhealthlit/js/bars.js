function draw_bars(items){

	var display_paragraphs = true;

	var sentences = []
	items.forEach(function(d){
		d.sentences.forEach(function(s){
			s.paragraph = d;
			sentences.push(s);
		});
	});

	var color = d3.scale.linear()
	.domain([
		d3.min(sentences,function(d){ return d.score; }),
		d3.max(sentences,function(d){ return d.score; })
	]).range(['#004636','#779492']);

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
	
	var barWidth = chart.width()/sentences.length;
	var canvas = svg.append("g");
	var items = canvas.selectAll("g").data(items).enter().append("g");


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

	var xpos = 0;
	items.attr("transform",function(d){
		xpos += this.getBBox().width;
		return "translate("+(xpos - this.getBBox().width)+","+0+")";
	});
	
	canvas.attr("transform",function(){
		if(display_paragraphs){
			return "translate("+(chart.width()/2 - this.getBBox().width/2)+",0)";
		}
		return "translate(0,0)";
	});
}

visualization_functions['bars'] = draw_bars;