from django.db import models

from nltk import word_tokenize
from nltk.corpus import wordnet
from nltk.corpus import stopwords


class Body():

    class Meta:
       abstract = True
    
    text = ""
    verbs = {}

    def __init__(self, text):
        self.text = text
        self.words = word_tokenize(text)

    def word_meaning_sequence(self):
        meaning_sequence = []
        for t in self.words:
            meaning_sequence.append(len(wordnet.synsets(t)))
        return meaning_sequence

    def stop_word_sequence(self):
        stop_word_sequence = []
        for t in self.words:
            if t in stopwords.words('english'):
                stop_word_sequence.append(1)
            else:
                stop_word_sequence.append(0)
        return stop_word_sequence


    def __unicode__(self):
        return self.text
