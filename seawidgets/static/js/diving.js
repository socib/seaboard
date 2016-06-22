 NCWMSGridTimeseriesViewer = function(options) {
    this.container = options.container || 'map';
    this.layers = options.layers;
    this.baseMaps = options.baseMaps;
    this._defaultMarkers = options.default_markers || [];
    this.mapOptions = options.mapOptions || {};
    if (options.default_range_selector === undefined) {
        this.default_range_selector = 1;
    } else {
        this.default_range_selector = options.default_range_selector;
    }
    this.proxy = options.proxy || null;
    this.colors = options.colors || ["#f28f43", "#c42525", "#77a1e5", "#910000", "#2f7ed8", "#0d233a", "#8bbc21", "#492970", "#a6c96a"];
    this.currentColor = 0;
    this.createMap(options.map);
    this.pendingLayers = 0;
    for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        if (layer.params.colorscalerange && layer.params.colorscalerange == 'auto') {
            this.pendingLayers++;
            this.getLayerMinMax(layer, this.addLayersToMap.bind(this));
        }
    }
    this.addLayersToMap();

};

NCWMSGridTimeseriesViewer.prototype.addLayersToMap = function() {
    if (this.pendingLayers > 0)
        return;
    if (this.map) {
        for (var i = 0, l = this.layers.length; i < l; i++) {
            var layer = this.layers[i];
            var wms_options = {
                format: 'image/png',
                transparent: true,
            };
            for (var attribute in layer.params) {
                wms_options[attribute] = layer.params[attribute];
            }
            if (layer.singleTile) {
                layer.tilelayer = L.nonTiledLayer.wms(layer.url, wms_options);
            } else {
                layer.tilelayer = L.tileLayer.wms(layer.url, wms_options);
            }

            layer.timeLayer = L.timeDimension.layer.wms(layer.tilelayer, {
                proxy: this.proxy,
                updateTimeDimension: (i == 0)
            });

            this.layerControl.addOverlay(layer.timeLayer, layer.name);
            if (layer.legend === undefined){
               // variableLegend.onRemove = this.removeLegend.bind(this, layer);  //antes desactivado
            }
            if (layer.name == 'Wave height'){
                if (layer.legend === undefined || layer.legend ) {   // if (layer.legend === undefined || layer.legend) {   //(layer.legend ) 
                    var variableLegend = L.control({
                        position: 'bottomleft'   //bottomright'

                    });
                    variableLegend.onAdd = this.addLegend.bind(this, layer);
                    //variableLegend.onAdd = this._addLegendOutside.bind(this, layer);
                    variableLegend.onRemove = this.removeLegend.bind(this, layer);  //ver
                   // variableLegend.onRemoveOutside = this._removeLegendOutside.bind(this, layer);
                    layer.timeLayer.legend = variableLegend;            
                } 
             }

            if (layer.visible) {
                layer.timeLayer.addTo(this.map);
            } 
        }
    }
};

NCWMSGridTimeseriesViewer.prototype.addDefaultMarkers = function() {
    for (var i = 0, l = this._defaultMarkers.length; i < l; i++) {
        this.addPositionMarker(this._defaultMarkers[i]);
    }

};

NCWMSGridTimeseriesViewer.prototype.addPositionMarker = function(point) {
    var color = this.getNextColor();
    var circle = L.circleMarker([point.position[0], point.position[1]], {
        color: '#FFFFFF',
        fillColor: color,
        fillOpacity: 0.8,
        radius: 5,
        weight: 2
    }).addTo(this.map);
    var afterLoadData = function(layer, color, count, data) {
        var serie = this.showData(layer, color, data, point.name);
        if (count == 0) {
            L.timeDimension.layer.circleLabelMarker(circle, {
                serieId: serie,
                dataLayer: layer,
                proxy: this.proxy
            }).addTo(this.map);
        }
        layer.chart.hideLoading();
        // icon.html(data.values[1]); // TODO.
    };

    for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        if (layer.timeseries !== undefined && !layer.timeseries) {
            continue;
        }
        if (layer.timeseriesWhenNotVisible || (layer.timeLayer && this.map.hasLayer(layer.timeLayer))) {
            if (layer.chart)
                layer.chart.showLoading();
            this.loadData(layer, circle._point, afterLoadData.bind(this, layer, color, i));
        }
    }
};


NCWMSGridTimeseriesViewer.prototype.getLayerMinMax = function(layer, callback) {
    var url = layer.url + '?service=WMS&version=1.1.1&request=GetMetadata&item=minmax';
    url = url + '&layers=' + layer.params.layers;
    url = url + '&srs=EPSG:4326';
    var size = this.map.getSize();
    url = url + '&BBox=' + this.map.getBounds().toBBoxString();
    url = url + '&height=' + size.y;
    url = url + '&width=' + size.x;

    if (this.proxy) url = this.proxy + '?url=' + encodeURIComponent(url);
    $.getJSON(url, (function(layer, data) {
        var range = data.max - data.min;

        var min = Math.floor(data.min);
        var max = Math.floor(data.max + 2);
        layer.params.colorscalerange = min + "," + max;
        this.pendingLayers--;
        if (callback !== undefined) {
            callback();
        }
    }).bind(this, layer));
};

