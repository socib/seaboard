# coding: utf-8

from django.http import Http404, HttpResponse
from django.utils import simplejson
from django.views.decorators.cache import cache_page

from django.conf import settings

import urllib2
from seawidgets.models import Location

import logging
logger = logging.getLogger(__name__)


@cache_page(60 * 60 * 2, cache="default")
def forecast(request, location_code):
    """Get forecast from forecast.io (see https://developer.forecast.io/docs/v2) for a given location.
    The result is cached for 2 hours, to reduce calls to forecast API (the limit is 1.000 calls a day).

    :param location_code: location
    """
    try:
        location = Location.objects.get(code__iexact=location_code)
        if len(location.location) == 0:
            location.location = location.zone.latlong

    except Location.DoesNotExist:
        raise Http404

    #url = 'http://www.socib.es/~bfrontera/tmp/forecast.json'
    url = 'https://api.forecast.io/forecast/' + settings.FORECAST_IO_API + '/' + location.location + '?units=ca&exclude=currently,minutely,hourly'

    forecastio = simplejson.load(urllib2.urlopen(url))
    return HttpResponse(simplejson.dumps(forecastio), mimetype='application/json')
