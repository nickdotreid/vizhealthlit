from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Submit, Fieldset

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
            Fieldset(
                "Positiveness",
                "positiveness_weight",
                ),
            Fieldset(
                "Activeness",
                "activeness_weight",
                ),
            Fieldset(
                "Directness",
                "directness_weight",
                ),
            Fieldset(
                "Complexity",
                'complexity_weight',
                'sentence_length_threshold',
                'paragraph_length_threshold',
                ),
            )
    positiveness_weight = forms.CharField(required=True, label="Weight", initial=1)
    activeness_weight = forms.CharField(required=True, label="Weight", initial=1)
    directness_weight = forms.CharField(required=True, label="Weight", initial=1)
    complexity_weight = forms.CharField(required=True, label="Weight", initial=1)
    sentence_length_threshold = forms.CharField(required=False, label="Words Max", initial=10)
    paragraph_length_threshold = forms.CharField(required=False, label="Sentence Max", initial=5)