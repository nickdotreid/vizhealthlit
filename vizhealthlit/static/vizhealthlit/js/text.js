var TextModel = Backbone.Model.extend({

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
		this.$el.html(this.model.get("text"));
		return this;
	}
});

var SettingsView = Backbone.View.extend({
	events:{
		"click .scoring a":"scoreUpdate",
	},
	render:function(event){
		return this;
	},
	scoreUpdate: function(event){
		event.preventDefault();
		this.$(".scoring .active").removeClass("active");
		var button = $(event.currentTarget).parents("li:first");
		button.addClass("active");
		this.model.set({
			'scoring':button.data("score"),
		});
	}
})