from django.db import models

import nltk
from nltk.corpus import wordnet
from nltk.corpus import stopwords
from nltk.corpus import cmudict

class Body():

    class Meta:
       abstract = True
    
    text = ""
    verbs = {}

    def __init__(self, text):
        self.text = text
        self.words = nltk.word_tokenize(text)

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

    def syllable_sequence(self):
        sequence = []
        prondict = cmudict.dict()
        for t in self.words:
            if t in prondict and len(prondict[t]) > 0:
                sequence.append(len(prondict[t][0]))
            else:
                sequence.append(0)
        return sequence

    def tags(self):
        tags = {}
        for w,t in nltk.pos_tag(self.words):
            if t not in tags:
                tags[t] = []
            tags[t].append(w)
        return tags


    def __unicode__(self):
        return self.text
