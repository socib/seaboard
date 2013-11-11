from django.conf.urls import patterns, url

urlpatterns = patterns(
    'seawidgets.views',
    url(r'^$',
        view='dash.dash',
        name='seawidgets_dash',
        ),
    url(r'^beamon/(?P<location>[-\w]+)/(?P<cameras>\w+(,\w+)*)/latest/?$',
        view='beamon.latest',
        name='seawidgets_beamon_latest',
        ),
    url(r'^beamon/latesttest$',
        view='beamon.latest',
        name='seawidgets_beamon_latest_test'
        ),
    url(r'^beamon/(?P<location>[-\w]+)/(?P<cameras>\w+(,\w+)*)/latest_mobile/?$',
        view='beamon.latest_mobile',
        name='seawidgets_beamon_latest_mobile',
        ),
    url(r'^beamon/(?P<location>[-\w]+)/(?P<cameras>\w+(,\w+)*)/today/?$',
        view='beamon.today',
        name='seawidgets_beamon_today',
        ),
    url(r'^beamon/(?P<location>[-\w]+)/(?P<cameras>\w+(,\w+)*)/latest/tn/?$',
        view='beamon.latest_tiny',
        name='seawidgets_beamon_latest_tn',
        ),
    url(r'^beamon/(?P<location>[-\w]+)/(?P<cameras>\w+(,\w+)*)/latest_mobile/tn/?$',
        view='beamon.latest_mobile_tiny',
        name='seawidgets_beamon_latest_mobile_tn',
        ),
    url(r'^beamon/(?P<location>[-\w]+)/(?P<cameras>\w+(,\w+)*)/today/tn/?$',
        view='beamon.today_tiny',
        name='seawidgets_beamon_today_tn',
        ),
    url(r'^weather/(?P<location_code>[-\w]+).(?P<format>[-\w]+)$',
        view='weather_station.station_info',
        name='seawidgets_weather_station_info',
        ),
    url(r'^weather/(?P<location_code>[-\w]+)/forecast.json$',
        view='weather_forecast.forecast',
        name='seawidgets_weather_forecast',
        ),
    url(r'^weather/(?P<location_code>[-\w]+)/(?P<variable>[-\w]+).json$',
        view='weather_station.station_variable_info',
        name='seawidgets_weather_station_variable_info',
        ),
    url(r'^weather/(?P<location_code>[-\w]+)/(?P<variable>[-\w]+)/plotting_data.json$',
        view='weather_station.plotting_data',
        name='seawidgets_weather_station_plotting_data',
        ),
    url(r'^rss/read$',
        view='rss.read',
        name='seawidgets_rss_read',
        ),
    url(r'^beach/(?P<location_code>[-\w]+)/status.json$',
        view='beach.platgesdebalears_status',
        name='seawidgets_beach_status',
        ),
    # If none of the above patters is match, it will try to load location dash.
    url(r'^(?P<zone_code>[-\w]+)/?$',
        view='dash.dash',
        name='seawidgets_dash',
        ),
    url(r'^(?P<zone_code>[-\w]+)/(?P<location_code>[-\w]+)/?$',
        view='dash.dash',
        name='seawidgets_dash',
        ),
    url(r'^status.json$',
        view='dash.status',
        name='seawidgets_status',
        ),
    url(r'^sapo/(?P<location>[-\w]+)/latest/?$',
        view='sapo.latest',
        name='seawidgets_sapo_latest',
        ),
    url(r'^radar/(?P<location_code>[-\w]+)/capabilities/?$',
        view='radar.capabilities',
        name='seawidgets_radar_capabilities',
        ),
    url(r'^radar/(?P<location_code>[-\w]+)/animation.gif$',
        view='radar.animation',
        name='seawidgets_radar_animation',
        ),
    url(r'^vessel/current_location.json$',
        view='vessel.current_location',
        name='seawidgets_vessel_current_location',
        ),
    url(r'^vessel/location.json$',
        view='vessel.location',
        name='seawidgets_vessel_location',
        ),
    url(r'^vessel/trajectory.json$',
        view='vessel.trajectory',
        name='seawidgets_vessel_trajectory',
        ),
    url(r'^vessel/current_termosal.json$',
        view='vessel.current_termosal',
        name='seawidgets_vessel_current_termosal',
        ),

    url(r'^vessel/termosal.json$',
        view='vessel.termosal',
        name='seawidgets_vessel_termosal',
        ),
    url(r'^vessel/meteo.json$',
        view='vessel.meteo',
        name='seawidgets_vessel_meteo',
        ),
    url(r'^vessel/current_meteo.json$',
        view='vessel.current_meteo',
        name='seawidgets_vessel_current_meteo',
        ),

    url(r'^views/(?P<name>[-\w]+).html$',
        view='dash.widget',
        name='seawidgets_widget',
        ),
    # AliasMatch ^/views/(.*).html /var/www/seaboard/static/widgets/$1/$1.html
)