NCWMSGridTimeseriesViewer.prototype.getNextColor = function() {
    return this.colors[this.currentColor++ % this.colors.length];
};

NCWMSGridTimeseriesViewer.prototype.getMap = function() {
    return this.map;
};

NCWMSGridTimeseriesViewer.prototype.showData = function(layer, color, data, positionName) {
    var position = data.latitude + ', ' + data.longitude;
    if (positionName !== undefined) {
        position = positionName;
    }
    return this.addSerie(layer, data.time, data.values, position, data.url, color);
};

NCWMSGridTimeseriesViewer.prototype.loadData = function(layer, point, callback) {
    if (layer.date_range === undefined || layer.date_range === null) {
        this.loadDateRange(layer, (function(layer) {
            this.loadData_(layer, point, callback);
        }).bind(this, layer));
    } else {
        this.loadData_(layer, point, callback);
    }
};

NCWMSGridTimeseriesViewer.prototype.loadData_ = function(layer, point, callback) {
    var min = new Date(layer.timeLayer._getNearestTime(layer.date_range.min.getTime()));
    var max = new Date(layer.timeLayer._getNearestTime(layer.date_range.max.getTime()));

    var url = layer.url + '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG:4326';
    url = url + '&LAYER=' + layer.params.layers;
    url = url + '&QUERY_LAYERS=' + layer.params.layers;
    url = url + '&X=' + point.x + '&Y=' + point.y + '&I=' + point.x + '&J=' + point.y;
    var size = this.map.getSize();
    url = url + '&BBox=' + this.map.getBounds().toBBoxString();
    url = url + '&WIDTH=' + size.x + '&HEIGHT=' + size.y;
    url = url + '&INFO_FORMAT=text/xml';
    var url_without_time = url;
    url = url + '&TIME=' + min.toISOString() + '/' + max.toISOString();

    if (this.proxy) url = this.proxy + '?url=' + encodeURIComponent(url);

    $.get(url, (function(layer, data) {
        var result = {
            time: [],
            values: []
        };

        // Add min and max values to be able to get more data later
        if (layer.date_range.min > layer.minmaxdate_range.min) {
            result.time.push(layer.minmaxdate_range.min);
            result.values.push(null);
        }

        $(data).find('FeatureInfo').each(function() {
            var this_time = $(this).find('time').text();
            var this_data = $(this).find('value').text();
            try {
                this_data = parseFloat(this_data);
            } catch (e) {
                this_data = null;
            }
            result.time.push(this_time);
            result.values.push(this_data);
        });

        if (layer.date_range.max < layer.minmaxdate_range.max) {
            result.time.push(layer.minmaxdate_range.max);
            result.values.push(null);
        }

        result.longitude = $(data).find('longitude').text();
        try {
            result.longitude = parseFloat(result.longitude).toFixed(4);
        } catch (e) {}
        result.latitude = $(data).find('latitude').text();
        try {
            result.latitude = parseFloat(result.latitude).toFixed(4);
        } catch (e) {}
        result.url = url_without_time;

        if (callback !== undefined) {
            callback(result);
        }
    }).bind(this, layer));
};




NCWMSGridTimeseriesViewer.prototype._loadMoreData = function(layer, url, mindate, maxdate, callback) {
    var min = new Date(layer.timeLayer._getNearestTime(mindate.getTime()));
    var max = new Date(layer.timeLayer._getNearestTime(maxdate.getTime()));

    url = url + '&TIME=' + min.toISOString() + '/' + max.toISOString();

    if (this.proxy) url = this.proxy + '?url=' + encodeURIComponent(url);

    $.get(url, (function(data) {
        var result = {
            time: [],
            values: []
        };

        $(data).find('FeatureInfo').each(function() {
            var this_time = $(this).find('time').text();
            var this_data = $(this).find('value').text();
            try {
                this_data = parseFloat(this_data);
            } catch (e) {
                this_data = null;
            }
            result.time.push(this_time);
            result.values.push(this_data);
        });

        if (callback !== undefined) {
            callback(result);
        }
    }).bind(this)).fail(function() {
        if (callback !== undefined) {
            callback();
        }
    });
};

