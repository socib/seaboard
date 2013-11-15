# coding: utf-8

from django.http import HttpResponse
from django.utils import simplejson
from django.views.decorators.cache import cache_page

from django.conf import settings

import urllib2
import re


@cache_page(60 * 60 * 2, cache="default")
def current_deployments_stats(request):
    """Get current SOCIB deployments stats (how many drifters, argo, gliders, RV, moorings...).

    """
    url = settings.DATADISCOVERY_URL + '/list-deployments?state=active'
    deployments = simplejson.load(urllib2.urlopen(url))
    stats = {}

    for deployment in deployments:
        platformType = deployment['platform']['platformType']
        if platformType in stats.keys():
            stats[platformType] += 1
        else:
            stats[platformType] = 1

    url = settings.DATADISCOVERY_URL + '/list-moorings'
    moorings = simplejson.load(urllib2.urlopen(url))
    for mooring in moorings:
        platformType = mooring['platformType']
        if platformType in stats.keys():
            stats[platformType] += 1
        else:
            stats[platformType] = 1


    return HttpResponse(simplejson.dumps(stats), mimetype='application/json')

@cache_page(60 * 20, cache="default")
def current_variables(request):
    """Get current variables min and max for SOCIB moorings

    """

    variables = {
        'sea_water_temperature': {
            'displayName': 'Sea water temperature'
        },
        'air_temperature': {
            'displayName': 'Air temperature'
        },
        'wind_speed': {
            'displayName': 'Wind speed'
        },
        'water_surface_height_above_reference_datum': {
            'displayName': 'Sea level'
        },
        'air_pressure': {
            'displayName': 'Air pressure'
        },
        'sea_water_salinity': {
            'displayName': 'Sea water salinity'
        },
        'sea_water_speed': {
            'displayName': 'Current speed'
        },
        'sea_surface_wave_significant_height': {
            'displayName': 'Wave height'
        }
    }


    url = settings.DATADISCOVERY_URL + '/list-moorings?units=user'
    moorings = simplejson.load(urllib2.urlopen(url))
    for mooring in moorings:
        # platformName = mooring['name']
        for instrument in mooring['jsonInstrumentList']:
            for variable in instrument['jsonVariableList']:
                if variable['standardName'] in variables.keys():
                    try:
                        lastSampleValue = float(re.search('([^\s]+)', variable['lastSampleValue']).group(0))
                    except ValueError:
                        continue

                    result_variable = variables[variable['standardName']]
                    if 'max' in result_variable:
                        max_value = result_variable['max']
                    else:
                        max_value = lastSampleValue

                    if 'min' in result_variable:
                        min_value = result_variable['min']
                    else:
                        min_value = lastSampleValue

                    if max_value < lastSampleValue:
                        max_value = lastSampleValue

                    if min_value > lastSampleValue:
                        min_value = lastSampleValue

                    result_variable['min'] = min_value
                    result_variable['max'] = max_value
                    result_variable['inputUnits'] = variable['inputUnits']


    return HttpResponse(simplejson.dumps(variables), mimetype='application/json')