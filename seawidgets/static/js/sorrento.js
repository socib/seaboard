var SORRENTO_POSITION = [39.6145, 1.99363];
var Sorrento = function(wms_server, layers, container) {
    this.wms_server = wms_server;
    var currentTime = new Date();
    currentTime.setUTCMinutes(0, 0, 0);
    var endDate = new Date(currentTime.getTime());
    L.TimeDimension.Util.addTimeDuration(endDate, "P3D", true);

    this.options = {
        container: container,
        layers: layers,
        mapOptions: {
            center: SORRENTO_POSITION,
            zoom: 9,
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
            }
        },
        proxy: '/services/wms-proxy',
        default_range_selector: 0,
        default_markers: [{
            name: 'Sorrento',
            position: SORRENTO_POSITION
        }]
    };
    this.gridViewer = new NCWMSGridTimeseriesViewer(this.options);
    var map = this.gridViewer.getMap();
};



function currents() {
    var wms_server = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/hydrodynamics/model_run_aggregation/wmop/wmop_best.ncd';
    var wmop_layers = [{
        name: "Sea Surface Currents",
        url: wms_server,
        params: {
            layers: "sea_surface_velocity",
            colorscalerange: "0,1",
            markerscale: 15,
            markerspacing: 12,
            markerclipping: true,
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            styles: 'prettyvec/rainbow',
            zIndex: 90
        },
        visible: true,
        singleTile: true,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        }
    }];
    var currentMap = new Sorrento(wms_server, wmop_layers, 'map-currents');
}

function sapo() {
    var wms_server = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/wave/model_run_aggregation/sapo_ib/sapo_ib_best.ncd';
    var sapo_layers = [{
        name: "Significant wave height",
        url: wms_server,
        params: {
            layers: "significant_wave_height",
            styles: 'shadefill/scb_bugnylorrd',
            colorscalerange: '0,2',
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
        },
        visible: true,
        singleTile: false,
        autoExtent: false,
        timeseriesWhenNotVisible: true,
    }, {
        name: "Average wave direction",
        url: wms_server,
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
        singleTile: true,
        autoExtent: false,
        timeseries: false,
        legendHTML: function() {
            var innerHTML = '<img src="/static/images/black-arrow.png" /> mean direction';
            return innerHTML;
        }
    }, {
        name: "Direction of the peak direction",
        url: wms_server,
        params: {
            layers: 'direction_of_the_peak_of_the_spectrum',
            format: 'image/png',
            transparent: true,
            colorscalerange: '0,2',
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            markerscale: 15,
            markerspacing: 12,
            markerclipping: true,
            styles: 'prettyvec/greyscale'
        },
        visible: true,
        singleTile: true,
        autoExtent: false,
        timeseries: false,
        legendHTML: function() {
            var innerHTML = '<img src="/static/images/grey-arrow.png" /> peak direction';
            return innerHTML;
        }
    }];

    var sapoMap = new Sorrento(wms_server, sapo_layers, 'map-sapo');
}

function wind() {
    var wms_server = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/wave/model_run_aggregation/sapo_ib/sapo_ib_best.ncd';
    var sapo_layers = [{
        name: "Wind",
        url: wms_server,
        params: {
            layers: 'wind',
            format: 'image/png',
            transparent: true,
            colorscalerange: 'auto',
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            markerscale: 15,
            markerspacing: 12,
            markerclipping: true,
            styles: 'prettyvec/rainbow'
        },
        visible: true,
        singleTile: true,
        autoExtent: false,
        timeseriesWhenNotVisible: true,
    }];

    var sapoMap = new Sorrento(wms_server, sapo_layers, 'map-wind');
}


