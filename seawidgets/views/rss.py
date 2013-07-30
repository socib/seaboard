# coding: utf-8

from django.http import HttpResponse
from django.utils import simplejson
import feedparser
from django.views.decorators.cache import cache_page


@cache_page(60 * 60 * 2, cache="default")
def read(request):
    """Parse RSS feed given inside 'url' get param. It returns a JSON array with the title and link of each entry.
    The result is cached for 2 hours.
    """

    if request.GET.get('url'):
        url = request.GET.get('url')
        data = feedparser.parse(url)
        results = []
        for entry in data.entries:
            results.append({"title": entry.title, "link": ugly_amp_replace(entry.link)})
    else:
        results = {'error': 'url parameter is missing'}

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


def ugly_amp_replace(url):
    # Socib NEWS RSS gives us the links with &amp instead just &
    return url.replace('&amp', '&')
