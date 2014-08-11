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

var SettingsView = Backbone.View.extend({
	events:{
		"click .formulas a":"formulaChange",
		"change form input":"settingsChange",
		"click .formulas .active a":"showModal",
	},
	initialize:function(){

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