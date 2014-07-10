from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
import json

from django.template import RequestContext

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout
from crispy_forms.layout import Submit

from vizform.models import Body

class TextForm(forms.Form):

    def __init__(self, *args, **kwargs):
        super(TextForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_method = "POST"
        self.helper.form_action = reverse(result)

        self.helper.form_class = 'form-horizontal'
        self.helper.label_class = 'col-lg-2'
        self.helper.field_class = 'col-lg-8'

        self.helper.layout = Layout(
            'text',
            'style',
            Submit('submit', 'Submit'),
            )

    text = forms.CharField(label="The text you want to visualize", required=True, widget=forms.Textarea)
    style = forms.ChoiceField(label="Pick a layout", required=True, widget=forms.RadioSelect, 
        choices=(
        ('paragraph','Paragraph'),
        ('sentences','Sentences'),
        ))

class SettingsForm(TextForm):
    def __init__(self, *args, **kwargs):
        super(SettingsForm, self).__init__(*args, **kwargs)

        self.helper.layout = Layout(
            'text',
            'style',
            'words_threshold',
            'sentences_threshold',
            'negativity_threshold',
            Submit('submit', 'Submit'),
            )

    words_threshold = forms.CharField(label="Words")
    sentences_threshold = forms.CharField(label="Sentences")
    negativity_threshold = forms.CharField(label="Negativity")

def index(request):
    return render_to_response('index.html',{
        'form':SettingsForm(),
        },context_instance=RequestContext(request))

def result(request):
    if not request.POST:
        return HttpResponseRedirect(reverse(index))
    form = TextForm(request.POST)
    data = []
    longest = 1
    if form.is_valid() and request.is_ajax():
        body = Body(form.cleaned_data['text'])
        items = []
        if form.cleaned_data['style'] == 'sentences':
            items = body.sentences
        else:
            items = body.paragraphs
        return HttpResponse(
            json.dumps({
                'items':[item.to_json() for item in items],
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