NCWMSGridTimeseriesViewer.prototype.loadDateRange = function(layer, callback) {
    var url = layer.url + '?service=WMS&version=1.1.1&request=GetMetadata&item=layerDetails';
    url = url + '&layerName=' + layer.params.layers;
    if (this.proxy) url = this.proxy + '?url=' + encodeURIComponent(url);
    $.getJSON(url, (function(layer, data) {
        layer.datesWithData = data.datesWithData;
        layer.minmaxdate_range = this.calculateMinMaxDate_(layer);
        var max = layer.minmaxdate_range.max;
        // check if max is a valid date
        if (!max.getTime || isNaN(max.getTime())) {
            return;
        }
        var min = new Date(Date.UTC(max.getUTCFullYear(), max.getUTCMonth(), max.getUTCDate()));

        if (this.default_range_selector === 0) {
            min.setUTCDate(min.getUTCDate() - 3);
        } else if (this.default_range_selector === 1) {
            min.setUTCDate(min.getUTCDate() - 7);
        } else if (this.default_range_selector === 2) {
            min.setUTCMonth(min.getUTCMonth() - 1);
        } else if (this.default_range_selector === 3) {
            min.setUTCMonth(min.getUTCMonth() - 3);
        } else if (this.default_range_selector === 4) {
            min.setUTCMonth(min.getUTCMonth() - 6);
        } else {
            min.setUTCFullYear(min.getUTCFullYear() - 1);
        }

        if (min < layer.minmaxdate_range.min) {
            min = layer.minmaxdate_range.min;
        }
        min = this._convertToDateWithData(layer, min);
        layer.date_range = {
            min: min,
            max: max
        };
        layer.currentdate = data.nearestTimeIso;
        // If map, also set extend to its bbox
        if (this.map && layer.autoExtent) {
            var southWest = L.latLng(data.bbox[1], data.bbox[0]);
            var northEast = L.latLng(data.bbox[3], data.bbox[2]);
            var bounds = L.latLngBounds(southWest, northEast);
            this.map.fitBounds(bounds);
        }
        // also save this variable units
        layer.units = data.units;
        if (callback !== undefined) {
            callback();
        }
    }).bind(this, layer));
};


NCWMSGridTimeseriesViewer.prototype.calculateMinMaxDate_ = function(layer) {
    if (this.map.timeDimension) {
        var times = this.map.timeDimension.getAvailableTimes();
        return {
            min: new Date(times[0]),
            max: new Date(times[times.length - 1])
        }
    }
    return this._calculateMinMaxDateFromDatsWithData(layer);
};

NCWMSGridTimeseriesViewer.prototype._calculateMinMaxDateFromDatsWithData = function(layer) {

    var minyear = null;
    var maxyear = null;
    var minmonth = null;
    var maxmonth = null;
    var minday = null;
    var maxday = null;

    for (var year in layer.datesWithData) {
        year = parseInt(year);
        if (minyear === null || year < minyear) minyear = year;
        if (maxyear === null || year > maxyear) maxyear = year;
    }

    for (var month in layer.datesWithData[minyear]) {
        month = parseInt(month);
        if (minmonth === null || month < minmonth) minmonth = month;
    }

    for (month in layer.datesWithData[maxyear]) {
        month = parseInt(month);
        if (maxmonth === null || month > maxmonth) maxmonth = month;
    }

    for (var day in layer.datesWithData[minyear][minmonth]) {
        day = parseInt(day);
        if (minday === null || layer.datesWithData[minyear][minmonth][day] < minday)
            minday = layer.datesWithData[minyear][minmonth][day];
    }

    for (var day in layer.datesWithData[maxyear][maxmonth]) {
        day = parseInt(day);
        if (maxday === null || layer.datesWithData[maxyear][maxmonth][day] > maxday)
            maxday = layer.datesWithData[maxyear][maxmonth][day];
    }

    var min = new Date(Date.UTC(minyear, minmonth, minday));
    min.setUTCDate(min.getUTCDate() + 1);
    return {
        min: min,
        max: new Date(Date.UTC(maxyear, maxmonth, maxday))
    };
};

NCWMSGridTimeseriesViewer.prototype._convertToDateWithData = function(layer, date) {
    if (this.map.timeDimension) {
        return new Date(this.map.timeDimension.seekNearestTime(date.getTime()));
    }
    return date;
};

NCWMSGridTimeseriesViewer.prototype.checkLoadNewData = function(layer, min, max) {
    min = new Date(min);
    max = new Date(max);

    var afterLoadData = function(layer, serie, data) {
        if (data !== undefined)
            this.updateSerie(serie, data.time, data.values);
        layer.chart.hideLoading();
    };
    var i, l, serie;

    min = this._convertToDateWithData(layer, min);
    max = this._convertToDateWithData(layer, max);

    if (min < layer.date_range.min) {
        var old_min = layer.date_range.min;
        layer.date_range.min = min;
        layer.chart.showLoading();
        for (i = 0, l = layer.chart.series.length; i < l; i++) {
            serie = layer.chart.series[i];
            if (serie.name != "Navigator")
                this._loadMoreData(layer, serie.options.custom.url, min, old_min, afterLoadData.bind(this, layer, serie));
        }
    }
    if (max > layer.date_range.max) {
        var old_max = layer.date_range.max;
        layer.date_range.max = max;
        layer.chart.showLoading();
        for (i = 0, l = layer.chart.series.length; i < l; i++) {
            serie = layer.chart.series[i];
            if (serie.name != "Navigator")
                this._loadMoreData(layer, serie.options.custom.url, old_max, max, afterLoadData.bind(this, layer, serie));
        }
    }
};


