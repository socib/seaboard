# coding: utf-8

from django.template import RequestContext
from django.http import Http404, HttpResponse
from django.shortcuts import render_to_response
from django.utils import simplejson
from django.conf import settings
import seawidgets.functions.utils as _utils
from seawidgets.models import Location
from django.views.decorators.cache import cache_page

import datetime
import urllib2

STATION_VARIABLES = ['air_temperature', 'wind_speed', 'air_pressure', 'relative_humidity', 'rain_accumulation']

INPUT_UNITS = {
    'air_temperature': '°C',
    'wind_speed': 'km/h',
}

DISPLAY_NAMES = {
    'air_temperature': 'Air temperature',
    'wind_speed': 'Wind speed',
    'air_pressure': 'Air pressure',
    'relative_humidity': 'Relative humidity',
    'rain_accumulation': 'Rain accumulation',
}

CONVERSION = {
    'wind_speed': lambda x: round(x * 3.6, 2),
}

@cache_page(60 * 60 * 1, cache="default")
def station_info(request, location_code, format='html', template='weather_station/station_info.html'):
    """Get current data form weather station and minimum and maximum values for the last 24 hours. It search for all variables listed in STATION_VARIABLES (now: 'air_temperature', 'wind_speed', 'air_pressure', 'relative_humidity', 'rain_accumulation').
    It returns a JSON array with every variable.
    Example of data of a variable::

        {
            "inputUnits": "°C",
            "display_name": "Air temperature",
            "min": {
                "value": 23.3,
                "time": "30/07/2013 06:44"
            },
            "max": {
                "value": 30.5,
                "time": "29/07/2013 12:26"
            },
            "current": {
                "value": 25.6,
                "time": "30/07/2013 11:59"
            },
            "standard_name": "air_temperature"
        }

    :param location_code:
    :param format: html or json
    :param template: for html format

    """
    try:
        location = Location.objects.get(code__iexact=location_code)
        if len(location.location) == 0:
            location.location = location.zone.latlong

    except Location.DoesNotExist:
        raise Http404

    id_platform = location.zone.id_platform
    id_instrument = ''
    id_variable = ''

    # get instrument and variable list from DataDiscovery
    url = settings.DATADISCOVERY_URL + '/mooring-last-data?id_platform=' + str(id_platform) + '&mode=catalog'
    mooring_last_data = simplejson.load(urllib2.urlopen(url))
    results = []

    for instrument in mooring_last_data['jsonInstrumentList']:
        id_instrument = instrument['id']
        variable_list = instrument['jsonVariableList']
        displayName = ''

        # Process variables
        for standard_name in STATION_VARIABLES:
            # Get id_variable
            id_variable = ''
            for variable_info in variable_list:
                if variable_info['standardName'] == standard_name:
                    id_variable = variable_info['id']
                    displayName = variable_info['displayName']
                    break

            if id_variable != '':
                variable_data = get_variable_data(id_platform, id_instrument, id_variable, standard_name, displayName)
                if 'error' not in variable_data.keys():
                    # wind_speed hack. Add wind_from_direction.lastSampleValue
                    if standard_name == 'wind_speed':
                        variable_data['current']['wind_from_direction'] = get_wind_from_direction(variable_list)

                results.append(variable_data)

    if format == 'json':
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')
    else:
        kwvars = {
            'location': location,
            'data': results
        }
    return render_to_response(template, kwvars, RequestContext(request))

