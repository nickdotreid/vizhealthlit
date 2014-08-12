var UploadView = Backbone.View.extend({
	tagName: "div",
	className: "text-upload",
	events:{
		"submit form": "updateText",
		"click a.text": "loadText",
	},
	loadText: function(event){
		event.preventDefault();
		this.$('li.active').removeClass("active");
		var text = $(event.currentTarget);
		text.parent().addClass("active");
		var text_value = $(".text:not(a)",text.parent()).text();
		this.$('form [name=text]').val(text_value);
		this.$('form').submit();
	},
	updateText: function(event){
		event.preventDefault();
		var view = this;
		var form = this.$('form');
		if(form.hasClass("loading")) return;
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
		"click .kill":"killViz",
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
	},
	killViz: function(event){
		event.preventDefault();
		$("#upload-pane").show();
		$("#viz-pane").hide();
		this.remove();
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
		// remove any existing listeners
		this.$(".topic-list").html("");
		var model = this.model;
		model.nouns().forEach(function(noun){
			var listItem = $("<li><a href='#'>"+noun.text+"</a></li>").appendTo(this.$('.topic-list'));
			var timeout = false;
			listItem.bind('mouseenter', function(event){
				timeout = setTimeout(function(){
					timeout = false;
					model.addWord(noun);
				}, 500);
				listItem.bind('mouseleave',function(){
					if(timeout) clearTimeout(timeout);
					listItem.unbind('mouseleave');
					if(listItem.hasClass("active")) return;
					model.removeWord(noun);
				});
			});
			listItem.bind('click',function(event){
				event.preventDefault();
				if(timeout) clearTimeout(timeout);
				if(listItem.hasClass("active")){
					listItem.removeClass("active");
					model.removeWord(noun);
				}else{
					listItem.addClass("active");
					model.addWord(noun);
				}	
			});

		});
		
	},
	topicSelect: function(event){

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