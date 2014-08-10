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
        self.helper.form_action = None

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
        self.helper.form_action = None

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