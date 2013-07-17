# coding: utf-8

from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.http import Http404, HttpResponse, HttpResponseForbidden, HttpResponseServerError, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404, render
from django.conf import settings
from django.utils import simplejson
from django.contrib.staticfiles.views import serve
import os, csv, datetime
import seawidgets.functions.utils as _utils
from os.path import isfile, isdir, join, getmtime
from django.views.decorators.cache import cache_page

folderbase = '/home/bfrontera/code/seaboard/static/CACHE/'
# folderbase = '/home/vessel/RTDATA/'

def current_location(request):
    """
 
    """

    # Test if /home/vessel/RTDATA/mm-YYYY/posicion.proc/ exists 
    today = datetime.datetime.today()
    yesterday = datetime.date.fromordinal(today.toordinal()-1)

    folderpath = folderbase + '%s/posicion.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/posicion.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.posicion.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        

    datafile = open(join(folderpath,filename),'rb')
    current_location = _utils.tail(datafile,2)[0].split(',')
    # fecha,longitud,latitud,rumbo,velocidad,profundidad,cog,sog,fecha_telegrama
    results = {}
    results['time'] = current_location[0]
    results['long'] = current_location[1]
    results['lat'] = current_location[2]
    results['speed'] = current_location[4]
    results['depth'] = current_location[5]
    results['cog'] = current_location[6]
    results['sog'] = current_location[7]

    datafile.close()

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')

@cache_page(60 * 25, cache="default")
def location(request):
    """

    """

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists 
    today = datetime.datetime.today()    

    folderpath = folderbase + '%s/posicion.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        today = today.replace(day=1)
        yesterday = datetime.date.fromordinal(today.toordinal()-1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/posicion.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.posicion.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        


    # fecha,longitud,latitud,rumbo,velocidad,profundidad,cog,sog,fecha_telegrama
    results = {}
    results['time'] = []
    results['long'] = []
    results['lat'] = []
    results['speed'] = []
    results['depth'] = []
    results['cog'] = []
    results['sog'] = []

    yesterday = datetime.date.fromordinal(today.toordinal()-1)    
    for day in [yesterday,today]:
        folderpath = folderbase + '%s/posicion.proc/' % day.strftime('%m-%Y') 
        filename = '%s.posicion.proc' % day.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            with open(join(folderpath,filename), 'rb') as infile:
                data = csv.DictReader(infile, delimiter=',')                
                last_time = None
                for line in data:     
                    try:
                        this_time = datetime.datetime.strptime(line['fecha'],'%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            results['time'].append(line['fecha'])
                            results['long'].append(line['longitud'])
                            results['lat'].append(line['latitud'])
                            results['speed'].append(line['velocidad'])
                            results['depth'].append(line['profundidad'])
                            results['cog'].append(line['cog'])
                            results['sog'].append(line['sog'])
                            last_time = this_time
                    except:                       
                        pass

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')        

@cache_page(60 * 25, cache="default")
def trajectory(request):
    """
 
    """

    # Test if /home/vessel/RTDATA/mm-YYYY/posicion.proc/ exists 
    today = datetime.datetime.today()
    

    folderpath = folderbase + '%s/posicion.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        yesterday = datetime.date.fromordinal(today.toordinal()-1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/posicion.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.posicion.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        

    coordinates = []
    yesterday = datetime.date.fromordinal(today.toordinal()-1)    
    
    for day in [yesterday,today]:
        filename = '%s.posicion.proc' % day.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            with open(join(folderpath,filename), 'rb') as infile:
                positions = csv.DictReader(infile, delimiter=',')
                # fecha,longitud,latitud,rumbo,velocidad,profundidad,cog,sog,fecha_telegrama
                last_time = None
                for position in positions:            
                    # parse date: 18-02-2013 14:47:16
                    try:
                        this_time = datetime.datetime.strptime(position['fecha'],'%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            coordinates.append([position['longitud'],position['latitud']])
                            last_time = this_time
                    except:
                        pass
                # add last
                coordinates.append([position['longitud'],position['latitud']])

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

            # ,
            # "crs": {
            #     "type": "name",
            #     "properties": {
            #         "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            #     }
            # }        

    results['features'].append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [position['longitud'],position['latitud']]
                },
            "properties": {
                "PLAT_SPEED": "%s m s-1" % position['velocidad'],
                "LON": "%s degree_east"  % position['longitud'],
                "PLAT_COUR_OG": "%s degree"  % position['cog'],
                "PLAT_SPEED_OG": "%s m s-1"  % position['sog'],
                "SEA_FLOOR_DEPTH": "%s m"  % position['profundidad'],
                "LAT": "%s degree_north"  % position['latitud'],
                "time": position['fecha'],
                "PLAT_COUR": "%s degree"  % position['rumbo'],
                "html": "<div class=\"popup_content\"><strong>time</strong>: %s<br/><strong>position</strong>: N%s E%s     <br/><strong>speed</strong>: %s m s-1 <br/><strong>course</strong>: %s degree<br/><strong>depth</strong>: %s m <br/><strong>speed OG</strong>: %s m s-1 <br/><strong>course OG</strong>: %s degree</div>" % (position['fecha'], position['latitud'] , position['longitud'], position['velocidad'], position['rumbo'], position['profundidad'], position['sog'],position['cog'],)
            }
            # ,            
            # "crs": {
            #     "type": "name",
            #     "properties": {
            #     "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            #     }
            # }
        })

    results['bbox'] = [90.0, 180.0, -90.0, -180.0]

    

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')

