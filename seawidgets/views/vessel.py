# coding: utf-8

from django.http import HttpResponse
from django.utils import simplejson
from django.conf import settings
import csv
import datetime
import seawidgets.functions.utils as _utils
from os.path import isfile, isdir, join
from django.views.decorators.cache import cache_page


folderbase = settings.VESSEL_DATA_ROOT


def current_location(request):
    """Read last line from posicion.proc file to get current location, speed, depth... It returs a JSON object.
    Example::

        {
            "sog": "0.4",
            "long": "4.698",
            "depth": "2548.5",
            "cog": "346.7",
            "time": "12-07-2013 20:26:42",
            "lat": "38.836",
            "speed": "0.4"
        }

    """
    results = {}
    results['time'] = 0
    results['long'] = 'N/A'
    results['lat'] = 'N/A'
    results['speed'] = 'N/A'
    results['depth'] = 'N/A'
    results['cog'] = 'N/A'
    results['sog'] = 'N/A'

    today = datetime.datetime.today()
    yesterday = datetime.date.fromordinal(today.toordinal() - 1)

    folderpath = folderbase + '%s/posicion.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/posicion.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results['error'] = 'Folder %s does not exist' % folderpath
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.posicion.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results['error'] = 'File %s does not exist' % filename
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    datafile = open(join(folderpath, filename), 'rb')
    positions = _utils.tail(datafile, 5)

    positionA = positions[0].split(',')
    positionB = positions[-2].split(',')

    # Compare begin and end position:
    timeA = datetime.datetime.strptime(positionA[0], '%d-%m-%Y %H:%M:%S')
    timeB = datetime.datetime.strptime(positionB[0], '%d-%m-%Y %H:%M:%S')
    duration = (timeB - timeA).seconds
    distance = _utils.haversine(positionA[1], positionA[2], positionB[1], positionB[2])
    velocity = distance * 1000 / duration

    if velocity > 13.3:
        results['error'] = 'Data not ok. It shows a distance of %f km in %d seconds' % (distance, duration)
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    # fecha,longitud,latitud,rumbo,velocidad,profundidad,cog,fecha_telegrama
    results['time'] = positionB[0]
    results['long'] = float(positionB[1])
    results['lat'] = float(positionB[2])
    results['speed'] = float(positionB[4])
    results['depth'] = float(positionB[5])
    results['cog'] = float(positionB[6])

    datafile.close()

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