NCWMSGridTimeseriesViewer.prototype.createMap = function(map) {
    var baseMaps = {};
    if (map) {
        this.map = map;
    } else {
        var mapOptions = {
            fullscreenControl: true,
            timeDimension: true,
          //  timeDimensionControl: true,      ///
            center:  [39.46, 2.50], //39.4, 2.9    [39.46305556, 2.470833333]
            zoom: 12
        };
        this.map = L.map(this.container, $.extend({}, mapOptions, this.mapOptions));

        L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
            _getDisplayDateFormat: function(date){
                return date.format("yyyy-mm-dd HH:MM 'UTC'", true);
            }    
        });
        var timeDimensionControl = new L.Control.TimeDimensionCustom(this.mapOptions.timeDimensionControlOptions);
        this.map.addControl(timeDimensionControl);


        if (this.baseMaps == undefined) {

            // Add OSM and emodnet bathymetry to map
                     
            var bathymetryLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
                layers: 'emodnet:contours',  //emodnet:contours Depth contours  emodnet:mean_atlas_land
                format: 'image/png',
                transparent: true,
                attribution: "<a href='http://www.emodnet-bathymetry.eu/'>EMODnet Bathymetry</a>",
                opacity: 0.8
            });
            var namesLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
                layers: 'world:sea_names',
                format: 'image/png',
                transparent: true,
                opacity: 0.3
            });
            var underseaLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
                layers: 'gebco:undersea_features',
                format: 'image/png',
                transparent: true,
                opacity: 0.3
            });            
            var coastlinesLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
                layers: 'coastlines',
                format: 'image/png',
                transparent: true,
                opacity: 0.8
            });
            var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });  
            
            var wmsideib = L.tileLayer.wms("http://ideib.caib.es/pub_ideib/public/Relleu/MapServer/WMSServer",{
                layers: '5',   //56,55,54,52,51,50,48,47,46,45,43,42,41,39,38,37,36
                format: 'image/png',
                transparent: true,
                opacity: 0.8  
            });

            var icon_buoy = L.icon({
                iconUrl: '../static/mooring/images/buoy.png'  
               //conSize: [38, 95], // size of the icon
                });
           
            var station = L.marker([39.54419, 2.378461], {icon: icon_buoy}); 
            station.addTo(this.map);
           
            var baseGroupLayer = L.layerGroup([bathymetryLayer,osmLayer]);     //bathymetryLayer, wmsideib  osmLayer
            baseGroupLayer.addTo(this.map);
            this.baseMaps = {
              
                "Emodnet bathymetry": bathymetryLayer, 
               
                "OSM": osmLayer
                
            };
        } else {
            
            for (var baselayer in this.baseMaps) {
                this.baseMaps[baselayer].addTo(this.map);
                break;
            }
        }
        L.control.coordinates({
            position: "bottomright",
            decimals: 3,
            labelTemplateLat: "Latitude: {y}",
            labelTemplateLng: "Longitude: {x}",
            useDMS: true,
            enableUserInput: false
        }).addTo(this.map);
    }
    var overlayMaps = {"Emodnet bathymetry":bathymetryLayer};
    //var overlayMaps = {};
    this.layerControl = L.control.layers(this.baseMaps,overlayMaps);

    this.layerControl.addTo(this.map);

    var sidebar = L.control.sidebar('sidebar');

    this.map.addControl(sidebar);
 
  

    this.map.on('layeradd', function(eventLayer) {
        if (eventLayer.layer.legend) { 
            eventLayer.layer.legend.addTo(this);
           //this.removeLayer(eventLayer.layer.legend);
           //eventLayer.layer.legend.onRemove();
        }
    });

   /* this.map.on('overlayremove', function (eventLayer) {
        if (eventLayer.name != "Wave height") {
            this.removelayer(eventLayer.layer.legend);
            eventLayer.layer.legend.onRemove();
        }
    });*/

   this.map.on('layerremove', function(eventLayer) {
        if (eventLayer.layer.legend) {
            this.removeLayer(eventLayer.layer.legend);
            eventLayer.layer.legend.onRemove();
           // eventLayer.layer.legend.onRemoveOutside();
        }
    });

    this.map.doubleClickZoom.disable();
    this.map.on('layeradd', (function() {
        this.map.doubleClickZoom.disable();
    }).bind(this));
    this.map.on('dblclick', (function(e) {
        this.addPositionMarker({
            position: [e.latlng.lat, e.latlng.lng]
        });
        return false;
    }).bind(this));

    if (!this.map.timeDimension) {
        this.map.timeDimension = L.timeDimension({});
    }
    this.map.timeDimension.on('availabletimeschanged', (function() {
        this.addDefaultMarkers();
    }).bind(this));


};


