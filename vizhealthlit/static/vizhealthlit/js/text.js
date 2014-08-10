var TextModel = Backbone.Model.extend({
	initialize:function(){
		var model = this;
		this.on("change:items",function(){
			model.generateScores();
		});
	},
	getSentences: function(){
		var items = this.get("items");
		if(!items) return [];

		var sentences = [];
		items.forEach(function(d){
			d.sentences.forEach(function(s){
				s.paragraph = d;
				sentences.push(s);
			});
		});
		return sentences;
	},
	getSettings: function(){
		return {
			formula:this.get("formula"),
		};
	},
	generateScores: function(){
		var sentences = this.getSentences();
		var settings = this.getSettings();
		var items = this.get("items");
		if(!items) return false;
		if(settings['formula'] == 'custom'){
			if(!settings['sentences_threshold_min']) settings['sentences_threshold_min'] = d3.min(items,function(d){ return d.sentences.length; });
			if(!settings['sentences_threshold_max']) settings['sentences_threshold_max'] = d3.max(items,function(d){ return d.sentences.length; });

			if(!settings['words_threshold_min']) settings['words_threshold_min'] = d3.min(sentences,function(d){ return d.words.length; });
			if(!settings['words_threshold_max']) settings['words_threshold_max'] = d3.max(sentences,function(d){ return d.words.length; });

			
			function score(d, type){
				d.score = 1;

				var length_max = settings[type+'_threshold_max']
				var length_min = settings[type+'_threshold_min']

				var length = d.words.length;
				if(d.sentences) length = d.sentences.length;
				
				if(length < length_min){
					d.score += length - length_min;
				}
				if(length > length_max){
					d.score += length_max - length;
				}

				if(d.sentences) d.sentences.forEach(function(s){ d.score += s.score; });

				d.score += d.active_words - d.passive_words;
			}
		}else if(items[0][settings['formula']]){
			function score(d, type){
				d.score = d[settings['formula']];
			}
		}else{
			return;
		}

		function wordScore(d){
			d.wordScore = 0;
			if(!settings.words || settings.words.length < 1) return;
			d.words.forEach(function(w){
				if(settings.words.indexOf(w) >= 0) d.wordScore++;
			});
		}

		items.forEach(function(d){
			d.sentences.forEach(function(s){
				score(s,'words');
				wordScore(s);
			});
			score(d,'sentences');
			wordScore(d);
		});

		var items_max = d3.max(items, function(d){ return d.score; });
		var sentences_max = d3.max(items, function(d){ return d.score; });

		items.forEach(function(d){
			if(d.score > items_max) d.score = items_max;
			d.sentences.forEach(function(s){ if(s.score > sentences_max) s.score = sentences_max; });
		});

		return items;
	}
});

var UploadView = Backbone.View.extend({
	tagName: "div",
	className: "text-upload",
	events:{
		"submit form": "updateText",
	},
	updateText: function(event){
		event.preventDefault();
		var view = this;
		var form = this.$('form');
		this.$el.addClass("loading");

		$.ajax({
			url: form.attr("action"),
			type: form.attr("method"),
			data:form.serializeArray(),
			complete:function(){
				view.$el.removeClass("loading");
			},
			success:function(data){
				if(data['form']){
					form.after(data['form']);
					form.remove();
					return;
				}
				view.model.set(data);
				view.trigger("uploaded");
			},
		});
	},
});

var TextView = Backbone.View.extend({
	tagName:"div",
	className:"text-view",
	events:{

	},
	initialize: function() {
		this.listenTo(this.model, "change", this.render);
	},
	render: function(){
		var view = this;
		this.$el.html(this.model.get("text"));
		this.model.get("items",[]).forEach(function(item){
			view.scoreGroup(item);
		});
		return this;
	},
	scoreGroup: function(item){
		var view = this;
		item.sentences.forEach(function(sentence){
			view.scoreSentence(sentence);
		});
		if(item.sentences.length == 1){
			view.$(".score:last").addClass("paragraph-score");
		}else{
			var formula = this.model.get("formula");
			$(".score:last",view.$el).after('<span class="score paragraph-score">('+formatNumber(item[formula]) + ')</span>');
		}
	},
	scoreSentence: function(item){
		var html = this.$el.html();
		var parts = html.split(item.text);

		var formula = this.model.get("formula");
		if(parts[0]) this.$el.html(parts[0]);
		this.$el.html(this.$el.html() + item.text + "<span class='score'>"+ "("+ formatNumber(item[formula]) +")" +"</span>");
		if(parts[1]) this.$el.html(this.$el.html() + parts[1]);
		return true;
	},
});

function formatNumber(num){
	return Math.round(num *100)/100;
}

var SettingsView = Backbone.View.extend({
	events:{
		"click .formulas a":"scoreUpdate",
	},
	render:function(event){
		return this;
	},
	scoreUpdate: function(event){
		event.preventDefault();
		this.$(".formulas .active").removeClass("active");
		var button = $(event.currentTarget).parents("li:first");
		button.addClass("active");
		this.model.set({
			'formula':button.data("formula"),
		});
	}
})