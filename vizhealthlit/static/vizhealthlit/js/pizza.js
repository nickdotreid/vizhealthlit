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
		return d.score;
	});
	function scoreJitter(d){
		return 0;
		var s = d.score/highestScore;
//		if(s > 0.8) return 0;
		return 1-s;
	}

	// For any wedge, return a function that describes the inner rings
	function describeArcs(p,r,start,end){
		var paragraphFraction = p.words.length/totalLength;
		var paragraphArea = Math.PI * r * r * paragraphFraction;

		// These will get incremented
		var rPos = 0;
		var currentVal = 0;
		
		// describe each ring
		return function(s){
			var innerRadius = rPos;
			
			currentVal += s.words.length;
			var currentArea = paragraphArea * (currentVal/p.words.length);
			rPos = Math.sqrt((currentArea*(1/paragraphFraction))/Math.PI);

			outerRadius = rPos;
			return {
				'innerRadius':innerRadius,
				'outerRadius':outerRadius,
				'startAngle':start,
				'endAngle':end,
			}
		}
	}
	function makeArcFromObj(obj){
		return d3.svg.arc()
		.innerRadius(obj['innerRadius'])
		.outerRadius(obj['outerRadius'])
		.startAngle(obj['startAngle'])
		.endAngle(obj['endAngle'])
		();
	}

	function makeColors(items, settings){
		var hue = 115;
		var brightnessKey = 'score';
		var saturationKey = 'score';

		if(settings['words'] && settings['words'].length > 0){
			hue = 21;
			saturationKey = 'wordScore';
		}

		var brightness = d3.scale.linear()
		.domain([
			d3.min(items,function(d){ return d[brightnessKey]; }),
			d3.max(items,function(d){ return d[brightnessKey]; })
		]).range([20,80]);
		
		var saturation = d3.scale.linear()
		.domain([
			d3.min(items,function(d){ return d[saturationKey]; }),
			d3.max(items,function(d){ return d[saturationKey]; })
		]).range([0,100]);

		return function(d){
			var cstr = "hsl("+hue+","+saturation(d[saturationKey])+"%,"+brightness(d[brightnessKey])+"%)";
			return d3.hsl(cstr).toString();
		}
	}

	function makeWedgePositions(){
		var pos = {
			'right':0,
			'left':0,
		}
		var direction = false;
		return function(radians){
			var start = 0;
			var end = 0;
			if(!direction){
				start = 0-(radians/2);
				end = 0+(radians/2);
				pos['left'] = start;
				pos['right'] = end;
			}else{
				start = pos[direction];
				if(direction == 'left') radians = radians * -1;
				end = start + radians;
				pos[direction] = end;
			}

			if(direction == 'left') direction='right';
			else direction = 'left';

			return {
				'start':start,
				'end':end,
			}
		}
	}

	var container = svg.append("g");
	container.attr("transform","translate("+(chart.width()/2)+","+(chart.height()/2)+")");

	var originalColor = color;
	function blit(items, settings){
		// update data
		items.sort(function(a,b){
			if(a.score < b.score){
				return -1;
			}else if(a.score > b.score){
				return 1;
			}
			return 0;
		}).reverse();

		var sentences = []
		items.forEach(function(d){
			d.sentences.forEach(function(s){
				sentences.push(s);
			});
		});

		var color = makeColors(sentences, settings);

		container.selectAll("g.wedge").data(items)
		.enter().append("g").attr("class","wedge");

//		container.selectAll("g.wedge").data(items).exit().remove();

		arcPosition = makeWedgePositions();
		// update elements
		container.selectAll("g.wedge").each(function(d){
			var r = chart.height()/2;

			var arcPos = arcPosition(degree(d.words.length));
			var start = arcPos['start'];
			var end = arcPos['end'];

			dArc = describeArcs(d,r, start, end);

			var arc = d3.svg.arc()
			.innerRadius(0)
			.outerRadius(0)
			.startAngle(start)
			.endAngle(end);

			d3.select(this).selectAll("path")
			.data(d.sentences)
			.enter()
			.append("path").attr("d",arc)
			.style("fill","#FFFFFF")
			.attr("stroke","white").attr("stroke-width","1")
			.each(function(d){
				/*** ADDS HOVER STATE FOR EACH SENTENCE ****/
				var timeout = false;
				$(this).hover(function(){
					timeout = setTimeout(function(){
						timeout = false;
						hoverSentence(d);
					},150);
				}, function(){
					if(timeout){
						clearTimeout(timeout);
					}else{
						clearSentence(d);
					}
				});
			})
			d3.select(this).selectAll("path").data(d.sentences)
			.exit()
			.transition().duration(250)
			.style("fill","#FFFFFF")
			.remove();

			d3.select(this).selectAll("path")
			.data(d.sentences)
			.datum(function(d){
				var currentArc = {
					'startAngle':0,
					'endAngle':0,
					'innerRadius':0,
					'outerRadius':0,
				}
				if(!d.toArc) d.fromArc = currentArc;
				else d.fromArc = d.toArc;
				d.toArc = dArc(d);
				return d;
			})

			d3.select(this).selectAll("path")
			.attr("d",function(d){
				return d3.svg.arc()(d.toArc);
			});

			d3.select(this).selectAll("path").transition()
			.duration(2750)
			.style("fill",function(d){
				return color(d);
			})
			.attrTween("d",function(d){
				var interp = d3.interpolateObject(d.fromArc, d.toArc);
				return function(t){
					var objArc = interp(t);
					return d3.svg.arc()(objArc);
				}
			});
		});
	}
	blit(items,settings);
	return blit;
}




visualization_functions['pizza'] = draw_pizza;