NCWMSGridTimeseriesViewer.prototype.addLegend = function(layer, map) {
    //if (layer.legendOutside){
        this._addLegendOutside(layer);   //ver el error de ClassList Pendiente
      //  return;
    //}
    var div_wrapper = L.DomUtil.get('legend-wrapper');
    if (!div_wrapper) {
        div_wrapper = L.DomUtil.create('div', 'legend-wrapper-outside');
        /* div_wrapper.id = "legend-wrapper";*/
    }
    var div = L.DomUtil.create('div', 'info legend-div', div_wrapper);  
    div.id = "legend-" + layer.params.layers;
    div.innerHTML = this._getLegendInnerHTML(layer);
    return div_wrapper;
};

NCWMSGridTimeseriesViewer.prototype._addLegendOutside = function(layer) {
    var div_wrapper = $('#legend-wrapper-outside');
    div_wrapper.append(this._getLegendInnerHTML(layer));
    return;
};

NCWMSGridTimeseriesViewer.prototype._getLegendInnerHTML = function(layer) {
   
    if (layer.legendHTML != undefined) { //innerHTML   layer.legendHTML
        var innerHTML;

        innerHTML = layer.legendHTML.apply();
       //console.log(innerHTML);
    } else {
        var innerHTML;

        var styles = layer.params.styles;
        var palette = styles.substring(styles.indexOf('/') + 1);
        var colorscalerange = layer.params.colorscalerange || 'default';  
        
       // console.log(layer.url);

   
        var src = layer.url + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&TRANSPARENT=true&LAYER=" + layer.params.layers + "&PALETTE=" + palette + "&COLORSCALERANGE=" + colorscalerange;
       //console.log(palette);
        
        if (colorscalerange == 'auto') {
        // TODO: get colorscalerange
        div_wrapper = $('#legend-wrapper-outside');
       // return;
        return div_wrapper;
        }

        if (layer.params.numcolorbands) {
            src += '&numcolorbands=' + layer.params.numcolorbands;
        }
        innerHTML =            
            '<img class="legend-img" src="' + src + '" alt="legend" style="height: 220px;">';

    }
    return innerHTML;
};

NCWMSGridTimeseriesViewer.prototype.removeLegend = function(layer, map) {
   this._removeLegendOutside(layer);
    var div = L.DomUtil.get("legend-" + layer.params.layers);
    div.remove();
    
    return;
};



/*NCWMSGridTimeseriesViewer.prototype._removeLegendOutside = function(layer,map) {

   // var div_wrapper = $('#legend-wrapper-outside');
    div_wrapper.remove(this._getLegendInnerHTML(layer));
    return;
};*/

NCWMSGridTimeseriesViewer.prototype._removeLegendOutside = function(layer) {
    var div_wrapper = $('#legend-wrapper-outside');
    div_wrapper.remove();  
    return;
};



