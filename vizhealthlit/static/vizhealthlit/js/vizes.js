var VizView = Backbone.View.extend({
	initialize: function() {
		var el = $('<div></div>').appendTo(this.$el);
		this.setElement(el[0]);
		this.listenTo(this.model, "updated", this.update);
		this.render();
	}
});

var TextView = VizView.extend({
	render: function(){
		var view = this;
		this.$el.html(this.model.get("text"));
		this.model.get("items",[]).forEach(function(item){
			view.scoreGroup(item);
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
		this.$el.html(this.$el.html() + item.text + "<span class='score'>"+ "("+ formatNumber(item[formula]) +")" +"</span>");
		this.$el.html(this.$el.html() + parts[1]);
		return true;
	},
});