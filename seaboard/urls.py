from django.conf.urls import patterns, include, url
from django.conf import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'seaboard.views.home', name='home'),
    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^login/$', 'django.contrib.auth.views.login'),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/login'}),    
    url(r'^', include('seawidgets.urls')),
    # url(r'^seaboard/', include('seawidgets.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    # TEMP, serve static
    url(r'^static2/(?P<path>.*)$', 'django.views.static.serve',{'document_root': '/var/www/seaboard/static'}),
)

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
