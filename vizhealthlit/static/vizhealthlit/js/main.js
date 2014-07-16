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
			},
		});
	}).delegate('form input,form select','change',function(){
		var form = $(this).parents("form");
		if(form.data('items')){
			draw(form.data('items'),form.serializeObject());
		}
	});
});

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
	if(visualization_functions[settings['style']]){
		visualization_functions[settings['style']](items,settings);
	}else{
		alert("no draw funciton");
	}
}