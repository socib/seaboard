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
            "image": "http://www.socib.es/users/iserra/images-diving/jellyfish.jpg",
            "title": " Jellyfish (Pelagia noctiluca) "
        },
        {
            "image": "http://www.socib.es/users/iserra/images-diving/Barracudes.jpg",
            "title": "Barracuda (Sphyraena)"
        },
        {
            "image": "http://www.socib.es/users/iserra/images-diving/Nudibrach.jpg",
            "title": "Nudibrach (Flabellina ischitana)"
        },
        {
            "image": "http://www.socib.es/users/iserra/images-diving/Rainbow_wrasse.jpg",
            "title": "Rainbow wrasse (Coris julis)"
        },
        {
            "image": "http://www.socib.es/users/iserra/images-diving/sea_eltoro.jpg",
            "title": " "
        },
        {
            "image": "http://www.socib.es/users/iserra/images-diving/Smoothtrunkfish.jpg",
            "title": "Smooth trunkfish (Lactophys triqueter) "
        }, {
            "image": "http://www.socib.es/users/iserra/images-diving/Forkbeard.jpg",
            "title": "Forkbeard (Phycis phycis)"
        }
    ]

    json = simplejson.dumps(test_data)
    return HttpResponse(json, mimetype='application/json')
