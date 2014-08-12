from django.contrib import admin

from texts.models import Text

from django import forms

class TextModelForm( forms.ModelForm):
	text = forms.CharField( widget=forms.Textarea )
	class Meta:
		model = Text

class TextAdmin(admin.ModelAdmin):
	form = TextModelForm

admin.site.register(Text, TextAdmin)