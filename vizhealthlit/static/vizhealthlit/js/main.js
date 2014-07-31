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

$(document).ready(function(){
	$(window).resize();
	$('body').delegate('form','submit',function(event){
		event.preventDefault();
		var form = $(this);
		$.ajax({
			url: form.attr("action"),
			type: form.attr("method"),
			data:form.serializeArray(),
			success:function(data){
				if(data['form']){
					form.after(data['form']);
					form.remove();
				}
				if(data['items']){
					form.data('items',data['items']);
					draw(data['items'],form.serializeObject());
				}
				if(data['nouns']){
					form.data('nouns',data['nouns']);
					showNouns(data['nouns']);
				}
			},
		});
	}).delegate('form input,form select','change',function(){
		var form = $(this).parents("form");
		if(form.data('items')){
			draw(form.data('items'),form.serializeObject());
		}
	}).delegate('#tooltip .close','click',function(event){
		event.preventDefault();
		hideTooltip();
	});
	$("#tooltip").hide();

	$("#nouns").delegate(".noun",'click',function(event){
		event.preventDefault();

	})
});

function showNouns(items){
	items.sort(function(a,b){
		if(a.count > b.count) return -1;
		if(b.count > a.count) return 1;
		if(a.text > b.text) return -1;
		return 1;
	});
	var i = 0
	while(i < 5 && i<items.length){
		i++;
		var item = items[i];
		var noun = $('<a href="#" class="noun">'+item.text+'</a>').appendTo("#nouns");
		noun.data("data",item);
	}
}

function draw(items, settings){
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
		visualization_functions[settings['style']](items,settings);
	}else{
		alert("no draw funciton");
	}
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
	items.forEach(function(d){
		d.sentences.forEach(function(s){
			score(s,'words');
		});
		score(d,'sentences');
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
	$('#tooltip').hide();
	$('.form-container').show();
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