# coding: utf-8

from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.http import Http404, HttpResponse, HttpResponseForbidden, HttpResponseServerError, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404, render
from django.utils import simplejson
from django.conf import settings

import seawidgets.functions.utils as _utils

from os import listdir
from os.path import isfile, isdir, join, getmtime
import re
import datetime, time
from random import choice
from seawidgets.models import Zone

import logging
logger = logging.getLogger(__name__)


def latest_tiny(request,location,cameras):    
    return latest(request,location,cameras,'_tn')        

def latest_mobile(request,location,cameras):    
    return latest(request,location,cameras,'','latest_mobile')        

def latest_mobile_tiny(request,location,cameras):    
    return latest(request,location,cameras,'_tn','latest_mobile')        

def latest(request,location,cameras,folder_suffix='',images_folder='latest_images'):    
    end_stations = False
    station = 0
    images = []
    if location == 'socib':
        location = choice(['snb','pdp','clm'])

    try:
        zone = Zone.objects.get(code__iexact=location)
    except Zone.DoesNotExist:
        raise Http404                    

    cameras = cameras.split(",")
    while not end_stations:
        station_str = str(station) if station > 0 else '' 

        imagespath = '/home/mobims/imageData/' + location + '/sirena/' + location + station_str + folder_suffix + '/' + images_folder + '/'

        if isdir(imagespath):
            images.extend ([ {'image': f, 'station': station_str, 'path': imagespath, 'time': image_time_from_filename(join(imagespath,f)) } for f in listdir(imagespath) if f.endswith(('_snap.png','_snap.jpeg','_snap.jpg')) and isfile(join(imagespath,f)) and in_cameras(f,cameras) and _utils.isimage(join(imagespath,f)) ])
        else:        
            if station != 0:
                end_stations = True
        station = station + 1

    results = []
    for image in sorted(images):
        result = {}
        result['image'] = 'http://www.socib.es/users/mobims/imageArchive/' + location + '/sirena/'+ location + image['station'] + folder_suffix +'/' + images_folder + '/' + image['image']
        result['title'] = image_title_from_filename(zone,image['image'],image['path']) 
        result['time']  = image['time']
        result['image_tn'] = 'http://www.socib.es/users/mobims/imageArchive/' + location + '/sirena/'+ location + image['station'] + '_tn/' + images_folder + '/' + image['image'].replace('.png','.jpeg') 
        result['camera'] = location + "_" + image['image'][0:image['image'].find('_')]
        results.append(result)
   
    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')

def today_tiny(request,location,cameras):    
    return today(request,location,cameras,'_tn')        


def today(request,location,cameras,folder_suffix=''):
    # Default return list
    results = []

    today = datetime.datetime.today()
    yesterday = datetime.date.fromordinal(today.toordinal()-1)

    logger.info('Enter beamon_today. Cameras %s' % cameras)
    
    if location == 'socib':
        location = choice(['snb','pdp','clm'])

    try:
        zone = Zone.objects.get(code__iexact=location)
    except Zone.DoesNotExist:
        raise Http404                    

    cameras = cameras.split(",")

    for camera in cameras:
        camera_location = find_camera_location(location,camera,folder_suffix)
        if len(camera_location) > 0:
            for day in [yesterday,today]:
                imagespath = '/home/mobims/imageData/' + location + '/sirena/' + camera_location + '/' + camera + '/' + day.strftime('%Y/%m/%d') + '/'
                if isdir(imagespath):
                    files = sorted(f for f in listdir(imagespath) if isfile(join(imagespath, f)))
                    images = [ { 'image': f } for f in files if f.startswith( camera_location.replace(folder_suffix,'') + '_s') and _utils.isimage(join(imagespath,f)) ]
                else:
                    images = []
               
                results.extend ([ {'image' : 'http://www.socib.es/users/mobims/imageArchive/' + location + '/sirena/'+ camera_location + '/' + camera + '/' + day.strftime('%Y/%m/%d') + '/' + image['image'] , 'title': image_title(zone,image['image'], camera) , 'camera': location + "_" + camera} for image in images ])   

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


# FUNCTIONS
def image_title(zone,image, camera):
    title = '%s - %s: %s' % (zone.name,camera, image)
    try:
        date_search = re.search('([0-9]{4}(-[0-9]{2}){4})', image, re.IGNORECASE)
        if date_search:
            date = date_search.group(1)
            date_object = _utils.utc_to_local(datetime.datetime.strptime(date,'%Y-%m-%d-%H-%M'))
            title = '%s - %s: %s' % (zone.name,camera, date_object.strftime('%d/%m/%Y %H:%M') )
    except:
        pass

    return title

def image_time_from_filename(filename):
    time_object = ''
    try:
        time_object = time.localtime(getmtime(filename))
    except:
        pass   
    return time.strftime('%d/%m/%Y %H:%M',time_object)    
 
def image_title_from_filename(zone,image,imagepath):
    title = '%s - %s' % (zone.name,image)
    try:
        time_object = time.localtime(getmtime(join(imagepath,image)))
        camera = image[0:image.find('_')]
        title = '%s - %s: %s' % (zone.name, camera, time.strftime('%d/%m/%Y %H:%M',time_object) )
    except:
        pass   

    return title    
 

def find_camera_location(location,camera, folder_suffix = ''):
    end_stations = False
    station = 0
    camera_location = ''

    while not end_stations and camera_location == '':
        station_str = str(station) if station > 0 else '' 
        stationpath = '/home/mobims/imageData/' + location + '/sirena/' + location + station_str + folder_suffix 
        if isdir(stationpath):
            if isdir(stationpath + '/' + camera):
                camera_location = location + station_str  + folder_suffix 
        elif station != 0:
             end_stations = True
        station = station + 1

    return camera_location

def in_cameras(image,cameras):
    if 'all' in cameras:
        return True

    if image[0:image.find('_')] in cameras:
        return True
    else:
        return False
