var TextModel = Backbone.Model.extend({
	initialize:function(){
		var model = this;
		this.on("change",function(){
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
		if(items[0][settings['formula']]){
			function score(d, type){
				d.score = d[settings['formula']];
			}
		}else{
			if(!settings['paragraph_length_threshold']) settings['paragraph_length_threshold'] = _.max(items,function(d){ return d.sentences.length; });
			if(!settings['sentence_length_threshold']) settings['sentence_length_threshold'] = _.max(sentences,function(d){ return d.words.length; });
			
			function score(d, type){
				d.score = 0;
				if(d.sentences) d.sentences.forEach(function(s){ d.score += s.score; });

				var length_max = settings[type+'_length_threshold']
				var length = d.words.length;
				if(d.sentences) length = d.sentences.length;
				if(length > length_max){
					d.score += -1;
				}

				// add is score for weighted custom stuff
			}
		}

		function wordCount(d){
			d.wordCount = 0;
			if(!settings.words || settings.words.length < 1) return;
			d.words.forEach(function(w){
				if(settings.words.indexOf(w) >= 0) d.wordCount++;
			});
		}

		items.forEach(function(d){
			d.sentences.forEach(function(s){
				score(s,'sentence');
				wordCount(s);
			});
			score(d,'paragraph');
			wordCount(d);
		});

		this.trigger("updated");
		return this;
	}
});