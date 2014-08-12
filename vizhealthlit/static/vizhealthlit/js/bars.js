var BarsVizView = VizView.extend({
	events:{

	},
	render:function(){
		var display_paragraphs = true;

		this.updateHeight();
		var chart = this.$el;
		var svg = d3.select(this.el).append("svg:svg")
			.attr("width", chart.width())
			.attr("height", chart.height());

		var canvas = svg.append("g");

		function makeJitter(){
			var momentum = 0;
			return function(d){
				var score = 0;
				if(d.sentences){
					if( 3 <= d.sentences.length <= 5) score += 1;
				}else{
					if(
						(!settings['words_threshold_min'] || settings['words_threshold_min'] == "" || settings['words_threshold_min'] <= d.words.length)
						&& (!settings['words_threshold_max'] || settings['words_threshold_max'] == "" || settings['words_threshold_max'] >= d.words.length)
						) score += 1;
				}
				return score;
			}
		}
		var view = this;
		var model = this.model;
		var first = true;
		var update = function(){

			var items = model.get("items");
			if(!items) return;
			var settings = model.getSettings();

			var jitter = makeJitter();
			var sentences = []
			items.forEach(function(d){
				d.sentences.forEach(function(s){
					s.paragraph = d;
					sentences.push(s);
				});
			});

			var color = makeColors(sentences,settings);

			var y = d3.scale.linear().domain([
					0,
					d3.max(items, function(d){ return d.length; })
				]).range([
					0,
					chart.height()/2
				]);
			
			var barWidth = chart.width()/sentences.length;
			
			var groups = canvas.selectAll("g")
			.data(items).enter()
			.append("g")		
			.each(function(d){
				d3.select(this).selectAll("rect.sentence")
				.data(d.sentences).enter()
				.append("rect").attr("class","sentence")
				.attr({
					fill:"#FFFFFF",
					width:barWidth,
					height:function(d){
						return y(d.length);
					},
					x:chart.width()/2,
					y:chart.height()/2,		
				});
			});

			var xOffset = 0;
			if(display_paragraphs){
				xOffset = (chart.width()/2) - ((items.length*barWidth)/2);
			}
			var xpos=xOffset;
			canvas.selectAll("g").each(function(d){
				ypos=chart.height()/2;

				if(display_paragraphs){
					var height = 0;
					d3.select(this).selectAll("rect").each(function(d){
						height += Math.abs(this.getBoundingClientRect().top - this.getBoundingClientRect().bottom);
					});
					ypos -= height/2;
				}

				y = 0-this.getBBox().height/2 ;
				if(display_paragraphs) y += this.getBBox().height/4 * jitter(d);

				var t = d3.select(this).selectAll("rect");
				var animations = {
					fill: function(step){
						t = t
						.transition()
						.duration(step)
						.attr("fill",color);					
					},
					x: function(step){
						t = t.transition()
						.duration(step)
						.attr("x",function(d){
							if(display_paragraphs) return xpos;
							xpos += barWidth;
							return xpos - barWidth;
						});
					},
					y: function(step){
						t = t.transition()
						.duration(step)
						.attr("y",function(d){
							if(!display_paragraphs){
								var height = Math.abs(this.getBoundingClientRect().top - this.getBoundingClientRect().bottom);
								var y = 0-height/2;
								//y += height * jitter(d);
								return ypos + y;
							}  
							var y = ypos;
							ypos += this.getBBox().height;
							return y;
						});
					}
				}
				if(first){
					first = false;
					animations['fill'](10);
					animations['x'](10);
					animations['y'](10);
				}else if(display_paragraphs){
					animations['fill'](500);
					animations['y'](500);
					animations['x'](500);
				}else{
					animations['fill'](500);
					animations['x'](500);
					animations['y'](500);
				}
				if(display_paragraphs) xpos += barWidth;
			});
			
			view.stopListening(model,'highlight');
			view.listenTo(model,'highlight unhighlight',function(){
				d3.selectAll("rect").each(function(d){
					if(d.text == model.get("highlight")){
						d3.select(this).attr("stroke","black").attr("stroke-width",2);
					}else{
						d3.select(this).attr("stroke","white").attr("stroke-width",0);
					}
				});
			});
		}

		update();

		this.stopListening(this.model);
		this.listenTo(this.model,'updated',function(){
			update();
		});

		var view = this;
		var timeout = false;
		chart.delegate('rect','click',function(){
			if(timeout) clearTimeout(timeout);
			if(display_paragraphs){
				display_paragraphs = false;
			}else{
				display_paragraphs = true;
			}
			update();
		}).delegate('rect','mouseenter',function(){
			var element = d3.select(this);
			timeout = setTimeout(function(){
				element.each(function(d){
					model.highlight(d.text);
				});
			}, 500);
		}).delegate('rect','mouseleave',function(){
			if(timeout) clearTimeout();
			d3.select(this).each(function(d){
				model.unhighlight(d.text);
			});
		});

		return this;

	},
});

vizViewDict['bars'] = BarsVizView;