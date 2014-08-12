var TextModel = Backbone.Model.extend({
	initialize:function(){
		var model = this;
		this.on("change:formula change:items",function(eventName){
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
	setSetting:function(hash){
		for(key in hash){
			this.set(key,hash[key]);
		}
		this.generateScores();
		return this;
	},
	getSettings: function(){
		return {
			formula:this.get("formula"),
			paragraph_length_threshold:this.get("paragraph_length_threshold"),
			sentence_length_threshold:this.get("sentence_length_threshold"),
			positiveness_weight:this.get('positiveness_weight'),
			acitveness_weight:this.get('acitveness_weight'),
			directness_weight:this.get('directness_weight'),
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
			if(!settings['positiveness_weight']) settings['positiveness_weight'] = 1;
			if(!settings['acitveness_weight']) settings['acitveness_weight'] = 1;
			if(!settings['directness_weight']) settings['directness_weight'] = 1;

			function score(d, type){
				d.score = 0;
				if(d.sentences) d.sentences.forEach(function(s){ d.score += s.score; });

				var length_max = settings[type+'_length_threshold']
				var length = d.words.length;
				if(d.sentences) length = d.sentences.length;
				if(length > length_max){
					d.score += (length_max - length)/length;
				}

				d.score += (d.positive_words.length/d.words.length) - (d.negative_words.length/d.words.length) * settings['positiveness_weight'];
				d.score += (d.active_words.length/d.words.length) - (d.passive_words.length/d.words.length) * settings['acitveness_weight'];
				d.score += (d.direct_words.length/d.words.length) - (d.indirect_words.length/d.words.length) * settings['directness_weight'];
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
	},
	getWords: function(type){
		var words = {};
		var items = this.get("items");
		if(!items) return [];
		items.forEach(function(item){
			if(type && item[type]){
				_.each(item[type],function(w){
					if(!words[w]){
						words[w] = 0;
					}
					words[w]++;
				});
			}
		});
		return _.sortBy(_.keys(words), function(w){
			return words[w];
		});
	},
	highlight: function(text){
		this.set("highlight",text);
		this.trigger("highlight");
	},
	unhighlight: function(text){
		if(this.get('highlight') == text){
			this.unset("highlight");
			this.trigger("unhighlight");
		}
	}
});