NCWMSGridTimeseriesViewer.prototype.createChart = function(layer) {
    var chart_wrapper = $('#' + this.container).parent().find('.chart-wrapper');
    if (!chart_wrapper.length) {
        $('#' + this.container).parent().append("<div class='chart-wrapper'></div>");
        chart_wrapper = $('#' + this.container).parent().find('.chart-wrapper');
    }
    var chart_container = chart_wrapper.find('.chart-' + layer.params.layers);
    if (!chart_container.length) {  // antes C
        chart_wrapper.append("<div class='chart chart-" + layer.params.layers + "' style='height:275px;'></div>");  /* 200px */
        chart_container = chart_wrapper.find('.chart-' + layer.params.layers);
    }   //antes C

    var options = {
        legend: {
            enabled: true,
        },

        chart: {
            zoomType: 'x'
        },
        navigator : {
                enabled : false
        },
        rangeSelector: {
            enabled: false,
            selected: this.default_range_selector,
            buttons: [{
                type: 'day',
                count: 3,
                text: '3d'
            }, {
                type: 'day',
                count: 7,
                text: '7d'
            }, {
                type: 'month',
                count: 1,
                text: '1m'
            }, {
                type: 'month',
                count: 3,
                text: '3m'
            }, {
                type: 'month',
                count: 6,
                text: '6m'
            }, {
                type: 'year',
                count: 1,
                text: '1y'
            }, {
                type: 'all',
                text: 'All'
            }]
        },
        xAxis: {
            events: {
                afterSetExtremes: (function(layer, e) {
                    if (e.trigger != "updatedData")
                        this.checkLoadNewData(layer, e.min, e.max);
                }).bind(this, layer)
            },
            plotLines: [{
                color: 'red',
                dashStyle: 'solid',
                value: new Date(this.map.timeDimension.getCurrentTime()),
                width: 2,
                id: 'pbCurrentTime'
            }]
        },
        title: {
            text: layer.name
        },
        series: [],
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: (function(event) {
                            var day = new Date(event.point.x);
                            this.map.timeDimension.setCurrentTime(day.getTime());
                        }).bind(this)
                    }
                }
            }
        }
    };

    if (layer.params.layers.substring(0, 3) == 'QC_') {
        options['yAxis'] = {};
        options['yAxis']['tickPositions'] = [0, 1, 2, 3, 4, 6, 9];
        options['yAxis']['plotBands'] = [{
            from: 0,
            to: 0.5,
            color: '#FFFFFF',
            label: {
                text: 'No QC performed',
                style: {
                    color: '#606060'
                }
            }
        }, {
            from: 0.5,
            to: 1.5,
            color: 'rgba(0, 255, 0, 0.5)',
            label: {
                text: 'Good data',
                style: {
                    color: '#606060'
                }
            }
        }, {
            from: 1.5,
            to: 2.5,
            color: 'rgba(0, 255, 0, 0.2)',
            label: {
                text: 'Probably good data',
                style: {
                    color: '#606060'
                }
            }
        }, {
            from: 2.5,
            to: 3.5,
            color: 'rgba(255, 0, 0, 0.2)',
            label: {
                text: 'Probably bad data',
                style: {
                    color: '#606060'
                }
            }
        }, {
            from: 3.5,
            to: 4.5,
            color: 'rgba(255, 0, 0, 0.5)',
            label: {
                text: 'Bad data',
                style: {
                    color: '#606060'
                }
            }
        }, {
            from: 5.5,
            to: 6.5,
            color: 'rgba(177, 11, 255, 0.5)',
            label: {
                text: 'Spike',
                style: {
                    color: '#606060'
                }
            }
        }, { // High wind
            from: 8.5,
            to: 9.5,
            color: 'rgba(200, 200, 200, 0.2)',
            label: {
                text: 'Missing value',
                style: {
                    color: '#606060'
                }
            }
        }];
    }

    if (layer.units == 'degree') {
        options['yAxis'] = {};
        options['yAxis']['tickPositions'] = [0, 90, 180, 270, 360, 361];
        options['yAxis']['labels'] = {
            formatter: function() {
                if (this.value == 0)
                    return 'N';
                if (this.value == 90)
                    return 'E';
                if (this.value == 180)
                    return 'S';
                if (this.value == 270)
                    return 'W';
                if (this.value == 360)
                    return 'N';
                return this.value;
            }
        };
        // options['chart']['type'] = 'heatmap';
    }

    chart_container.highcharts('StockChart', options);
    var chart = chart_container.highcharts()
    this.map.timeDimension.on('timeload', (function(data) {
        chart.xAxis[0].removePlotBand("pbCurrentTime");
        chart.xAxis[0].addPlotLine({
            color: 'red',
            dashStyle: 'solid',
            value: new Date(this.map.timeDimension.getCurrentTime()),
            width: 2,
            id: 'pbCurrentTime'
        });
    }).bind(this));
    return chart;
};

NCWMSGridTimeseriesViewer.prototype.addSerie = function(layer, time, variableData, position, url, color) {
    var serie = this.createSerie(layer, time, variableData, position, url, color);
    if (!layer.chart)
        layer.chart = this.createChart(layer);
    layer.chart.addSeries(serie);
    return serie.id;
};

NCWMSGridTimeseriesViewer.prototype.createSerie = function(layer, time, variableData, position, url, color) {
    return {
        name: layer.name + ' at ' + position,
        type: 'line',
        id: Math.random().toString(36).substring(7),
        color: color,
        data: (function() {
            var length = time.length;
            var data = new Array(length);
            var this_time = new Date();
            var this_data = null;
            for (var i = 0; i < length; i++) {
                this_time = (new Date(time[i])).getTime();
                this_data = variableData[i];
                if (isNaN(this_data))
                    this_data = null;
                data[i] = [this_time, this_data];
            }
            return data;
        })(),
        tooltip: {
            valueDecimals: 2,
            valueSuffix: ' ' + layer.units,
            xDateFormat: '%A, %b %e, %H:%M',
            headerFormat: '<span style="font-size: 12px; font-weight:bold;">{point.key} (Click to visualize the map on this time)</span><br/>'
        },
        custom: {
            variable: layer.name,
            position: position,
            url: url
        }
    };
};