def current_termosal(request):
    """
 
    """

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists 
    today = datetime.datetime.today()    

    folderpath = folderbase + '%s/termosal.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        yesterday = datetime.date.fromordinal(today.toordinal()-1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/termosal.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.termosal.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        


    #fecha,fecha_instrumento,temperatura,salinidad,sigmat,conductividad,fluor,temperatura_remota
    datafile = open(join(folderpath,filename),'r')
    current_termosal = _utils.tail(datafile,2)[0].split(',')    
    results = {}
    results['time'] = current_termosal[1]
    results['sea_water_temperature'] = current_termosal[2]
    results['sea_water_salinity'] = current_termosal[3]
    results['sea_water_electrical_conductivity'] = current_termosal[5]
    results['fluor'] = current_termosal[6]

    datafile.close()

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')    

@cache_page(60 * 25, cache="default")
def termosal(request):
    """

    """

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists 
    today = datetime.datetime.today()    

    folderpath = folderbase + '%s/termosal.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        yesterday = datetime.date.fromordinal(today.toordinal()-1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/termosal.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.termosal.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        


    #fecha,fecha_instrumento,temperatura,salinidad,sigmat,conductividad,fluor,temperatura_remota

    results = {}
    results['time'] = []
    results['sea_water_temperature'] = []
    results['sea_water_salinity'] = []
    results['sea_water_electrical_conductivity'] = []
    results['fluor'] = []

    yesterday = datetime.date.fromordinal(today.toordinal()-1)    
    for day in [yesterday,today]:
        folderpath = folderbase + '%s/termosal.proc/' % day.strftime('%m-%Y') 
        filename = '%s.termosal.proc' % day.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            with open(join(folderpath,filename), 'rb') as infile:
                data = csv.DictReader(infile, delimiter=',')                
                last_time = None
                for line in data:     
                    try:
                        this_time = datetime.datetime.strptime(line['fecha_instrumento'],'%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            results['time'].append(line['fecha_instrumento'])
                            results['sea_water_temperature'].append(line['temperatura'])
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
    """

    """

    # Test if /home/vessel/RTDATA/mm-YYYY/termosal.proc/ exists 
    today = datetime.datetime.today()    

    folderpath = folderbase + '%s/meteo.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        today = today.replace(day=1)
        yesterday = datetime.date.fromordinal(today.toordinal()-1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/meteo.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.meteo.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        


    # fecha,velocidad_media_viento,velocidad_inst_viento,direccion_viento,temperatura_aire,humedad,radiacion_solar,presion_atm,fecha_instrumento

    results = {}
    results['time'] = []
    results['wind_speed_mean'] = []
    results['wind_speed'] = []
    results['wind_from_direction'] = []
    results['air_temperature'] = []
    results['humidity'] = []
    results['sun_radiation'] = []
    results['air_pressure'] = []

    yesterday = datetime.date.fromordinal(today.toordinal()-1)    
    for day in [yesterday,today]:
        folderpath = folderbase + '%s/meteo.proc/' % day.strftime('%m-%Y') 
        filename = '%s.meteo.proc' % day.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            with open(join(folderpath,filename), 'rb') as infile:
                data = csv.DictReader(infile, delimiter=',')                
                last_time = None
                for line in data:     
                    try:
                        this_time = datetime.datetime.strptime(line['fecha_instrumento'],'%d-%m-%Y %H:%M:%S')
                        if last_time is None or (this_time - last_time).seconds > 600:
                            results['time'].append(line['fecha_instrumento'])
                            results['wind_speed_mean'].append(line['velocidad_media_viento'])
                            results['wind_speed'].append(line['velocidad_inst_viento'])
                            results['wind_from_direction'].append(line['direccion_viento'])
                            results['air_temperature'].append(line['temperatura_aire'])
                            results['humidity'].append(line['humedad'])
                            results['sun_radiation'].append(line['radiacion_solar'])                            
                            results['air_pressure'].append(line['presion_atm'])
                            last_time = this_time
                    except:                       
                        pass

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')        


def current_meteo(request):
    """
 
    """

    # Test if /home/vessel/RTDATA/mm-YYYY/meteo.proc/ exists 
    today = datetime.datetime.today()    

    folderpath = folderbase + '%s/meteo.proc/' % today.strftime('%m-%Y') 
    if not isdir(folderpath):
        found = False
        today = today.replace(day=1)        
        yesterday = datetime.date.fromordinal(today.toordinal()-1)
        if today.month != yesterday.month:
            folderpath = folderbase + '%s/meteo.proc/' % yesterday.strftime('%m-%Y') 
            if isdir(folderpath):                
                today = yesterday # prepare to search the correct file
                found = True

        if not found:
            results = { 'error' : 'Folder %s does not exist' % folderpath}
            json = simplejson.dumps(results)
            return HttpResponse(json, mimetype='application/json')

    current_month = today.month
    file_found = False
    while today.month == current_month and not file_found:
        filename = '%s.meteo.proc' % today.strftime('%d%m%Y') 
        if isfile(join(folderpath,filename)):
            file_found = True
        else:
            today = datetime.date.fromordinal(today.toordinal()-1)

    if not file_found:
        results = { 'error' : 'File %s does not exist' % filename }
        json = simplejson.dumps(results)
        return HttpResponse(json, mimetype='application/json')        


    # fecha,velocidad_media_viento,velocidad_inst_viento,direccion_viento,temperatura_aire,humedad,radiacion_solar,presion_atm,fecha_instrumento
    datafile = open(join(folderpath,filename),'r')
    current_meteo = _utils.tail(datafile,2)[0].split(',')    
    results = {}
    results['time'] = current_meteo[8].replace('\n','')
    results['wind_speed_mean'] = current_meteo[1]
    results['wind_speed'] = current_meteo[2]
    results['wind_from_direction'] = current_meteo[3]
    results['air_temperature'] = current_meteo[4]
    results['humidity'] = current_meteo[5]
    results['sun_radiation'] = current_meteo[6]
    results['air_pressure'] = current_meteo[7]

    datafile.close()

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')    
