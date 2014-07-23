function draw_pizza(items, settings){
	var chart = $("#chart");
	var svg = d3.select("#chart").append("svg:svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

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
	]).range(['#3c783e','#00ea13']);

	var totalLength = 0;
	items.forEach(function(d){
		totalLength += d.words.length;
	});

	var degree = d3.scale.linear()
	.domain([0, totalLength])
	.range([0,(Math.PI * 2)]);


	var highestScore = d3.max(items, function(d){
		return d.similarity;
	});
	function scoreJitter(d){
		var s = d.similarity/highestScore;
		if(s > 0.8) return 0;
		return 1-s;
	}

	var lPos = 0;
	var rPos = 0;
	var goingRight = true;
	function arcPosition(radians){
		var start = 0;
		var end = 0;

		if(lPos == rPos){
			lPos = 0-(radians/2);
			rPos = 0+(radians/2);
			start = lPos;
			end = rPos;
		}else if(goingRight){
			goingRight = false;
			start = rPos;
			rPos += radians;
			end = rPos;
		}else{
			goingRight = true;
			start = lPos;
			lPos -= radians;
			end = lPos;
		}

		return {
			'start':start,
			'end':end,
		}
	}

	items.sort(function(a,b){
		if(a.similarity < b.similarity){
			return -1;
		}else if(a.similarity > b.similarity){
			return 1;
		}
		return 0;
	}).reverse();

	var container = svg.append("g");
	container.attr("transform","translate("+(chart.width()/2)+","+(chart.height()/2)+")");
	var paragraphs = container.selectAll("g.wedge").data(items)
	.enter().append("g").attr("class","wedge")
	.each(function(d){

		var r = chart.height()/4;

		var rPos = 0;
		var paragraphFraction = d.words.length/totalLength;
		var paragraphArea = Math.PI * r * r * paragraphFraction;
		var paragraphVal = d.words.length;
		var currentVal = 0;

		var arcPos = arcPosition(degree(d.words.length));
		var start = arcPos['start'];
		var end = arcPos['end'];

		var arc = d3.svg.arc()
		.innerRadius(function(){
			return rPos;
		})
		.outerRadius(function(d){
			currentVal += d.words.length;
			var currentArea = paragraphArea * (currentVal/paragraphVal);
			rPos = Math.sqrt((currentArea*(1/paragraphFraction))/Math.PI);
			return rPos;
		})
		.startAngle(start)
		.endAngle(end);

		d3.select(this).attr("transform",function(){
			var distance = r/4 * scoreJitter(d);
			var angle = start + (end - start)/2;
			var xpos = Math.sin(angle) * distance;
			var ypos = Math.cos(angle) * distance * -1;
			return "translate("+xpos+","+ypos+")";
		}).selectAll("path").data(function(){
			return d.sentences;
		}).enter()
		.append("path").attr("d",arc)
		.style("fill",function(d){
			return color(d.score);
		});
	});

	var sentences = paragraphs.selectAll("path");
}


visualization_functions['pizza'] = draw_pizza;