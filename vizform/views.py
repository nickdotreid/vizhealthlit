from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
import json

from django.template import RequestContext

from vizform.forms import TextForm, SettingsForm
from crispy_forms.utils import render_crispy_form

from vizform.models import Body

def index(request):
    form = TextForm()
    form.helper.form_action = reverse(result)
    return render_to_response('index.html',{
        'form':form,
        'settings_form':SettingsForm(),
        },context_instance=RequestContext(request))

def text(request):
    form = TextForm()
    form.helper.form_action = reverse(result)

    settings = SettingsForm()
    settings.helper.form_action = reverse(result)

    return render_to_response('text.html',{
        'form':form,
        'settings':settings,
        }, context_instance=RequestContext(request))

def result(request):
    if request.is_ajax():
        form = TextForm(request.POST)
        form.helper.form_action = reverse(result)
        if not form.is_valid():
            return HttpResponse(
            json.dumps({
                'form':render_crispy_form(form, context=RequestContext(request)),
                }),
            content_type="application/json"
            )
        body = Body(form.cleaned_data['text'])
        return HttpResponse(
            json.dumps({
                'text':body.to_html(),
                'items':[item.to_json() for item in body.paragraphs],
                'nouns':[noun.to_json() for key,noun in body.nouns.items()],
                }),
            content_type="application/json"
            )
    if not request.POST:
        return HttpResponseRedirect(reverse(index))
    return render_to_response('results.html',{
        'form': form,
        'data':data,
        'longest':longest,
        },context_instance=RequestContext(request))

def parse_paragraph(text):
    sentences = [parse_sentence(s+'.') for s in text.split('. ')]
    return sentences

def parse_sentence(text):
    data = {}
    words = text.split(' ')
    data['words'] = len(words)
    data['common_words'] = len(words)
    data['information_ratio'] = 0
    if(len(words)>0):
        data['information_ratio'] = data['common_words']/data['words']
    return data