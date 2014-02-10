# coding: utf-8

from django.http import Http404, HttpResponse
from django.utils import simplejson
from django.conf import settings

import seawidgets.functions.utils as _utils
import datetime
from random import choice
from os.path import isfile, join, getmtime
from seawidgets.models import Zone

import urllib2
from PIL import ImageFile

import logging
logger = logging.getLogger(__name__)


def latest(request, location):
    """Get JSON array of SAPO forecast images of a given location. The images are previously croped (and cached for 24 hours).
    Example::

        [
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs06.jpg",
                "title": "Waves at 29/07/2013 08:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs08.jpg",
                "title": "Waves at 29/07/2013 10:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs10.jpg",
                "title": "Waves at 29/07/2013 12:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs12.jpg",
                "title": "Waves at 29/07/2013 14:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs14.jpg",
                "title": "Waves at 29/07/2013 16:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs16.jpg",
                "title": "Waves at 29/07/2013 18:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs18.jpg",
                "title": "Waves at 29/07/2013 20:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs20.jpg",
                "title": "Waves at 29/07/2013 22:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs22.jpg",
                "title": "Waves at 30/07/2013 00:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs24.jpg",
                "title": "Waves at 30/07/2013 02:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs26.jpg",
                "title": "Waves at 30/07/2013 04:00"
            },
            {
                "image": "http://seaboardtest.socib.es/static/CACHE/img/sapo_snb00_hs28.jpg",
                "title": "Waves at 30/07/2013 06:00"
            }
        ]

    """
    results = []

    try:
        zone = Zone.objects.get(code__iexact=location)
    except Zone.DoesNotExist:
        raise Http404

    # get datetime of last image generation
    page = urllib2.urlopen(zone.sapo_image_path).read()
    position = page.find(str(datetime.datetime.today().year))
    images_hour_creation = page[position+5:position+7]

    forecast_basehour = 0
    if int(images_hour_creation) > 14:
        forecast_basehour = 12

    forecast_basedatetime = get_time_prediction(forecast_basehour)

    for hour in range(6, 30, 2):
        # download image
        image_destination = 'CACHE/img/sapo_' + location + str(forecast_basehour).zfill(2) + '_hs' + str(hour).zfill(2) + '.jpg'
        if not file_exists_and_not_old(join(settings.STATIC_ROOT, image_destination)):
            process_image('%shs%s.jpg' % (zone.sapo_image_path, str(hour).zfill(2)), image_destination)

        image_forecast_time = forecast_basedatetime + datetime.timedelta(hours=hour)
        results.append({'image': 'http://' + request.META['HTTP_HOST'] + settings.STATIC_URL + image_destination, 'title': 'Waves at %s' % _utils.utc_to_local(image_forecast_time).strftime('%d/%m/%Y %H:%M')})

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


# FUNCTIONS
def file_exists_and_not_old(filepath):
    if not isfile(filepath):
        return False

    created = datetime.datetime.fromtimestamp(getmtime(filepath))
    old = datetime.datetime.now() - created
    if old.days < 1:
        return True
    else:
        return False


def get_time_prediction(forecast_basehour):
    base_prediction = datetime.datetime.utcnow()
    if forecast_basehour == 12 and base_prediction.hour < 12:
        base_prediction = base_prediction - datetime.timedelta(days=1)  # yesterday

    if forecast_basehour == 12:
        base_prediction = base_prediction.replace(hour=12, minute=0, second=0)
    else:
        base_prediction = base_prediction.replace(hour=0, minute=0, second=0)
    return base_prediction


def process_image(url, destination):
    inStream = urllib2.urlopen(url)
    parser = ImageFile.Parser()
    while True:
        s = inStream.read(1024)
        if not s:
            break
        parser.feed(s)

    inImage = parser.close()
    # convert to RGB to avoid error with png and tiffs
    if inImage.mode != "RGB":
        inImage = inImage.convert("RGB")

    # Illes Balears
    crop_dimensions = (120, 180, 468, 407)
    if url.find('sapo_n3') > 0:
        # menorca images have another dimensions
        crop_dimensions = (130, 205, 456, 434)
    elif url.find('sapo_n1') > 0:
        # eivissa images have another dimensions
        crop_dimensions = (130, 158, 350, 430)
    elif url.find('sapo_n2') > 0:
        # Mallorca
        crop_dimensions = (123, 169, 452, 430)

    try:
        inImage.crop(crop_dimensions).save(settings.STATIC_ROOT + destination)
    except IOError:
        # Do not return any image
        return None

    return inImage
