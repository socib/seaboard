# coding: utf-8

"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

If you want to run your tests with colors, install rednose and run the tests with django_nose
    python manage.py test seawidgets  --rednose

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test import Client
from django.core.urlresolvers import reverse
import simplejson

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)



class WeatherForecastTestCase(TestCase):
    fixtures = ['zones.json', 'locations.json']

    def test_forecast_view_works(self):
        """
        Tests forecast
        """
        client = Client()
        response = client.get(reverse('seawidgets_weather_forecast', kwargs={'location_code': 'pdp'}))

        # Check.
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn('daily', json)


class SapoTestCase(TestCase):
    fixtures = ['zones.json']

    def test_latest_view_works(self):
        """
        Tests latest images
        """
        client = Client()
        response = client.get(reverse('seawidgets_sapo_latest', kwargs={'location': 'pdp'}), HTTP_HOST='example.com')
        # Check.
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertGreater(len(json), 0)


class BeachTestCase(TestCase):
    fixtures = ['zones.json', 'locations.json']

    def test_platgesdebalears_status_view_works(self):
        """
        Tests platges de balears
        """
        client = Client()
        response = client.get(reverse('seawidgets_beach_status', kwargs={'location_code': 'clm'}))

        # Check.
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn('status', json)



class WeatherStationTestCase(TestCase):
    fixtures = ['zones.json', 'locations.json']

    def test_station_info_view_works(self):
        """
        Test station info
        """
        client = Client()
        response = client.get(reverse('seawidgets_weather_station_info', kwargs={'location_code': 'clm', 'format': 'json'}))
        # Check.
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertGreater(len(json), 0)
        self.assertIn('standard_name', json[0])

    def test_station_variable_info_view_works(self):
        """
        Tests station variable info
        """

        client = Client()
        response = client.get(reverse('seawidgets_weather_station_variable_info', kwargs={'location_code': 'pdp', 'variable': 'air_temperature'}))
        # Check.
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn('standard_name', json)

    def test_station_plotting_data_view_works(self):
        """
        Test seawidgets_weather_station_plotting_data
        """

        client = Client()
        response = client.get(reverse('seawidgets_weather_station_plotting_data', kwargs={'location_code': 'pdp', 'variable': 'air_temperature'}))
        # Check.
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertGreater(len(json), 0)

