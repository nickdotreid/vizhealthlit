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

    def __init__(self, text):
        self.text = text
        
        self.words = []
        self.nouns = []
        self.verbs = []
        self.active_words = []
        self.passive_words = []

        self.words = nltk.word_tokenize(text)

        tags = nltk.pos_tag(self.words)

        for w,t in tags:
            if 'N' in t:
                self.nouns.append(w)
            if 'V' in t:
                self.verbs.append(w)
            if t in ['PRO','VG','MOD']:
                self.active_words.append(w)
            if t in ['VD','VN']:
                self.passive_words.append(w)

        # check positivity
        # check active voice

    def to_json(self):
        return {
            'length':len(self.words),
            'words':self.words,
            'text':self.text,
            'score':len(self.nouns) - len(self.verbs)
        }

    def __unicode__(self):
        return self.text

class Paragraph(Sentence):

    sentences = []

    def __init__(self, text):
        self.text = text
        self.words = []
        self.nouns = []
        self.verbs = []
        self.active_words = []
        self.passive_words = []

        self.sentences = []
        for sent in sent_detector.tokenize(self.text.strip()):
            s = Sentence(sent)
            self.sentences.append(s)
            self.words += s.words
            self.active_words += s.nouns
            self.passive_words += s.verbs

class Body(Paragraph):

    paragraphs = []

    def __init__(self, text):
        self.text = text
        
        self.paragraphs = []
        self.sentences = []
        self.words = []
        self.nouns = []
        self.verbs = []
        self.active_words = []
        self.passive_words = []

        for para in self.text.split('\n\r'):
            p = Paragraph(para)
            self.paragraphs.append(p)
            self.sentences += p.sentences
            self.words += p.words
            self.active_words += p.active_words
            self.passive_words += p.passive_words
