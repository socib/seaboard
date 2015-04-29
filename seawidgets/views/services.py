# coding: utf-8

import mimetypes
import urllib2
from django.http import HttpResponse


def proxy_to(request, path, target_url):
    if 'url' in request.GET and request.GET['url']:
        url = request.GET['url']
        print urllib2.unquote(url).decode('utf8')
    else:
        url = '%s%s' % (target_url, path)
        if 'QUERY_STRING' in request.META and request.META['QUERY_STRING']:
            url += '?' + request.META['QUERY_STRING']
    try:
        proxied_request = urllib2.urlopen(url)
        status_code = proxied_request.code
        mimetype = proxied_request.headers.typeheader or mimetypes.guess_type(url)
        content = proxied_request.read()
    except urllib2.HTTPError as e:
        return HttpResponse(e.msg, status=e.code, content_type='text/plain')
    else:
        return HttpResponse(content, status=status_code, content_type=mimetype)
