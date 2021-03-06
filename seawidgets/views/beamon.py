# coding: utf-8

from django.http import Http404, HttpResponse
from django.utils import simplejson
import seawidgets.functions.utils as _utils

from os import listdir
from os.path import isfile, isdir, join, getmtime
import re
from datetime import datetime, date
import time
from random import choice
from seawidgets.models import Zone

import logging
logger = logging.getLogger(__name__)


def latest_tiny(request, location, cameras):
    """Get JSON of latest thumbnail image of a list of cameras.

    :param location: location code
    :param cameras: list of cameras separated by commas (or 'all' to show all cameras of this location)
    """
    return latest(request, location, cameras, '_tn')


def latest_mobile(request, location, cameras):
    """Get JSON of latest image of a list of cameras. Select resized images.

    :param location: location code
    :param cameras: list of cameras separated by commas (or 'all' to show all cameras of this location)
    """
    return latest(request, location, cameras, '', 'latest_mobile')


def latest_mobile_tiny(request, location, cameras):
    """Get JSON of latest image of a list of cameras. Select thumbnail of resized images for mobile.

    :param location: location code
    :param cameras: list of cameras separated by commas (or 'all' to show all cameras of this location)
    """
    return latest(request, location, cameras, '_tn', 'latest_mobile')


def latest(request, location, cameras, folder_suffix='', images_folder='latest_images'):
    """
    Get JSON of latest image of a list of cameras. It returns a JSON array. Example.

        [
            {
                "image_tn": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm_tn/latest_images/c01_snap.jpeg",
                "camera": "clm_c01",
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/latest_images/c01_snap.png",
                "time": "29/07/2013 14:00",
                "title": "Cala Millor - c01: 29/07/2013 14:00",
                "timestamp": 1375105609000
            },
            {
                "image_tn": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm_tn/latest_images/c02_snap.jpeg",
                "camera": "clm_c02",
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/latest_images/c02_snap.png",
                "time": "29/07/2013 14:00",
                "title": "Cala Millor - c02: 29/07/2013 14:00",
                "timestamp": 1375105609000
            },
            {
                "image_tn": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm_tn/latest_images/c03_snap.jpeg",
                "camera": "clm_c03",
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/latest_images/c03_snap.png",
                "time": "29/07/2013 14:00",
                "title": "Cala Millor - c03: 29/07/2013 14:00",
                "timestamp": 1375105609000
            }
        ]


    :param location: location code
    :param cameras: list of cameras separated by commas (or 'all' to show all cameras of this location)
    :param folder_suffix: optional. Suffix for base folder (useful to get thumbnails)
    :param images_folder: optional. Folder that contains images (useful to get resized images instead original)
    :returns: JSON array.
    """
    locations = [location]
    if location == 'socib':
        locations = ['snb', 'pdp', 'clm']

    results = []
    cameras = cameras.split(",")
    today = datetime.today()

    for location in locations:
        try:
            zone = Zone.objects.get(code__iexact=location)
        except Zone.DoesNotExist:
            raise Http404

        images = []
        sirenapath = '/home/mobims/imageData/' + location + '/sirena/'

        for folder in listdir(sirenapath):
            if not isdir(join(sirenapath, folder)):
                continue
            pattern = location + "[0-9]*" + folder_suffix + "$"
            m = re.match(pattern, folder)
            if not m:
                continue
            imagespath = sirenapath + folder + '/' + images_folder + '/'
            if isdir(imagespath):
                for f in listdir(imagespath):
                    if not f.endswith(('_snap.png', '_snap.jpeg', '_snap.jpg')):
                        continue
                    filepath = join(imagespath, f)
                    if not isfile(filepath):
                        continue
                    if not in_cameras(f, cameras):
                        continue
                    if not _utils.isimage(filepath):
                        continue
                    mtime = image_mtime_from_file(filepath)
                    dt = datetime.fromtimestamp(mtime)
                    if (today - dt).days > 7:
                        continue
                    images.append({
                        'image': f,
                        'folder': folder,
                        'path': imagespath,
                        'mtime': mtime})

        for image in sorted(images):
            result = {}
            dt = datetime.fromtimestamp(image['mtime'])
            result['image'] = 'http://www.socib.es/users/mobims/imageArchive/' + location + '/sirena/' + image['folder'] + '/' + images_folder + '/' + image['image']
            result['title'] = image_title_from_filename(zone, image['image'], image['path'], dt)
            result['timestamp'] = image['mtime'] * 1000
            result['time'] = dt.strftime('%d/%m/%Y %H:%M')
            tn_folder = image['folder']
            if '_tn' not in tn_folder:
                tn_folder = tn_folder + "_tn"
            result['image_tn'] = 'http://www.socib.es/users/mobims/imageArchive/' + location + '/sirena/' + tn_folder + '/' + images_folder + '/' + image['image'].replace('.png', '.jpeg')
            result['camera'] = location + "_" + image['image'][0:image['image'].find('_')]
            results.append(result)

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


def today_tiny(request, location, cameras):
    """Get JSON of thumbnail images of a list of cameras. For each camera, it returns all images from yesterday and today.

    :param location: location code
    :param cameras: list of cameras separated by commas (or 'all' to show all cameras of this location)
    """
    return today(request, location, cameras, '_tn')


