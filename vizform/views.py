from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse

from django.template import RequestContext

def index(request):
    # make the form
    return render_to_response('form.html',{},context_instance=RequestContext(request))

def result(request):
    return render_to_response('form.html',{},context_instance=RequestContext(request))