# coding: utf-8

import logging

from django.http import HttpResponse
from django.utils import simplejson

logger = logging.getLogger(__name__)


def list_images(request, location):
    """Get JSON array of SAPO forecast images of a given location. The images are previously croped (and cached for 24 hours).
    Example::
    """
    test_data = [
        {
            "image": "/static/images-diving/jellyfish.jpg",
            "title": " Jellyfish (Pelagia noctiluca) "          
        },
        {
            "image": "/static/images-diving/barracudes.jpg",
            "title": "Barracuda (Sphyraena)"
        },
        {
            "image": "/static/images-diving/nudibrach.jpg",
            "title": "Nudibrach (Flabellina ischitana)"
        },
        {
            "image": "/static/images-diving/rainbow_wrasse.jpg",
            "title": "Rainbow wrasse (Coris julis)"
        },
        {
            "image": "/static/images-diving/sea_eltoro.jpg",
            "title": "Enviroment sea"
        },
        {
            "image": "/static/images-diving/mysid_shrimps.jpg",
            "title": "Mysid shrimps"
        },
        {

            "image": "/static/images-diving/forkbeard.jpg",
            "title": "Forkbeard (Phycis phycis)"
        },
        {
            "image": "/static/images-diving/seahorse.jpg",
            "title": "Seahorse (Hippocampus guttulatus)"
        }
    ]


    json = simplejson.dumps(test_data)
    return HttpResponse(json, mimetype='application/json')
