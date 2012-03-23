from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext, Context

def index(request):

    print 'hi!'

    return render_to_response('index.html')