NCWMSGridTimeseriesViewer.prototype.updateSerie = function(serie, time, variableData) {
    var length = time.length;
    var new_data = new Array(length);
    var this_time = new Date();
    var this_data = null;
    for (var i = 0; i < length; i++) {
        this_time = (new Date(time[i])).getTime();
        this_data = variableData[i];
        if (isNaN(this_data))
            this_data = null;
        new_data[i] = [this_time, this_data];
    }
    var old_data = serie.options.data;
    serie.options.data = old_data.concat(new_data).sort();
    serie.setData(serie.options.data);
};


NCWMSGridTimeseriesViewer.prototype.removeLayer = function(layerName) {
    for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        if (layer.name != layerName){
            continue;
        }
        if (layer.timeLayer){
            this.map.removeLayer(layer.timeLayer);
        }
        break;
    }
    return;
};


var ELTORO_POSITION = [39.6145, 1.99363];   
var diving = function( layers, container) {
//var Sorrento = function(wms_server, layers, container) {
   // this.wms_server = wms_server;
    var currentTime = new Date();
    currentTime.setUTCMinutes(0, 0, 0);
    var endDate = new Date(currentTime.getTime());
    L.TimeDimension.Util.addTimeDuration(endDate, "P3D", true);

    this.options = {
        container: container,
        layers: layers,
        mapOptions: {
            center:  [39.47, 2.45],  
            zoom: 13,  //9
            scrollWheelZoom: false,
            timeDimensionOptions: {
                timeInterval: "P5D/" + endDate.toISOString(),
                period: "PT1H",
                currentTime: currentTime.getTime()
            },
            timeDimensionControlOptions: {
                autoPlay: false,
                speedSlider: false,
                timeSlider: false,
                displayDate: true,
                playerOptions: {
                    buffer: 0,
                    transitionTime: 500,
                    loop: true,
                }
            },
        },
        proxy: '/services/wms-proxy',
       default_range_selector: 0,
        default_markers: [{
            name: 'El Toro',
            position: [39.46, 2.47]  //ELTORO_POSITION
        }]
    };
    //this.gridViewer = new MapGT(this.options); 
     this.gridViewer = new NCWMSGridTimeseriesViewer(this.options); 
    var map = this.gridViewer.getMap();
};


 


function wmop() {
    var wms_sapo = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/wave/model_run_aggregation/sapo_ib/sapo_ib_best.ncd';
    var wms_wmop = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/hydrodynamics/model_run_aggregation/wmop/wmop_best.ncd';
    var wms_sensibilidad = 'http://gis.socib.es/geoserver/ows';
  
   

    var sapo_wmop_layers2 = [
    {
        name: "Average wave direction",
        url: wms_sapo,
        params: {
            layers: 'average_wave_direction',
            format: 'image/png',
            transparent: true,
            colorscalerange: '1,1',
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            markerscale: 15,
            markerspacing: 12,
            markerclipping: true,
            styles: 'prettyvec/greyscale'
        },
        visible: true,
     //   legendOutside: true,
        singleTile: true,
        autoExtent: false,
        timeseries: false,
        legendHTML: function() {
          var innerHTML = '<img src="/static/images/black-arrow.png" /> mean direction';
          return innerHTML;
        }
    },
        {
        name: "Wave height",
        url: wms_sapo,
        params: {
            layers: "significant_wave_height",
            styles: 'areafill/scb_bugnylorrd',
            colorscalerange: '0,2',
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
        },
        visible: true,
        legendOutside: true,
        singleTile: false,
        autoExtent: false,
        timeseriesWhenNotVisible: true
    },{
        name: "Sea Surface Temperature",
        url: wms_wmop,
        params: {
            layers: "temp",
            colorscalerange: "auto",
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
            styles: 'areafill/mpl_gnbu' // areafill/mpl_gnbu  boxfill/spectral
        }, 
        visible: false,
      //  legendOutside: true,
        singleTile: true,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        }
    },{
        name: "Sensibilidad ambiental de la costa",  //Sensibilidad ambiental de la costa-2012
        url: wms_sensibilidad,
        params: {
            layers: 'sa:bal_sa_costa_2012',  //sa:
            format: 'image/png',
            transparent: true,
            styles: 'sa_illes_balears_2011'
        },
         visible: true ,
        // legendOutside: true,
        legendHTML: function() {
         // var innerHTML = '<img src= "http://gis.socib.es/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=bal_sa_costa_2012" />';                      
          var innerHTML = "<iframe src='"+ "http://gis.socib.es/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=bal_sa_costa_2012" +"' width='260' height='80' frameborder='0' class='resizable' ></iframe>" 
          return innerHTML;
         }
    },{
        name: "Uso humano de la costa", 
        url: wms_sensibilidad,
        params: {
            layers: "sa:bal_uso_humano",  
            format: 'image/png',
            styles: 'uso_humano_new'
        },
        visible: true,
      // legendOutside: true,
        singleTile: false,
        autoExtent: false,
        legendHTML: function() {                                                                                                                 
           var innerHTML = "<iframe src='"+"http://gis.socib.es/geoserver/ows?TRANSPARENT=true&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&LAYER=sa%3Abal_uso_humano&SCALE=2183916.2728723255&FORMAT=image%2Fgif"+ "' width='260' height='80' frameborder='0' class='resizable' ></iframe>";  //Zones de fondeig
          // var innerHTML = '<div class="resizable" style="width:200px; height:200px;"'>'+'<'iframe src="http://gis.socib.es/geoserver/ows?TRANSPARENT=true&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&LAYER=sa%3Abal_uso_humano&SCALE=2183916.2728723255&FORMAT=image%2Fgif"+ frameborder="0"></iframe>'+'</div>';  //Zones de fondeig
            return innerHTML;
        }
    },{
        name: "Zonas de Fondeo", 
        url: wms_sensibilidad,
        params: {
            layers: "bal_zones_fondeig",  
            format: 'image/png',
            styles: 'sailing'
        },
        visible: true,
      //  legendOutside: true,
        legendHTML: function() {
           var innerHTML = '<img src="/static/images/zones_fondeig.png" /> Anchoring areas';  //Zones de fondeig
            return innerHTML;
        }
    }];
   
      var sapoMap2 = new diving(sapo_wmop_layers2 , 'map-wmop'); 
 
}


