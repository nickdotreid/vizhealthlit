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
		this.listenTo(this.model, "updated", this.render);
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
			var formula = 'score';
			$(".score:last",view.$el).after('<span class="score paragraph-score">('+formatNumber(item[formula]) + ')</span>');
		}
	},
	scoreSentence: function(item){
		var html = this.$el.html();
		var parts = html.split(item.text);

		var formula = 'score';
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
	initialize:function(){
		this.$('form').hide();
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
		if(button.data("formula") == 'custom') this.$("form").show();
		else this.$("form").hide();
	}
});