function aviso() {
    var wms_server = 'http://thredds.socib.es/thredds/wms/observational/satellite/altimetry/aviso/madt/altimetry_aviso_madt_L4_agg/altimetry_aviso_madt_L4_agg_best.ncd';
    var aviso_layers = [{
        name: "Altimetry",
        url: wms_server,
        params: {
            layers: "adt",
            colorscalerange: '-0.4,0.4',
            markerscale: 8,
            markerspacing: 6,
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
            styles: 'shadefill/rainbow',
            zIndex: 10
        },
        visible: true,
        singleTile: false,
        autoExtent: false,
        timeseries: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        }
    }, {
        name: "Altimetry - Contour",
        url: wms_server,
        params: {
            layers: "adt",
            format: 'image/png',
            transparent: true,
            colorscalerange: '-0.5,0.5',
            numcontours: 21,
            styles: 'contour/rainbow',
            zIndex: 90
        },
        visible: true,
        singleTile: false,
        autoExtent: false,
        timeseries: false,
        legend: false,
        TimeDimensionOptions: {
            updateTimeDimension: false
        }
    }, {
        name: "Daily Average Surface Geostrophic Currents",
        url: wms_server,
        params: {
            layers: "surface_geostrophic_sea_water_velocity",
            transparent: true,
            colorscalerange: 'auto',
            markerscale: 15,
            markerspacing: 12,
            markerclipping: true,
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
            styles: 'prettyvec/rainbow'
        },
        visible: true,
        singleTile: true,
        autoExtent: false,
        timeseries: true,
        legend: false,
        TimeDimensionOptions: {
            updateTimeDimension: false
        }

    }];
    var avisoMap = new Sorrento(wms_server, aviso_layers, 'map-aviso');
}

function sacosta() {
    var mapOptions = {
        fullscreenControl: true,
        center: [39.681113, 2.38],
        zoom: 10,
        scrollWheelZoom: false,
        crs: L.CRS.EPSG4326
    };
    var map = L.map('map-sacosta', mapOptions);

    var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });
    var bathymetryLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
        layers: 'emodnet:mean_atlas_land',
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

    var sacosta = L.tileLayer.wms("http://gis.socib.es/geoserver/sa/wms", {
        layers: 'sa:bal_sa_costa_2012',
        format: 'image/png',
        transparent: true,
        attribution: '<a href="http://gis.socib.es/geoserver/ows?TRANSPARENT=true&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&LAYER=sa%3Abal_sa_costa_2012&SCALE=272989.5341090407&FORMAT=image%2Fgif">Leyenda Sa Costa</a>'
    });

    var habitats = L.tileLayer.wms("http://www.emodnet-seabedhabitats.eu/plugins/MESHAtlanticMapper/proxyhandler.ashx?mapInstance=MESHAtlanticMap_", {
        layers: 'Eunis,HabitatMappingAreas,FrenchLandscapes,HabitatsMed,Region',
        format: 'image/png',
        transparent: true,
        attribution: '<a href="http://www.emodnet-seabedhabitats.eu/plugins/MESHAtlanticMapper/proxyhandler.ashx?mapInstance=MESHAtlanticMap_&SERVICE=WMS&VERSION=1.1.1&REQUEST=getlegendgraphic&FORMAT=image/png&layer=HabitatsMed005">Leyenda habitats</a>'
    });

    var posidonia = L.tileLayer.wms("http://ideib.caib.es/pub_ideib/public/TEMATIC-MEDIAMBIENT/MapServer/WMSServer", {
        layers: '6',
        format: 'image/png',
        transparent: true,
    });


    var bathymetryGroupLayer = L.layerGroup([bathymetryLayer, coastlinesLayer, namesLayer, underseaLayer]);
    bathymetryGroupLayer.addTo(map);
    var baseMaps = {
        "Emodnet bathymetry": bathymetryGroupLayer,
        "OSM": osmLayer
    };
    L.control.coordinates({
        position: "bottomleft",
        decimals: 3,
        labelTemplateLat: "Latitude: {y}",
        labelTemplateLng: "Longitude: {x}",
        useDMS: true,
        enableUserInput: false
    }).addTo(map);
    var overlayMaps = {
        'Tipo de costa': sacosta,
        'Habitats marinos (EUNIS)': habitats,
        'Posidonia (IDEIB)': posidonia,
    };
    var layerControl = L.control.layers(baseMaps, overlayMaps);
    layerControl.addTo(map);
    sacosta.addTo(map);
    posidonia.addTo(map);

    var sorrento = L.circleMarker(SORRENTO_POSITION, {
        color: '#FFFFFF',
        fillColor: "#f28f43",
        fillOpacity: 1,
        radius: 5,
        weight: 2
    }).addTo(map);
}