def today(request, location, cameras, folder_suffix=''):
    """Get JSON of thumbnail images of a list of cameras. For each camera, it returns all images from yesterday and today. Example::

        [
            {
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/c01/2013/07/28/clm_s_01_2013-07-28-04-00.png",
                "camera": "clm_c01",
                "title": "Cala Millor - c01: 28/07/2013 06:00"
            },
            {
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/c01/2013/07/28/clm_s_01_2013-07-28-05-00.png",
                "camera": "clm_c01",
                "title": "Cala Millor - c01: 28/07/2013 07:00"
            },
            {
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/c01/2013/07/28/clm_s_01_2013-07-28-06-00.png",
                "camera": "clm_c01",
                "title": "Cala Millor - c01: 28/07/2013 08:00"
            },
            {
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/c01/2013/07/28/clm_s_01_2013-07-28-07-00.png",
                "camera": "clm_c01",
                "title": "Cala Millor - c01: 28/07/2013 09:00"
            },
            {
                [...]
            },
            {
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/c01/2013/07/29/clm_s_01_2013-07-29-12-00.png",
                "camera": "clm_c01",
                "title": "Cala Millor - c01: 29/07/2013 14:00"
            },
            {
                "image": "http://www.socib.es/users/mobims/imageArchive/clm/sirena/clm/c01/2013/07/29/clm_s_01_2013-07-29-13-00.png",
                "camera": "clm_c01",
                "title": "Cala Millor - c01: 29/07/2013 15:00"
            }
        ]

    :param location: location code
    :param cameras: list of cameras separated by commas (or 'all' to show all cameras of this location)
    :param folder_suffix: optional. Suffix for base folder (useful to get thumbnails)
    """

    # Default return list
    results = []

    today = datetime.today()
    yesterday = date.fromordinal(today.toordinal() - 1)

    logger.info('Enter beamon_today. Cameras %s' % cameras)

    if location == 'socib':
        location = choice(['snb', 'pdp', 'clm'])

    try:
        zone = Zone.objects.get(code__iexact=location)
    except Zone.DoesNotExist:
        raise Http404

    cameras = cameras.split(",")

    for camera in cameras:
        camera_location = find_camera_location(location, camera, folder_suffix)
        if len(camera_location) > 0:
            for day in [yesterday, today]:
                imagespath = '/home/mobims/imageData/' + location + '/sirena/' + camera_location + '/' + camera + '/' + day.strftime('%Y/%m/%d') + '/'
                if isdir(imagespath):
                    files = sorted(f for f in listdir(imagespath) if isfile(join(imagespath, f)))
                    images = [{'image': f} for f in files if f.startswith(camera_location.replace(folder_suffix, '') + '_s') and _utils.isimage(join(imagespath, f))]
                else:
                    images = []

                results.extend([{'image': 'http://www.socib.es/users/mobims/imageArchive/' + location + '/sirena/' + camera_location + '/' + camera + '/' + day.strftime('%Y/%m/%d') + '/' + image['image'], 'title': image_title(zone, image['image'], camera), 'camera': location + "_" + camera} for image in images])

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


# FUNCTIONS
def image_title(zone, image, camera):
    title = '%s - %s: %s' % (zone.name, camera, image)
    try:
        date_search = re.search('([0-9]{4}(-[0-9]{2}){4})', image, re.IGNORECASE)
        if date_search:
            date = date_search.group(1)
            date_object = _utils.utc_to_local(datetime.strptime(date, '%Y-%m-%d-%H-%M'))
            title = '%s - Cam %s: %s' % (zone.name,
                camera.replace('c', ''),
                date_object.strftime('%d/%m/%Y %H:%M'))
    except:
        pass

    return title


def image_time_from_filename(filename):
    time_object = ''
    try:
        time_object = time.localtime(getmtime(filename))
    except:
        pass
    return time.strftime('%d/%m/%Y %H:%M', time_object)


def image_mtime_from_file(filename):
    mtime = 0
    try:
        mtime = getmtime(filename)
        mtime = mtime - (mtime % 3600)
    except:
        pass
    return mtime


def image_title_from_filename(zone, image, imagepath, image_dt):
    title = '%s - %s' % (zone.name, image)
    try:
        camera = image[0:image.find('_')]
        title = '%s - Cam %s: %s' % (zone.name,
            camera.replace('c', ''),
            image_dt.strftime('%d/%m/%Y %H:%M'))
    except:
        pass

    return title


def find_camera_location(location, camera, folder_suffix=''):
    end_stations = False
    station = 0
    camera_location = ''

    while not end_stations and camera_location == '':
        station_str = str(station) if station > 0 else ''
        stationpath = '/home/mobims/imageData/' + location + '/sirena/' + location + station_str + folder_suffix
        if isdir(stationpath):
            if isdir(stationpath + '/' + camera):
                camera_location = location + station_str + folder_suffix
        elif station != 0:
            end_stations = True
        station = station + 1

    return camera_location


def in_cameras(image, cameras):
    if 'all' in cameras:
        return True

    if image[0:image.find('_')] in cameras:
        return True
    else:
        return False
