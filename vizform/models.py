from django.db import models

import nltk
import nltk.data
from nltk.corpus import wordnet
from nltk.corpus import stopwords
from nltk.corpus import cmudict

sent_detector = nltk.data.load('tokenizers/punkt/english.pickle')

class Sentence(models.Model):
    class Meta:
        abstract = True

    text = ""
    words = []
    verbs = []
    nouns = []

    def __init__(self, text):
        self.text = text
        self.words = nltk.word_tokenize(text)
        # count nouns
        # count verbs

        # check positivity
        # check active voice

    def __unicode__(self):
        return self.text

class Paragraph(models.Model):
    class Meta:
        abstract = True

    text = ""
    sentences = []
    words = []

    def __init__(self, text):
        self.text = text

        for sent in sent_detector.tokenize(self.text.strip()):
            s = Sentence(sent)
            self.sentences.append(s)
            self.words += s.words
    
    def __unicode__(self):
        return self.text

class Body():

    class Meta:
       abstract = True
    
    text = ""
    verbs = {}
    paragraphs = []
    sentences = []

    def __init__(self, text):
        self.text = text
        self.words = nltk.word_tokenize(text)
        for para in self.text.split('\n'):
            paragraph = Paragraph(para)
            self.paragraphs.append(paragraph)
            self.sentences += paragraph.sentences

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