@cache_page(60 * 25, cache="default")
def location(request):
    """Get JSON arrays of position, speed, depth... taken every 10 minutes from yesterday and today. The result is cached for 25 minutes.
    Example::

        {
            "long": [],
            "depth": [],
            "cog": [],
            "time": [],
            "lat": [],
            "speed": []
        }

    """
    results = {}
    results['time'] = []
    results['long'] = []
    results['lat'] = []
    results['speed'] = []
    results['depth'] = []
    results['cog'] = []

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists
    today = datetime.datetime.today()

    folderpath = folderbase + '%s/posicion.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        today = today.replace(day=1)
        yesterday = datetime.date.fromordinal(today.toordinal() - 1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/posicion.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results['error'] = 'Folder %s does not exist' % folderpath
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.posicion.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results['error'] = 'File %s does not exist' % filename
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    # fecha,longitud,latitud,rumbo,velocidad,profundidad,cog,fecha_telegrama
    yesterday = datetime.date.fromordinal(today.toordinal() - 1)
    for day in [yesterday, today]:
        folderpath = folderbase + '%s/posicion.proc/' % day.strftime('%m-%Y')
        filename = '%s.posicion.proc' % day.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            with open(join(folderpath, filename), 'rb') as infile:
                data = csv.DictReader(infile, delimiter=',')
                last_time = None
                for line in data:
                    try:
                        this_time = datetime.datetime.strptime(line['fecha'], '%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            for field in line.keys():
                                if len(field) < 5 or field[0:5] != 'fecha':
                                    line[field] = float(line[field])

                            results['time'].append(line['fecha'])
                            results['long'].append(line['longitud'])
                            results['lat'].append(line['latitud'])
                            results['speed'].append(line['velocidad'])
                            results['depth'].append(line['profundidad'])
                            results['cog'].append(line['cog'])
                            last_time = this_time
                    except:
                        pass

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


@cache_page(60 * 25, cache="default")
def trajectory(request):
    """Get GeoJSON with the trajectory of the vessel in last two days."""

    today = datetime.datetime.today()
    folderpath = folderbase + '%s/posicion.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        yesterday = datetime.date.fromordinal(today.toordinal() - 1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/posicion.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results = {'error': 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.posicion.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results = {'error': 'File %s does not exist' % filename}
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    coordinates = []
    yesterday = datetime.date.fromordinal(today.toordinal() - 1)

    for day in [yesterday, today]:
        filename = '%s.posicion.proc' % day.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            with open(join(folderpath, filename), 'rb') as infile:
                positions = csv.DictReader(infile, delimiter=',')
                # fecha,longitud,latitud,rumbo,velocidad,profundidad,cog,fecha_telegrama
                last_time = None
                last_lon = None
                last_lat = None
                for position in positions:
                    # parse date: 18-02-2013 14:47:16
                    try:
                        this_time = datetime.datetime.strptime(position['fecha'], '%d-%m-%Y %H:%M:%S')
                        duration = (this_time - last_time).seconds if last_time is not None else 1
                        if last_time is None or duration > 600:
                            # check if distance is acceptable (in 10 minutes, less than 8 km, 48km/h, 26kn, 13.3 m/s):
                            distance = _utils.haversine(last_lon, last_lat, position['longitud'], position['latitud'])
                            velocity = distance * 1000 / duration
                            if last_lon is None or velocity < 13.3:
                                coordinates.append([position['longitud'], position['latitud']])
                                last_time = this_time
                                last_lon = position['longitud']
                                last_lat = position['latitud']
                            # else:
                            #     print 'Discarted position for velocity: ', velocity, 'm/s'
                            #     print 'Last position', last_lon, last_lat
                            #     print 'Current position', position['longitud'], position['latitud']

                    except:
                        pass

                # add last
                coordinates.append([position['longitud'], position['latitud']])

    results = {}
    results['type'] = "FeatureCollection"
    results['features'] = [{
                           "type": "Feature",
                           "geometry": {
                               "type": "LineString",
                               "coordinates": coordinates,
                           },
                           "properties": {
                               "name": "SOCIB Vessel trajectory"
                           }
                           }]

    results['features'].append({
                               "type": "Feature",
                               "geometry": {
                                   "type": "Point",
                                   "coordinates": [position['longitud'], position['latitud']]
                               },
                               "properties": {
                                   "PLAT_SPEED": "%s m s-1" % position['velocidad'],
                                   "LON": "%s degree_east" % position['longitud'],
                                   "PLAT_COUR_OG": "%s degree" % position['cog'],
                                   "SEA_FLOOR_DEPTH": "%s m" % position['profundidad'],
                                   "LAT": "%s degree_north" % position['latitud'],
                                   "time": position['fecha'],
                                   "PLAT_COUR": "%s degree" % position['rumbo'],
                                   "html": "<div class=\"popup_content\"><strong>time</strong>: %s<br/><strong>position</strong>: N%s E%s     <br/><strong>speed</strong>: %s m s-1 <br/><strong>course</strong>: %s degree<br/><strong>depth</strong>: %s m <br/><strong>course OG</strong>: %s degree</div>" % (position['fecha'], position['latitud'], position['longitud'], position['velocidad'], position['rumbo'], position['profundidad'], position['cog'],)
                               }
                               })

    results['bbox'] = [90.0, 180.0, -90.0, -180.0]

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


def current_termosal(request):
    """Get last lecture of termosal. It returns a JSON object.
    Example::

        {
            "fluor": 0,
            "sea_water_temperature": 25.581,
            "sea_water_salinity": 37.333,
            "sea_water_electrical_conductivity": 56.846,
            "time": "12-07-2013 20:22:03"
        }

    """

    results = {}
    results['time'] = 0
    results['sea_water_temperature'] = 'N/A'
    results['sea_water_salinity'] = 'N/A'
    results['sea_water_electrical_conductivity'] = 'N/A'
    results['fluor'] = 'N/A'

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists
    today = datetime.datetime.today()

    folderpath = folderbase + '%s/termosal.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        yesterday = datetime.date.fromordinal(today.toordinal() - 1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/termosal.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results['error'] = 'Folder %s does not exist' % folderpath
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.termosal.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results['error'] = 'File %s does not exist' % filename
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    #fecha,fecha_instrumento,temperatura,salinidad,sigmat,conductividad,fluor,temperatura_remota
    datafile = open(join(folderpath, filename), 'r')
    current_termosal = _utils.tail(datafile, 2)[0].split(',')

    salinity = float(current_termosal[3])
    if salinity > 34 and salinity < 40:
        results['time'] = current_termosal[1]
        results['sea_water_temperature'] = float(current_termosal[7])
        results['sea_water_salinity'] = salinity
        results['sea_water_electrical_conductivity'] = float(current_termosal[5])
        results['fluor'] = float(current_termosal[6])

    datafile.close()

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


@cache_page(60 * 25, cache="default")
def termosal(request):
    """Get JSON object with arrays of values from termosal of last two days, taken every 10 minutes. Cached for 25 minutes.
    Example::

        {
            "fluor": [],
            "sea_water_temperature": [],
            "sea_water_salinity": [],
            "sea_water_electrical_conductivity": [],
            "time": []
        }

    """

    results = {}
    results['time'] = []
    results['sea_water_temperature'] = []
    results['sea_water_salinity'] = []
    results['sea_water_electrical_conductivity'] = []
    results['fluor'] = []

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists
    today = datetime.datetime.today()

    folderpath = folderbase + '%s/termosal.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        yesterday = datetime.date.fromordinal(today.toordinal() - 1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/termosal.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results['error'] = 'Folder %s does not exist' % folderpath
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.termosal.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results['error'] = 'File %s does not exist' % filename
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    #fecha,fecha_instrumento,temperatura,salinidad,sigmat,conductividad,fluor,temperatura_remota
    yesterday = datetime.date.fromordinal(today.toordinal() - 1)
    for day in [yesterday, today]:
        folderpath = folderbase + '%s/termosal.proc/' % day.strftime('%m-%Y')
        filename = '%s.termosal.proc' % day.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            with open(join(folderpath, filename), 'rb') as infile:
                data = csv.DictReader(infile, delimiter=',')
                last_time = None
                for line in data:
                    try:
                        this_time = datetime.datetime.strptime(line['fecha_instrumento'], '%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            for field in line.keys():
                                if len(field) < 5 or field[0:5] != 'fecha':
                                    line[field] = float(line[field])

                            if line['salinidad'] > 34 and line['salinidad'] < 40:
                                results['time'].append(line['fecha_instrumento'])
                                results['sea_water_temperature'].append(line['temperatura_remota'])
                                results['sea_water_salinity'].append(line['salinidad'])
                                results['sea_water_electrical_conductivity'].append(line['conductividad'])
                                results['fluor'].append(line['fluor'])
                                last_time = this_time
                    except:
                        pass

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


@cache_page(60 * 25, cache="default")
def meteo(request):
    """Get JSON object with arrays of values from meteo station of last two days, taken every 10 minutes.  Cached for 25 minutes.
    Example::

        {
            "wind_speed": [],
            "wind_from_direction": [],
            "air_pressure": [],
            "humidity": [],
            "air_temperature": [],
            "time": [],
        }

    """
    results = {}
    results['time'] = []
    results['wind_speed'] = []
    results['wind_from_direction'] = []
    results['air_temperature'] = []
    results['humidity'] = []
    results['air_pressure'] = []

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists
    today = datetime.datetime.today()

    folderpath = folderbase + '%s/meteo.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        today = today.replace(day=1)
        yesterday = datetime.date.fromordinal(today.toordinal() - 1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/meteo.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results['error'] = 'Folder %s does not exist' % folderpath
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.meteo.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results['error'] = 'File %s does not exist' % filename
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    # fecha,velocidad_real_viento,velocidad_aparente_viento,direccion_real_viento,temperatura_aire,humedad,presion_atm,fecha_instrumento
    yesterday = datetime.date.fromordinal(today.toordinal() - 1)
    for day in [yesterday, today]:
        folderpath = folderbase + '%s/meteo.proc/' % day.strftime('%m-%Y')
        filename = '%s.meteo.proc' % day.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            with open(join(folderpath, filename), 'rb') as infile:
                data = csv.DictReader(infile, delimiter=',')
                last_time = None
                for line in data:
                    try:
                        this_time = datetime.datetime.strptime(line['fecha_instrumento'], '%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            for field in line.keys():
                                if len(field) < 5 or field[0:5] != 'fecha':
                                    line[field] = float(line[field])

                            results['time'].append(line['fecha_instrumento'])
                            results['wind_speed'].append(line['velocidad_real_viento'])
                            results['wind_from_direction'].append(line['direccion_real_viento'])
                            results['air_temperature'].append(line['temperatura_aire'])
                            results['humidity'].append(line['humedad'])
                            results['air_pressure'].append(line['presion_atm'])
                            last_time = this_time
                    except:
                        pass

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')


def current_meteo(request):
    """Get last lecture of meteo station. It returns a JSON object.
    Example::

        {
            "wind_speed": 1.613,
            "air_pressure": 1016.424,
            "humidity": 87.49,
            "air_temperature": 19.415,
            "time": "11-06-2013 07:47:54,
            "wind_from_direction": 348.125,
        }

    """
    results = {}
    results['time'] = 0
    results['wind_speed'] = 'N/A'
    results['wind_from_direction'] = 'N/A'
    results['air_temperature'] = 'N/A'
    results['humidity'] = 'N/A'
    results['air_pressure'] = 'N/A'

    # Test if /home/vessel/RTDATA/mm-YYYY/meteo.proc/ exists
    today = datetime.datetime.today()

    folderpath = folderbase + '%s/meteo.proc/' % today.strftime('%m-%Y')
    if not isdir(folderpath):
        found = False
        today = today.replace(day=1)
        yesterday = datetime.date.fromordinal(today.toordinal() - 1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/meteo.proc/' % yesterday.strftime('%m-%Y')
            if isdir(folderpath):
                today = yesterday  # prepare to search the correct file
                found = True

        if not found:
            results['error'] = 'Folder %s does not exist' % folderpath
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.meteo.proc' % today.strftime('%d%m%Y')
        if isfile(join(folderpath, filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal() - 1)

    if not file_found:
        results['error'] = 'File %s does not exist' % filename
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')

    # fecha,velocidad_real_viento,velocidad_aparente_viento,direccion_real_viento,temperatura_aire,humedad,presion_atm,fecha_instrumento
    datafile = open(join(folderpath, filename), 'r')
    current_meteo = _utils.tail(datafile, 2)[0].split(',')
    results['time'] = current_meteo[7].replace('\n', '')
    results['wind_speed'] = float(current_meteo[1])
    results['wind_from_direction'] = float(current_meteo[3])
    results['air_temperature'] = float(current_meteo[4])
    results['humidity'] = float(current_meteo[5])
    results['air_pressure'] = float(current_meteo[6])

    datafile.close()

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')
