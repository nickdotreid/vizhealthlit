######## NOTES #########
# This document makes use of part-of-speech tags from the Penn Treebank Project
# I have documented what I am looking for in the code, but if you want a more complete list vists this website
# https://www.ling.upenn.edu/courses/Fall_2003/ling001/penn_treebank_pos.html
########################

from django.db import models

import re

import nltk
import nltk.data
from nltk.corpus import wordnet
from nltk.corpus import stopwords
from nltk.corpus import cmudict

sent_detector = nltk.data.load('tokenizers/punkt/english.pickle')
negative_words = [unicode(x).lower() for x in open('vizform/negative-words.txt','r').read().split('\n')]

class Noun():
    def __init__(self, word, tag=False):
        self.word = word
        self.tag = tag
        self.count = 0

        self.verbs = []
        self.modifiers = []
        self.subjects = []

        self.synsets = wordnet.synsets(word)
        
        self.defined = False

    def score(self):
        return 1

    def analyze(self,tags):
        for w,t in tags:
            if t[0] == 'V':
                self.verbs.append(w)
            if t in ['PRP']:
                self.subjects.append(w)
        return True

    def merge(self, noun):
        self.count += noun.count
        
        # This should be smarter? Maybe Count??
        self.verbs += noun.verbs
        self.modifiers += noun.modifiers

        if noun.defined:
            self.defined = True
        return self

    def __unicode__(self):
        return "%s (%d)" % (self.word,self.count)

class Sentence(models.Model):
    class Meta:
        abstract = True

    def __init__(self, text):
        self.text = text
        
        self.words = []
        self.nouns = {}
        self.verbs = {}
        self.similarity = -1

        self.active_words = []
        self.passive_words = []
        
        self.direct_words = []
        self.indirect_words = []

        self.negative_words = []

        self.words = nltk.word_tokenize(text)

        tags = nltk.pos_tag(self.words)

        for w,t in tags:
            if 'NN' in t: # is a noun of any type
                if w not in self.nouns:
                    self.nouns[w] = Noun(w,t)
                self.nouns[w].count += 1
            if 'V' in t: # is a verb of any type
                if w not in self.verbs:
                    self.verbs[w] = {
                        'count': 0,
                    }
                self.verbs[w]['count'] += 1
            if t in [
                'PRP', # Personal Pronoun
                'VBG', # Verb, present partiviple
                'VBP', # Verb, non-3rd person singular present
                ]:
                self.active_words.append(w)
            if t in [
                'VBD', # Verb past tense
                'VBZ', # Verb 3rd person
                'VBN', # Verb past participle
                ]:
                self.passive_words.append(w)
            if t in ['PRP']:
                self.direct_words.append(w)
            if t in [
                'MD',
                ]:
                self.indirect_words.append(w)
            if unicode(w).lower() in negative_words:
                self.negative_words.append(w)


        for n in self.nouns:
            self.nouns[n].analyze(tags)

    def to_json(self):
        return {
            'length':len(self.words),
            'words':self.words,
            'text':self.text,
            'similarity':self.similarity,
            'score':len(self.active_words) - len(self.passive_words) - len(self.negative_words)
        }

    def __unicode__(self):
        return self.text

class Paragraph(Sentence):

    sentences = []

    def __init__(self, text):
        self.text = text
        
        self.words = []
        self.nouns = {}
        self.verbs = {}
        self.similarity = -1

        self.active_words = []
        self.passive_words = []

        self.negative_words = []

        self.sentences = []
        for ss in re.split('\n|\r',self.text):
            if ss == "":
                continue
            for sent in sent_detector.tokenize(ss):
                s = Sentence(sent)
                self.sentences.append(s)
                self.merge(s)

        for s in self.sentences:
            s.similarity = 0
            for n in s.nouns:
                if n in self.nouns:
                    s.similarity += self.nouns[n].count


    def merge(self, s):
        self.words += s.words
        self.active_words += s.active_words
        self.passive_words += s.passive_words
        self.negative_words += s.negative_words
        # merge nouns
        for n,obj in s.nouns.items():
            if n in self.nouns:
                self.nouns[n].merge(obj)
                continue
            syn_matches = [sn for sn,sobj in self.nouns.items() for ss in sobj.synsets for s in obj.synsets if s == ss]
            if len(syn_matches) >= 1:
                self.nouns[syn_matches[0]].merge(obj)
                continue
            self.nouns[n] = obj

    def to_json(self):
        obj = super(Paragraph, self).to_json()
        obj['sentences'] = [s.to_json() for s in self.sentences]
        return obj

class Body(Paragraph):

    paragraphs = []

    def __init__(self, text):
        self.text = text
        
        self.paragraphs = []
        self.sentences = []
        self.words = []
        self.nouns = {}
        self.verbs = {}
        self.active_words = []
        self.passive_words = []
        self.negative_words = []

        for para in re.split('\n\n|\n\r', self.text):
            if para == "":
                continue
            p = Paragraph(para)
            self.paragraphs.append(p)
            self.sentences += p.sentences
            self.words += p.words

            self.merge(p)

        for s in self.paragraphs:
            s.similarity = 0
            for n in s.nouns:
                if n in self.nouns:
                    s.similarity += self.nouns[n].count
