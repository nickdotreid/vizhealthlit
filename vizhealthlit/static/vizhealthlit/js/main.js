var csrftoken = $.cookie('csrftoken');
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

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


var visualization_functions = {};

$(document).ready(function(){
	$('.control-viz a').click(function(event){
		event.preventDefault();
		$('.active',$(this).parents('.control-viz')).removeClass("active");
		$(this).parent().addClass('active');
	});
});

var graph = false;

$(document).ready(function(){
	$(window).resize();
	$('body').delegate('form','submit',function(event){
		event.preventDefault();
		var form = $(this);

		$("#settings-pane").hide();
		$("#viz-pane").show();

		$('input, select',form).unbind("change");

		$.ajax({
			url: form.attr("action"),
			type: form.attr("method"),
			data:form.serializeArray(),
			success:function(data){
				if(data['form']){
					form.after(data['form']);
					form.remove();
					$("#settings-pane").show();
					$("#viz-pane").hide();
				}
				if(data['items']){
					graph = new Graph();
					graph.draw(data['items'],form.serializeObject());

					$("input, select",form).bind("change",function(){
						graph.update(form.serializeObject());
					});
					if(data['nouns']) graph.setNouns(data['nouns']);
				}
			},
		});
	}).delegate('form input,form select','change',function(){
		var form = $(this).parents("form");
		if(form.data('items')){
			draw(form.data('items'),form.serializeObject());
		}
	}).delegate('#viz-pane .close','click',function(event){
		event.preventDefault();
		$("#viz-pane").hide();
		$("#settings-pane").show();
	});
	$("#viz-pane").hide();
});


function Graph(){

}
Graph.prototype.draw = function(items, settings){
	var graph = this;
	graph.items = items;
	$("#chart").html("");
	var p = $("#chart").parent();
	$("#chart").css({
		'position':'fixed',
		'top':p.position().top,
		'left':p.position().left,
		'width':p.width(),
	});
	$("#chart").height($(window).height()-$(".navbar").height());
	items = generate_scores(items,settings);
	if(visualization_functions[settings['style']]){
		graph.blit = visualization_functions[settings['style']](items,settings);
	}else{
		alert("no draw funciton");
	}
}
Graph.prototype.update = function(settings){
	var items = generate_scores(this.items,settings);
	if(this.blit){
		this.blit(items,settings);
	}else{
		alert("no update functions");
	}
}
Graph.prototype.setNouns = function(nouns){
	var graph = this;
	graph.nouns = nouns;
	nouns.sort(function(a,b){
		if(a.count > b.count) return -1;
		if(b.count > a.count) return 1;
		if(a.text > b.text) return -1;
		return 1;
	});
	$("#nouns").html("");
	nouns.forEach(function(d){
		var noun = d;
		var div = $('<li class="noun" ><a href="#">'+noun.text+'</a></li>').appendTo("#nouns");
		div.bind('click',function(event){
			event.preventDefault();
			div.toggleClass("active");
			var settings = $("form").serializeObject();
			settings['words'] = noun.words;
			graph.update(settings);
		}).bind('mouseenter',function(event){
			div.toggleClass("over");
			var settings = $("form").serializeObject();
			settings['words'] = noun.words;
			graph.update(settings);
		}).bind('mouseleave',function(event){
			div.toggleClass("over");
			var settings = $("form").serializeObject();
			graph.update(settings);
		});
	});
}

function extract_sentences(items){
	var sentences = []
	items.forEach(function(d){
		d.sentences.forEach(function(s){
			s.paragraph = d;
			sentences.push(s);
		});
	});
	return sentences;
}

function generate_scores(items, settings){
	var sentences = extract_sentences(items);

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

	function wordScore(d){
		d.wordScore = 0;
		if(!settings.words) return;
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

	var items_max = d3.max(items, function(d){ return d.score; }) * settings['correct_percent'];
	var sentences_max = d3.max(items, function(d){ return d.score; }) * settings['correct_percent'];

	items.forEach(function(d){
		if(d.score > items_max) d.score = items_max;
		d.sentences.forEach(function(s){ if(s.score > sentences_max) s.score = sentences_max; });
	});

	return items;
}

function showTooltip(d){
	$('.form-container').hide();
	var div = $('#tooltip');

	$(".score .value").data("value",d.score).html(d.score);
	$(".words",div).data("text",d.text).html(d.text);

	div.show();
}
function hideTooltip(d){

}

function hoverSentence(d){
	$("#tooltip .score .value").html(d.score);

	var words = $('#tooltip .words').html();
	var parts = words.split(d.text);
	if(parts.length == 2) $('#tooltip .words').html(parts[0]+"<strong>"+d.text+"</strong>"+parts[1]);
}
function clearSentence(d){
	$("#tooltip .value").each(function(item){
		$(this).html($(this).data("value"));
	});

	var words = $('#tooltip .words');
	words.html(words.data("text"));
}