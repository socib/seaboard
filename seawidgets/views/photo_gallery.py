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
            "title": " Jellyfish (Pelagia noctiluca) ",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {
            "image": "/static/images-diving/barracudes.jpg",
            "title": "Barracuda (Sphyraena)",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {
            "image": "/static/images-diving/nudibrach.jpg",
            "title": "Nudibrach (Flabellina ischitana)",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {
            "image": "/static/images-diving/rainbow_wrasse.jpg",
            "title": "Rainbow wrasse (Coris julis)",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {
            "image": "/static/images-diving/sea_eltoro.jpg",
            "title": "enviroment sea",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {
            "image": "/static/images-diving/mysid_shrimps.jpg",
            "title": "Mysid shrimps",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {

            "image": "/static/images-diving/forkbeard.jpg",
            "title": "Forkbeard (Phycis phycis)",
            "autor": "Miquel Gomila (@miknuk)"
        },
        {
            "image": "/static/images-diving/seahorse.jpg",
            "title": "Seahorse (Hippocampus guttulatus)",
            "autor": "Miquel Gomila (@miknuk)"
        }
    ]


    json = simplejson.dumps(test_data)
    return HttpResponse(json, mimetype='application/json')
