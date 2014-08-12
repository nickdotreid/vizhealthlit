var VizView = Backbone.View.extend({
	initialize: function() {
		var el = $('<div></div>').appendTo(this.$el);
		this.setElement(el[0]);
		this.listenTo(this.model, "updated", this.update);
		this.render();
	},
	updateHeight: function(){
		var navBarHeights = _.reduce($(".navbar:visible"), function(num, div){
			return $(div).height() + num;
		}, 0);
		this.$el.height($(window).height() - navBarHeights);
	}
});

var TextView = VizView.extend({
	render: function(){
		this.updateHeight();
		this.$el.addClass('words-hightlight');
		this.$el.css("overflow","auto");
		this.stopListening(this.model,"highlight");

		var view = this;
		var model = this.model;
		this.$el.html(this.model.get("text"));
		this.model.get("items",[]).forEach(function(item){
			view.scoreGroup(item);
		});
		this.$('.score:not(.paragraph-score)').each(function(){
			var sentence = $(this);
			sentence.hover(function(){
				model.highlight()
			}, function(){

			});
		});

		this.$(".sentence").each(function(){
			var sentence = $(this);
			var timeout = false;
			sentence.hover(function(){
				var text = $(this).text();
				timeout = setTimeout(function(){
					model.highlight(text);
				}, 500);
			},function(){
				if(timeout) clearTimeout(timeout);
				model.unhighlight($(this).text());
			});
		});

		view.listenTo(model,'highlight',function(){
			this.$(".sentence").each(function(){
				var sentence = $(this);
				if(model.get("highlight") == sentence.text()){
					sentence.addClass("highlight");
					$.smoothScroll({
						scrollTarget: sentence,
						scrollElement: view.$el,
					});
				}else if(sentence.hasClass("highlight")){
					sentence.removeClass("highlight");
				}
			});
		});
		this.listenTo(model,'unhighlight', function(){
			view.$(".sentence").removeClass("highlight");
		});

		return this;
	},
	update: function(){
		this.render();
	},
	scoreGroup: function(item){
		var view = this;
		item.sentences.forEach(function(sentence){
			view.scoreSentence(sentence);
		});
		if(item.sentences.length == 1){
			view.$(".score:last").addClass("paragraph-score");
		}else{
			var formula = 'score';
			$(".score:last",view.$el).after('<span class="score paragraph-score">('+formatNumber(item[formula]) + ')</span>');
		}
	},
	scoreSentence: function(item){
		var html = this.$el.html();
		var parts = html.split(item.text);

		if(parts.length < 1){
			return false;
		}else if(parts.length > 2){
			return false;
		}
		var formula = 'score';
		if(parts[0]) this.$el.html(parts[0]);
		this.$el.html(this.$el.html() + '<span class="sentence">'+ item.text+ '</span>' + "<span class='score'>"+ "("+ formatNumber(item[formula]) +")" +"</span>");
		this.$el.html(this.$el.html() + parts[1]);

		var model = this.model;
		var element = this.$(".sentence:last");

		return true;
	},
});
vizViewDict['text'] = TextView;


function makeColors(items, settings){
	var hue = 115;
	var brightnessKey = 'score';
	var saturationKey = 'score';

	if(settings['words'] && settings['words'].length > 0){
		hue = 21;
		saturationKey = 'wordCount';
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