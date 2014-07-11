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

	function blit(){
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

		var momentum = 0;
		function scoreJitter(d){
			var score = 0;
			if(d.sentences){
				if( 3 <= d.sentences.length <= 5) score += 1;
			}else{
				if( 8 <= d.words.length <= 10) score += 1;
			}

			return score;

		}

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
					if(!display_paragraphs){
						y = 0-this.getBBox().height/2;
						y += this.getBBox().height/4 * scoreJitter(d);
						return y;
					}  
					var y = ypos;
					ypos += this.getBBox().height;
					return y;
				}
			})
		});

		var xpos = 0;
		items.attr("transform",function(d){
			y = 0;
			if(display_paragraphs) y = 0-this.getBBox().height/2 ;
			if(display_paragraphs) y += this.getBBox().height/4 * scoreJitter(d);
			var translate = "translate("+xpos+","+y+")";
			xpos += this.getBBox().width;
			return translate;
		});
		
		canvas.attr("transform",function(){
			var x = chart.width()/2 - this.getBBox().width/2;
			var y = chart.height()/2 - this.getBBox().height/2;
			return "translate("+ x +","+ y +")";
		});		
	}

	blit();

	chart.delegate('rect','click',function(){
		if(display_paragraphs){
			display_paragraphs = false;
		}else{
			display_paragraphs = true;
		}
		blit();
	})
}

visualization_functions['bars'] = draw_bars;