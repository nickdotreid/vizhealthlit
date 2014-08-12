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

var VizPaneView = Backbone.View.extend({
	events:{
		"click .nav-visualization a":"updateViz",
		"click .nav-sidebar a":"updateSidebar",
	},
	initialize: function(){
		var view = this;

		this.$(".navbar-fixed-top").each(function(){
			view.$el.css("margin-top",$(this).height());
		});

		var settingsView = new SettingsView({
			model: this.model,
			el: this.$("#settings")[0],
		});
		var textView = new TextView({
			model: this.model,
			el: this.$("#overview")[0],
		});
		var topicView = new TopicsView({
			model: this.model,
			el: this.$("#topics")[0],
		})

		this.render();

		this.$(".nav-visualization .active a").each(function(){
			view.makeViz($(this).data("type"));
		});
	},
	render: function(){
		this.$(".sidebar .pane").hide();
		var targetId = this.$(".nav-sidebar .active a").data("target");
		this.$("#"+targetId).show();
	},
	updateSidebar: function(event){
		event.preventDefault();

		this.$(".nav-sidebar .active").removeClass("active");
		$(event.currentTarget).parents("li:first").addClass("active");

		this.render();
	},
	updateViz: function(event){
		event.preventDefault();
		
		this.$(".nav-visualization .active").removeClass("active");
		$(event.currentTarget).parents("li:first").addClass("active");

		var type = $(event.currentTarget).data("type");
		this.makeViz(type);
	},
	makeViz: function(type){
		if(this.viz) this.viz.remove();
		if(!vizViewDict[type]) return false;
		this.viz = new vizViewDict[type]({
			model: this.model,
			el: this.$("#chart")[0],
		});
		return this.viz;
	}
});
var vizViewDict = {};

var SettingsView = Backbone.View.extend({
	events:{
		"click .formulas a":"formulaChange",
		"change form input":"settingsChange",
		"click .formulas .active a":"showModal",
	},
	initialize:function(){
		this.createWordLists();

	},
	render:function(event){
		return this;
	},
	formulaChange: function(event){
		event.preventDefault();
		this.$(".formulas .active").removeClass("active");
		var button = $(event.currentTarget).parents("li:first");
		button.addClass("active");
		this.model.set({
			'formula':button.data("formula"),
		});
	},
	settingsChange: function(event){
		this.model.setSetting(this.$('form').serializeObject());
	},
	showModal: function(event){
		var button = $(event.currentTarget).parents("li:first");
		this.$(".modal."+button.data("formula")).modal();
	},
	createWordLists: function(event){
		var model = this.model;
		this.$('.word-list').each(function(){
			var list = $(this);
			var attr = list.data('word-type');
			var words = model.getWords(attr);
			list.html(words.join(", "));
		});
	}
});

var TopicsView = Backbone.View.extend({
	events:{
		"mouseenter .topic-list a":"topicHover",
		"click .topic-list a":"topicSelect",
	},
	initialize:function(){
		this.render();
	},
	render: function(){
		var output = "";
		this.model.nouns().forEach(function(noun){
			output += "<li><a href='#' data-noun='"+noun+"'>"+noun+"</a></li>";
		});
		this.$(".topic-list").html(output);
	},
	topicHover: function(event){
		var link = $(event.currentTarget);
		var model = this.model;
		model.addWord(link.data("noun"));
		link.bind('mouseleave',function(){
			link.unbind('mouseleave');
			if(link.parent().hasClass("active")) return;
			model.removeWord(link.data("noun"));
		});
	},
	topicSelect: function(event){
		event.preventDefault();
		var link = $(event.currentTarget);
		var model = this.model;
		if(link.parent().hasClass("active")){
			link.parent().removeClass("active");
			model.removeWord(link.data("noun"));
		}else{
			link.parent().addClass("active");
			model.addWord(link.data("noun"));
		}	
	}
});

function formatNumber(num){
	return Math.round(num *100)/100;
}

// FROM:: http://stackoverflow.com/questions/1184624/convert-form-data-to-js-object-with-jquery
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};