@cache_page(60 * 5, cache="default")
def station_variable_info(request, location_code='pdp', variable='air_temperature'):
    """Get weather station data for just one variable."""

    try:
        location = Location.objects.get(code__iexact=location_code)
        if len(location.location) == 0:
            location.location = location.zone.latlong

    except Location.DoesNotExist:
        raise Http404

    id_platform = location.zone.id_platform
    id_instrument = ''
    id_variable = ''

    # get instrument and variable list
    url = settings.DATADISCOVERY_URL + '/mooring-last-data?id_platform=' + str(id_platform) + '&mode=catalog'
    mooring_last_data = simplejson.load(urllib2.urlopen(url))
    id_instrument = mooring_last_data['jsonInstrumentList'][0]['id']
    variable_list = mooring_last_data['jsonInstrumentList'][0]['jsonVariableList']
    displayName = ''
    for variable_info in variable_list:
        if variable_info['standardName'] == variable:
            id_variable = variable_info['id']
            displayName = variable_info['displayName']
            break

    variable_data = get_variable_data(id_platform, id_instrument, id_variable, variable, displayName)
    # wind_speed hack. Add wind_from_direction.lastSampleValue
    if variable == 'wind_speed':
        variable_data['current']['wind_from_direction'] = get_wind_from_direction(variable_list)

    json = simplejson.dumps(variable_data)
    return HttpResponse(json, mimetype='application/json')


def plotting_data(request, location_code='pdp', variable='air_temperature'):
    try:
        location = Location.objects.get(code__iexact=location_code)
        if len(location.location) == 0:
            location.location = location.zone.latlong

    except Location.DoesNotExist:
        raise Http404

    id_platform = location.zone.id_platform
    id_instrument = ''
    id_variable = ''

    # get instrument and variable list
    url = settings.DATADISCOVERY_URL + '/mooring-last-data?id_platform=' + str(id_platform) + '&mode=catalog'
    mooring_last_data = simplejson.load(urllib2.urlopen(url))
    id_instrument = mooring_last_data['jsonInstrumentList'][0]['id']
    variable_list = mooring_last_data['jsonInstrumentList'][0]['jsonVariableList']
    for variable_info in variable_list:
        if variable_info['standardName'] == variable:
            id_variable = variable_info['id']
            break

    url = settings.DATADISCOVERY_URL + '/mooring-variable-plotting-data?id_platform=' + str(id_platform) + '&id_instrument=' + str(id_instrument) + '&id_variable=' + str(id_variable)

    return HttpResponse(urllib2.urlopen(url), mimetype='application/json')


# FUNCTIONS
def get_variable_data(id_platform, id_instrument, id_variable, standard_name, displayName):
    # Get data from DataDiscovery
    url = settings.DATADISCOVERY_URL + '/mooring-variable-plotting-data?id_platform=' + str(id_platform) + '&id_instrument=' + str(id_instrument) + '&id_variable=' + str(id_variable)
    mooring_plot_data = simplejson.load(urllib2.urlopen(url))

    if standard_name in INPUT_UNITS.keys():
        input_units = INPUT_UNITS[standard_name]
    else:
        input_units = mooring_plot_data['inputUnits']

    if standard_name in DISPLAY_NAMES.keys():
        displayName = DISPLAY_NAMES[standard_name]

    # Filter data receive from service, to get only last 24 hours valid data
    yesterday = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    init_time = _utils.unix_time_millis(yesterday)
    variable_data = filter(lambda x: x[0] > init_time and x[1] is not None, mooring_plot_data['dataList']['timeDimensionData'])

    if len(variable_data) > 0:
        current = {'value': conversion(variable_data[-1][1], standard_name), 'time': _utils.strftime_from_millis(variable_data[-1][0])}
        variable_data.sort(key=lambda data: data[1])
        min_x, max_x, min_y, max_y = variable_data[0][0], variable_data[-1][0], variable_data[0][1], variable_data[-1][-1]
        results = {'inputUnits': input_units, 'min': {'value': conversion(min_y, standard_name), 'time': _utils.strftime_from_millis(min_x)}, 'max': {'value': conversion(max_y, standard_name), 'time': _utils.strftime_from_millis(max_x)}, 'current': current, 'display_name': displayName, 'standard_name': standard_name}
    else:
        results = {'error': 'No data available', 'current': {'value:': 'No data', 'time': 0}, 'display_name': displayName, 'standard_name': standard_name}

    return results


def conversion(x, standard_name):
    if standard_name in CONVERSION.keys():
        return (CONVERSION[standard_name])(x)
    return x


def get_wind_from_direction(variable_list):
    for variable_info in variable_list:
        if variable_info['standardName'] == 'wind_from_direction':
            return variable_info['lastSampleValue']
    return ''
