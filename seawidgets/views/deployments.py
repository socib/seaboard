# coding: utf-8
import csv
from xml.dom import minidom
import json
import datetime
import time
from django.http import HttpResponse
from django.utils import simplejson
from django.views.decorators.cache import cache_page
from django.conf import settings
import urllib2
import re
from collections import Counter, OrderedDict

PLATFORM_TYPES = (
    'Glider',
    'Research Vessel',
    'Surface drifter',
    'Profiler drifter',
    'Coastal Station',
    'Oceanographic Buoy',
    'Sea Level',
    'Weather Station')

def current_turtles(request):
    # Hardcoded urls for each turtle
    turtles = (
        settings.DATADISCOVERY_URL + '/deployment-info?id_platform=227&id_deployment=391',
        settings.DATADISCOVERY_URL + '/deployment-info?id_platform=226&id_deployment=390'
    )

    outjson = dict(type='FeatureCollection', features=[])

    for url in turtles:
        fp = urllib2.urlopen(url)
        try:
            geojson = json.load(fp)
            if geojson.get('type', None) == 'FeatureCollection' and type(geojson.get('features', None) == list):
                outjson['features'] += [geojson['features'][i] for i in (0, -1)]
        except ValueError, e:
            pass  # invalid json
    return HttpResponse(json.dumps(outjson), mimetype='application/json')

@cache_page(60 * 5, cache="default")
def ship_tracking(request,mmsi):
    if mmsi != "":
        features = []

        url = 'http://mob0.marinetraffic.com/ais/gettrackxml.aspx?mmsi=' + mmsi
        try:
            sf = urllib2.urlopen(url)
            dom = minidom.parse(sf)
            positions = dom.getElementsByTagName('POS')
            if len(dom.getElementsByTagName('POS')) > 0:
                timestamps = []
                coordinates = []
                for p in positions:
                    stime = time.mktime(datetime.datetime.strptime(str(p.attributes['TIMESTAMP'].value).split(".")[0],
                                                                      "%Y-%m-%dT%H:%M:%S").timetuple())*1000
                    timestamps.append(stime)
                    coord = [float(p.attributes['LON'].value), float(p.attributes['LAT'].value)]
                    coordinates.append(coord)
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": coord
                        },
                        "properties": {
                            "speed": p.attributes['SPEED'].value,
                            "course": p.attributes['COURSE'].value,
                            # "timestamp": p.attributes['TIMESTAMP'].value,
                            "time": stime
                        }
                    })

                features.insert(0, {
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coordinates
                    },
                    "properties": {
                        "linestringTimestamps": timestamps,
                        "name": "Socib Uno (Hurricane)"
                    }
                })

                outjson = {
                    "type": "FeatureCollection",
                    "features": features
                }

            else:
                outjson = {
                    "error": "Empty response"
                }

        except urllib2.URLError, err:
            outjson = {
                "error": str(err)
            }
            pass
        finally:
            try:
                sf.close()
            except NameError:
                pass
    else:
        outjson = {
                "error": "Provide a valid mmsi"
        }
    # outjson = {}
    # opener = urllib2.build_opener()l
    # opener.addheaders = [('User-agent', 'Mozilla/5.0')]

    # fp = opener.open('http://www.marinetraffic.com/en/api/exportvessels/v:4/100f603ee069ffa7dbadf4d087c69d79f241bb5c/protocol:csv/timespan:5')
    # try:
    #     cr = csv.reader(fp)
    #
    #     rownum = 0
    #     for row in cr:
    #         if rownum == 0:
    #             header = row
    #             iMMSI = header.index('MMSI')
    #             iLon = header.index(' LON')
    #             iLat = header.index(' LAT')
    #             iSpeed = header.index(' SPEED')
    #             iCourse = header.index(' COURSE')
    #         else:
    #             if row[iMMSI] == '225950380':
    #                 outjson ={
    #                     "type": "Point",
    #                     "coordinates": [float(row[iLon]), float(row[iLat])],
    #                     "properties": {
    #                         "speed": row[iSpeed],
    #                         "course": row[iCourse]
    #                     }
    #                 }
    #                 # for fields in header:
    #                 #     outjson[fields] = row[header.index(fields)]
    #         rownum += 1
    # except ValueError, e:
    #     pass  # invalid csv

    return HttpResponse(json.dumps(outjson), mimetype='application/json')

@cache_page(60 * 60 * 2, cache="default")
def current_deployments_stats(request):
    """Get current SOCIB deployments stats (how many drifters, argo, gliders, RV, moorings...).

    """
    cnt = Counter(PLATFORM_TYPES)
    cnt.subtract(cnt)  # init whit zeroes

    # Add deployments
    url = settings.DATADISCOVERY_URL + '/list-deployments?state=active'
    deployments = simplejson.load(urllib2.urlopen(url))
    platforms = [deployment['platform']['platformType'] for deployment in deployments]
    cnt.update(platforms)

    # Add moorings
    url = settings.DATADISCOVERY_URL + '/list-moorings'
    moorings = simplejson.load(urllib2.urlopen(url))
    platforms = [mooring['platformType'] for mooring in moorings]
    cnt.update(platforms)

    results = OrderedDict(sorted(cnt.items(), key=lambda item: item[1], reverse=True))

    return HttpResponse(simplejson.dumps(results), mimetype='application/json')


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
                        if variable['standardName'] == 'water_surface_height_above_reference_datum':
                            lastSampleValue = round(lastSampleValue, 2)
                        else:
                            lastSampleValue = round(lastSampleValue, 1)

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
