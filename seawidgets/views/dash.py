# coding: utf-8

from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.http import Http404, HttpResponse, HttpResponseForbidden, HttpResponseServerError, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404, render
from django.conf import settings
from django.utils import simplejson
from django.contrib.staticfiles.views import serve

from seawidgets.models import Zone, Location

import logging
logger = logging.getLogger(__name__)

def index(request,location='pdp',template='index.html'):
    """Default page for seaboard-seawidgets

    :param template: Add a custom template.
    """
    kwvars = {
        'location': location
    }

    return render_to_response(template, kwvars, RequestContext(request))

def dash(request,zone_code='socib',location_code='',template='dash.html'):
    """Default page for seaboard-seawidgets

    :param template: Add a custom template.
    """

    logger.info('Enter dash with zone %s and location %s' % (zone_code,location_code))
    # If not location_code given, search default location for zone (same code as zone)
    if len(location_code) == 0:
        location_code = zone_code

    try:
        location = Location.objects.get(code__iexact=location_code)
        if len(location.location) == 0:
            location.location = location.zone.latlong
        
    except Location.DoesNotExist:
        logger.error('Location %s does not exist' % location_code)
        raise Http404            

    # check that zone param and location.zone matches
    if location.zone.code != zone_code:
        logger.error('Zones does not match  %s vs %s' % (location.zone.code , zone_code) )
        raise Http404                

    if request.GET.get('sandbox'):
        template = 'sandbox.html'

    kwvars = {
        'location': location
    }

    return render_to_response(template, kwvars, RequestContext(request))

def widget(request,name):
    """ Return widget template
    Only for development environment. 
    In production, add the following line into virtualhost configuration:
    AliasMatch ^/views/(.*).html /var/www/seaboard/static/widgets/$1/$1.html 

    :param template: Add a custom template.
    """
    return serve(request, 'widgets/' + name + '/' + name + '.html' )


def status(request):
    """ 
    Check if server and database is ok. 
    If its ok, the seaboard panel will refresh the page    
    """
    results = {}

    try:
        location_list = Location.objects.all()
        results = {'ok': 'server up and running!'}    
    except Exception:
        results = {'error': 'database lookup did not work'}    

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')
