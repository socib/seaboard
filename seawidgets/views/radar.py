# coding: utf-8

from django.http import HttpResponse, HttpResponseRedirect
from os.path import isfile, join, getmtime
from django.conf import settings

import urllib2
import datetime


def animation(request, location_code):
    """Get an animated gif for the observation of the radar for the last 24 hours. It gets the image from the cache (1 hour) or directly from thredds.

    :param location_code: for future use. Now, it will be used only for galfi.
    """
    image_destination = 'CACHE/img/radar_' + location_code + '.gif'
    if not file_exists_and_not_old(join(settings.STATIC_ROOT, image_destination)):
        yesterday = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        init_time = yesterday.strftime('%Y-%m-%dT%H:00:00.000Z').replace(':', '%3A')
        end_time = (datetime.datetime.utcnow() - datetime.timedelta(seconds=7200)).strftime('%Y-%m-%dT%H:00:00.000Z').replace(':', '%3A')

        urlRadarImg = 'http://thredds.socib.es/thredds/wms/observational/hf_radar/hf_radar_ibiza-scb_codarssproc001_aggregation/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_agg.nc?REQUEST=GetMap&VERSION=1.3.0&STYLES=linevec/ferret&CRS=CRS:84&WIDTH=512&HEIGHT=512&FORMAT=image/gif&TRANSPARENT=true&LAYERS=sea_water_velocity&BBOX=-0.2,38.1,2.0,39.2&TIME=' + init_time + '%2F' + end_time

        save_image(urlRadarImg, image_destination)

    return HttpResponseRedirect(settings.STATIC_URL + image_destination)


def capabilities(request, location_code):
    # Ignore location_code. But
    # GetCapabilities proxy
    url = 'http://thredds.socib.es/thredds/wms/hf_radar/hf_radar_ibiza-scb_codarssproc001/L1/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_latest.nc?service=WMS&version=1.3.0&request=GetCapabilities'

    return HttpResponse(urllib2.urlopen(url), mimetype='text/xml')


# FUNCTIONS
def file_exists_and_not_old(filepath):
    if not isfile(filepath):
        return False

    created = datetime.datetime.fromtimestamp(getmtime(filepath))
    old = datetime.datetime.now() - created
    if old.seconds < 3600:
        return True
    else:
        return False


def save_image(url, destination):
    inStream = urllib2.urlopen(url)

    with open(settings.STATICFILES_DIRS[0] + destination, "wb") as local_file:
        local_file.write(inStream.read())
