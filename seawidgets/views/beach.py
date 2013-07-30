# coding: utf-8

from django.http import Http404, HttpResponse
from django.utils import simplejson
from django.views.decorators.cache import cache_page
from bs4 import BeautifulSoup
import urllib2
import re
from seawidgets.models import Location


@cache_page(60 * 30, cache="default")
def platgesdebalears_status(request, location_code):
    """Parse platgesdebalears.com to get beach status.
    Specific URL for the beach is stored in location object in the database.

    The response is a JSON like this::

        {
            "status": "estPermitido",
            "flagMessage": "Green flag",
            "date": "25/07/2013",
            "comment": "Opening service",
            "time": "10:00"
        }

    The result is cached 30 minutes.

    """
    try:
        location = Location.objects.get(code__iexact=location_code)

    except Location.DoesNotExist:
        raise Http404

    url = location.zone.beach_flag_url

    page = urllib2.urlopen(url).read()
    soup = BeautifulSoup(page)

    beach = {}
    # Estat actual: <div class="boxToma estPermitido" id="actual">
    # Cercam actual, i agafam segona classe
    if soup is not None and soup.find('div', {"id": "actual"}):
        beach['status'] = soup.find('div', {"id": "actual"})['class'][1]
        # Bandera
        beach['flagMessage'] = soup.select('div.boxBotToma')[0].getText()

        # Date, <span class="txtAzul18B">Condicions d'avui per al bany (13/06/2013)</span>
        date = soup.select('span.txtAzul18B')[0].getText()
        beach['date'] = re.search('\((.+)\)', date).group(1)

        # Time <div class="boxTopToma"><span class="txtWhite18B">11:00</span> <span class="txtWhite12B">hores</span></div>
        beach['time'] = soup.select('div.boxTopToma span.txtWhite18B')[0].getText()

        # comment <div id="capsaComentariInner"><span class="txtRojo11B">Obertura servei<br><br></span>
        beach['comment'] = soup.select('#capsaComentariInner span.txtRojo11B')[0].getText()
    else:
        beach['status'] = 'estAusente'
        beach['comment'] = 'No data received'

    return HttpResponse(simplejson.dumps(beach), mimetype='application/json')
