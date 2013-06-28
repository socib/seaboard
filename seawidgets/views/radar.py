# coding: utf-8

from django.http import Http404, HttpResponse, HttpResponseForbidden, HttpResponseServerError, HttpResponseRedirect
from os.path import isfile, isdir, join, getmtime
from django.conf import settings
import seawidgets.functions.utils as _utils

import urllib2, datetime
from PIL import Image, ImageFile 



def animation(request, location_code):
    image_destination = 'CACHE/img/radar_' + location_code + '.gif'
    if not file_exists_and_not_old(join(settings.STATIC_ROOT,image_destination)):
        yesterday = datetime.datetime.utcnow() - datetime.timedelta(days=1)        
        init_time = yesterday.strftime('%Y-%m-%dT%H:00:00.000Z').replace(':','%3A')        
        end_time = (datetime.datetime.utcnow()- datetime.timedelta(seconds=7200)).strftime('%Y-%m-%dT%H:00:00.000Z').replace(':','%3A')        

        urlRadarImg = 'http://thredds.socib.es/thredds/wms/observational/hf_radar/hf_radar_ibiza-scb_codarssproc001_aggregation/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_agg.nc?REQUEST=GetMap&VERSION=1.3.0&STYLES=linevec/ferret&CRS=CRS:84&WIDTH=512&HEIGHT=512&FORMAT=image/gif&TRANSPARENT=true&LAYERS=sea_water_velocity&BBOX=-0.2,38.1,2.0,39.2&TIME=' + init_time  + '%2F' + end_time

        save_image(urlRadarImg,image_destination)

    return HttpResponseRedirect (settings.STATIC_URL  + image_destination)
    


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

def save_image(url,destination):
    inStream = urllib2.urlopen(url)

    # parser = ImageFile.Parser()
    # while True:
    #     s = inStream.read(1024)
    #     if not s:
    #         break
    #     parser.feed(s)
    # inImage = parser.close()

    # inImage.save(settings.STATIC_ROOT  + destination)

    with open(settings.STATIC_ROOT  + destination, "wb") as local_file:
        local_file.write(inStream.read())    