var load_moorings = function(){  // + Moorings.units, function(jsonData)

    $.getJSON( 'http://localhost:8000/services/dd/list-moorings?', function(data) {

    var id_platform = 26;   
    platform = {} ;
    var items = [];
    list_moorings = data;

    for (var i = 0, l = list_moorings.length; i < l; i++) {
        if (list_moorings[i].id == id_platform) {
        platform.index = i;
        platform.id = list_moorings[i].id;
        platform.lat = (parseFloat(list_moorings[i].boundingBox[1]) + parseFloat(list_moorings[i].boundingBox[0])) / 2;
        platform.lon = (parseFloat(list_moorings[i].boundingBox[3]) + parseFloat(list_moorings[i].boundingBox[2])) / 2;
        platform.name = list_moorings[i].name
            .replace("Station", "")
            .replace("Buoy", "")
            .replace("Mobims", "")
            .trim();

        platform.platformType = list_moorings[i].platformType;
        platform.state = list_moorings[i].state;
        platform.icon = list_moorings[i].icon;
        platform.lastTimeSampleReceived = list_moorings[i].lastTimeSampleReceived;

        if (platform.variables)
            delete platform.variables;

        platform.variables = {};
        var value;
        for (var j = 0, lj = list_moorings[i].jsonInstrumentList.length; j < lj; j++) {
            var variables = list_moorings[i].jsonInstrumentList[j].jsonVariableList;
            for (var k = 0, lk = variables.length; k < lk; k++) {
                // Remove gust direction
                if (variables[k].displayName.indexOf(' gust ') > 0) {
                    continue;
                }

                if (!platform.variables[variables[k].standardName])
                    platform.variables[variables[k].standardName] = [];

                value = variables[k].lastSampleValue;
                value = value.replace(/(.*) ([\w])(-1)/, "$1/$2");
                value = value.replace(/(.*) C$/, "$1 °C");
                platform.variables[variables[k].standardName].push({
                    'value': value,
                    'name': variables[k].displayName,
                    'id': variables[k].id,
                    'instrument': {
                        'id': list_moorings[i].jsonInstrumentList[j].id,
                        'name': list_moorings[i].jsonInstrumentList[j].displayName
                    }
                });
                if (variables[k].id == '11075' ){
                   items.push(variables[k].displayName +':'+' '+ variables[k].lastValue +' '+'°'+variables[k].inputUnits);
                  //items.push("<li id='" + list.jsonInstrumentList[j].jsonVariableList[j].id + "'>" + variables1[k].displayName + ' '+':'+ ' '+ variables1[k].lastValue + ' '+variables1[k].inputUnits +"</li>");
                }
               // el.innerHTML= '<li>'+'<i '+ variables1[k].id +'"></i>'+'</li>';  
                document.getElementById("id_station").innerHTML = items;
            }
        }

      }
    }
  })
}




$(function() {
    wmop();
    load_moorings();

});


var leyenda1 = "<iframe src='"+ "http://gis.socib.es/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=bal_sa_costa_2012" +"' width='750' height='400' frameborder='0' ></iframe>" ;
 
 // var leyenda1 = '<img src= "http://gis.socib.es/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=bal_sa_costa_2012" width="800" height="auto" />';  //width="700" height="auto"
document.getElementById('id_legend1').innerHTML = leyenda1; 



