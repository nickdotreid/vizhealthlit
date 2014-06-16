from django.db import models

from nltk.corpus import wordnet

class Body():

    class Meta:
       abstract = True
    
    text = ""
    verbs = {}

    def __init__(self, text):
        self.text = text

    def word_meaning_sequence(self):
        meaning_sequence = []
        for t in self.text:
            meaning_sequence.append(wordnet.synsets(t))
        return meaning_sequence

    def __unicode__(self):
        return self.text
