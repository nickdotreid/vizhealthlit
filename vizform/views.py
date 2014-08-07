from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
import json

from django.template import RequestContext

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Submit

from crispy_forms.utils import render_crispy_form

from vizform.models import Body

class TextForm(forms.Form):

    def __init__(self, *args, **kwargs):
        super(TextForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)

        self.helper.form_method = "POST"
        self.helper.form_action = reverse(result)

        self.helper.form_class = 'form-horizontal text-form'
        self.helper.label_class = 'col-lg-2'
        self.helper.field_class = 'col-lg-8'

        self.helper.layout = Layout(
            'text',
            Submit('submit', 'Submit'),
            )

    text = forms.CharField(label="The text you want to visualize", required=True, widget=forms.Textarea)

class SettingsForm(forms.Form):
    def __init__(self, *args, **kwargs):
        super(SettingsForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_method = "POST"
        self.helper.form_action = reverse(result)

        self.helper.form_class = 'form-vertical settings-form'

        self.helper.layout = Layout(
            'formula',
            'style',
            Div(
                Div('sentences_threshold_min', css_class="col-xs-6"),
                Div('sentences_threshold_max', css_class="col-xs-6"),
                css_class="row"
                ),
            Div(
                Div('words_threshold_min', css_class="col-xs-6"),
                Div('words_threshold_max', css_class="col-xs-6"),
                css_class="row"
            ),
            'sentences_threshold',
            'negativity_threshold',
            'correct_percent',
            Submit('submit', 'Submit'),
            )

    style = forms.ChoiceField(label="Pick a layout", required=True, 
            choices=(
            ('bars','Bar Chart'),
            ('pizza','Pizza Chart'),
            ),
            initial = 'pizza',
            )

    formula = forms.ChoiceField(label='Pick a reading formula', required=False,
        choices=(
            ('FleschReadingEase','Reading Ease'),
            ('FleschKincaidGradeLevel','Grade Level'),
            ('GunningFogIndex','Gunning Fog'),
            ('SMOGIndex', 'SMOG'),
            ('custom','Custom'),
        ))

    words_threshold_min = forms.CharField(required=False, label="Min", initial=8)
    words_threshold_max = forms.CharField(required=False, label="Max", initial=10)

    sentences_threshold_min = forms.CharField(required=False, label="S Min", initial=3)
    sentences_threshold_max = forms.CharField(required=False, label="S Max", initial=5)
    
    negativity_threshold = forms.CharField(required=False, label="Negativity", initial=1)

    correct_percent = forms.CharField(required=False, label="Percentile Max", initial=1)

def index(request):
    return render_to_response('index.html',{
        'form':TextForm(),
        'settings_form':SettingsForm(),
        },context_instance=RequestContext(request))

def result(request):
    if not request.POST:
        return HttpResponseRedirect(reverse(index))
    form = TextForm(request.POST)
    data = []
    longest = 1
    if request.is_ajax():
        if not form.is_valid():
            return HttpResponse(
            json.dumps({
                'form':render_crispy_form(SettingsForm(request.POST), context=RequestContext(request)),
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