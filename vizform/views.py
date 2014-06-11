from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse

from django.template import RequestContext

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

class TextForm(forms.Form):

    def __init__(self, *args, **kwargs):
        super(TextForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_method = "POST"
        self.helper.form_action = reverse(result)

        self.helper.add_input(Submit('submit', 'Submit'))

    text = forms.CharField(required=True, widget=forms.Textarea)


def index(request):
    return render_to_response('index.html',{
        'form':TextForm,
        },context_instance=RequestContext(request))

def result(request):
    if not request.POST:
        return HttpResponseRedirect(reverse(index))
    form = TextForm(request.POST)
    data = []
    longest = 1
    if form.is_valid():
        data = parse_paragraph(form.cleaned_data['text'])
        longest = max([d['words'] for d in data])
        print longest
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