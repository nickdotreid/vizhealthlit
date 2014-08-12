var PizzaVizView = VizView.extend({
	events:{

	},
	render: function(){

		var chart = this.$el;
		var navBarHeights = _.reduce($(".navbar"), function(num, div){
			return $(div).height() + num;
		}, 0);
		chart.height($(window).height() - navBarHeights);

		var svg = d3.select(this.el).append("svg:svg")
			.attr("width", chart.width())
			.attr("height", chart.height());

		var container = svg.append("g");
		container.attr("transform","translate("+(chart.width()/2)+","+(chart.height()/2)+")");

		var items = [];
		var settings = {};
		var totalLength = 0;
		var degree = function(){};
		var highestScore = 0;

		// For any wedge, return a function that describes the inner rings
		function describeArcs(p,r,start,end, totalLength){
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
					pos['left'] = (Math.PI * 2) + start;
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

		function fullArcs(p,r){
			var paragraphArea = Math.PI * r * r;

			var makeArcs = makeWedgePositions();

			var degree = d3.scale.linear()
			.domain([0, p.words.length])
			.range([0,(Math.PI * 2)]);
			
			// describe each wedge
			return function(s){
				var angles = makeArcs(degree(s.words.length));
				return {
					'innerRadius':0,
					'outerRadius':r,
					'startAngle':angles['start'],
					'endAngle':angles['end'],
				}
			}
		}

		var model = this.model;
		var view = this;
		function blit(){

			var items = model.get("items");
			if(!items) return;
			var settings = model.getSettings();

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

			var active_wedge = _.reduce(view.$(".wedge"),function(m,w){
				if(!m) return $(w).attr("class").indexOf("active") > -1;
				return m;
			}, false);

			arcPosition = makeWedgePositions();
			// update elements
			container.selectAll("g.wedge").each(function(d){
				d.sentences.sort(function(a,b){
					if(a.score < b.score){
						return -1;
					}else if(a.score > b.score){
						return 1;
					}
					return 0;
				}).reverse();

				var r = chart.height()/3;

				var arcPos = arcPosition(degree(d.words.length));
				var start = arcPos['start'];
				var end = arcPos['end'];

				dArc = describeArcs(d,r, start, end, totalLength);
				dWedge = fullArcs(d,r);

				var arc = d3.svg.arc()
				.innerRadius(0)
				.outerRadius(0)
				.startAngle(start)
				.endAngle(end);

				d3.select(this).selectAll("path")
				.data(d.sentences)
				.enter()
				.append("path")
				.attr("stroke","white").attr("stroke-width","2");

				d3.select(this).selectAll("path").data(d.sentences)
				.exit()
				.remove();

				d3.select(this).selectAll("path")
				.data(d.sentences)
				.datum(function(d){
					var currentArc = {
						'startAngle':start,
						'endAngle':end,
						'innerRadius':0,
						'outerRadius':0,
					}
					if(!d.toArc) d.fromArc = currentArc;
					else d.fromArc = d.toArc;

					if(active_wedge){
						if($(this).parent().attr("class").indexOf("active") > -1){
							d.toArc = dWedge(d);	
						}else{
							d.toArc = currentArc;
						}
						return d;
					}
					d.toArc = dArc(d);
					return d;
				});

				var step = 750;
				var trans = d3.select(this).selectAll("path").transition().duration(1);

				if(active_wedge){
					trans = trans.transition()
					.duration(step)
					.attrTween("d",function(d){
						// dont animate parts in current wedge
						if($(this).parent().attr("class").indexOf("active") > -1) return ;
						// shrink down other items
						var interp = d3.interpolateObject(d.fromArc, d.toArc);
						return function(t){
							return d3.svg.arc()(interp(t));
						}
					});

					trans = trans.transition()
					.duration(step)
					.attrTween("d",function(d){
						if($(this).parent().attr("class").indexOf("active") < 0) return ;
						var interp = d3.interpolateObject(d.fromArc, {
							'startAngle':d.toArc['startAngle'],
							'endAngle':d.toArc['endAngle'],
						});
						return function(t){
							var objArc = interp(t);
							return d3.svg.arc()(objArc);
						}
					});

					trans = trans.transition()
					.duration(step)
					.attrTween("d",function(d){
						if($(this).parent().attr("class").indexOf("active") < 0) return ;
						var interp = d3.interpolateObject({
							'innerRadius':d.fromArc['innerRadius'],
							'outerRadius':d.fromArc['outerRadius'],
						}, d.toArc);
						return function(t){
							var objArc = interp(t);
							return d3.svg.arc()(objArc);
						}
					});
				}else{
					trans = trans.transition()
					.duration(step/2)
					.style("fill",function(d){
						return color(d);
					});

					trans = trans.transition()
					.duration(step)
					.attrTween("d",function(d){
						// animate angle
						var toArc = d.toArc;
						var fromArc = d.fromArc;

						var interp = d3.interpolateObject(fromArc, toArc);
						return function(t){
							var objArc = interp(t);
							return d3.svg.arc()(objArc);
						}
					});
				}
			});
			
			container.selectAll("path").each(function(d){
				$(this).unbind("click");
				$(this).bind("click",function(){
					view.$(".wedge.active").attr("class","wedge");
					if(!active_wedge) $(this).parent().attr("class","wedge active");
					blit();
				});

				$(this).unbind("mouseenter").unbind("mouseleave");
				var timeout = false;
				$(this).hover(function(){
					var item = d3.select(this);
					timeout = setTimeout(function(){
						timeout = false;
						item.each(function(d){
							model.highlight(d.text);
						});
					},150);
				}, function(){
					var item = d3.select(this);
					if(timeout){
						clearTimeout(timeout);
					}else{
						item.each(function(d){
							model.unhighlight(d.text);
						});
					}
				});
			});

			view.stopListening(model,'highlight');
			view.listenTo(model,'highlight unhighlight',function(){
				d3.selectAll("path").each(function(d){
					if(d.text == model.get("highlight")){
						d3.select(this).attr("stroke","black");
					}else{
						d3.select(this).attr("stroke","white");
					}
				});
			});
		}
		blit();

		this.stopListening(this.model);
		this.listenTo(this.model,'updated',function(){
			view.$(".wedge.active").attr("class","wedge");
			blit();
		});

		return this;
	}
});
vizViewDict['pizza'] = PizzaVizView;