L.TimeDimension.Layer.CDrift = L.TimeDimension.Layer.GeoJson.extend({

    _getFeatureTimes: function(feature) {
        if (!feature.properties) {
            return [];
        }
        if (feature.properties.hasOwnProperty('coordTimes')) {
            return feature.properties.coordTimes;
        }
        if (feature.properties.hasOwnProperty('times')) {
            return feature.properties.times;
        }
        if (feature.properties.hasOwnProperty('linestringTimestamps')) {
            return feature.properties.linestringTimestamps;
        }
        if (feature.properties.hasOwnProperty('time')) {
            return [feature.properties.time * 1000];
        }
        return [];
    },

    _getFeatureBetweenDates: function(feature, minTime, maxTime) {
        var featureStringTimes = this._getFeatureTimes(feature);
        if (featureStringTimes.length == 0) {
            return feature;
        }
        var featureTimes = [];
        for (var i = 0, l = featureStringTimes.length; i < l; i++) {
            var time = featureStringTimes[i]
            if (typeof time == 'string' || time instanceof String) {
                time = Date.parse(time.trim());
            }
            featureTimes.push(time);
        }

        if (featureTimes[0] > maxTime || featureTimes[l - 1] < minTime) {
            return null;
        }
        return feature;
    },

});

L.timeDimension.layer.cDrift = function(layer, options) {
    return new L.TimeDimension.Layer.CDrift(layer, options);
};

function spill() {
    var startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    var mapOptions = {
        zoom: 8,
        fullscreenControl: true,
        timeDimensionControl: false,
        timeDimensionControlOptions: {
            position: 'bottomleft',
            autoPlay: true,
            timeSlider: false,
            speedSlider: false,
            playerOptions: {
                transitionTime: 125,
                loop: true,
            }
        },
        timeDimension: true,
        center: SORRENTO_POSITION
    };
    var map = L.map('map-spill', mapOptions);

    L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
        _getDisplayDateFormat: function(date) {
            return date.format("yyyy-mm-dd HH:MM 'UTC'", true);
        }
    });
    var timeDimensionControl = new L.Control.TimeDimensionCustom(mapOptions.timeDimensionControlOptions);
    map.addControl(timeDimensionControl);


    $.getJSON('http://socib.es/files/images_fotos/modelling/spill-sorrento.json', function(data) {
        var cdriftLayer = L.geoJson(data, {
            style: function(feature) {
                var color = "#FFF";
                if (feature.properties.confidence == '0.9') {
                    color = "#FF0000";
                } else if (feature.properties.confidence == '0.75') {
                    color = "#FFFF00";
                } else if (feature.properties.confidence == '0.5') {
                    color = "#00FF00";
                }
                return {
                    "color": color,
                    "weight": 2,
                    "opacity": 0.4
                };
            }
        });

        var cdriftTimeLayer = L.timeDimension.layer.cDrift(cdriftLayer, {
            updateTimeDimension: true,
            updateTimeDimensionMode: 'replace',
            addlastPoint: false,
            duration: 'PT20M',
        });
        cdriftTimeLayer.addTo(map);
        map.fitBounds(cdriftLayer.getBounds());

        var cDriftLegend = L.control({
            position: 'bottomright'
        });
        cDriftLegend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML += '<ul><li class="p05">probabilidad 50%</li><li class="p075">probabilidad 75%</li><li class="p09">probabilidad 90%</li></ul>';
            return div;
        };
        cDriftLegend.addTo(map);

        map.timeDimension.on('timeload', function(data) {
            var date = new Date(map.timeDimension.getCurrentTime());
            if (data.time == map.timeDimension.getCurrentTime()) {
                var totalTimes = map.timeDimension.getAvailableTimes().length;
                var position = map.timeDimension.getAvailableTimes().indexOf(data.time);
                $(map.getContainer()).find('.animation-progress-bar').width((position * 100) / totalTimes + "%");
            }
        });
    });
    var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });
    var bathymetryLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
        layers: 'emodnet:mean_atlas_land',
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

    var bathymetryGroupLayer = L.layerGroup([bathymetryLayer, coastlinesLayer, namesLayer, underseaLayer]);
    bathymetryGroupLayer.addTo(map);
    var baseLayers = {
        "Emodnet bathymetry": bathymetryGroupLayer,
        "OSM": osmLayer
    };
    L.control.coordinates({
        position: "bottomleft",
        decimals: 3,
        labelTemplateLat: "Latitude: {y}",
        labelTemplateLng: "Longitude: {x}",
        useDMS: true,
        enableUserInput: false
    }).addTo(map);
    L.control.layers(baseLayers, {}).addTo(map);

    var sorrento = L.circleMarker(SORRENTO_POSITION, {
        color: '#FFFFFF',
        fillColor: "#f28f43",
        fillOpacity: 1,
        radius: 5,
        weight: 2
    }).addTo(map);
}


$(function() {
    currents();
    sapo();
    wind();
    spill();
    // aviso();
    // sacosta();
});