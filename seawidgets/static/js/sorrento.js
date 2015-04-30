var SORRENTO_POSITION = [39.58157, 1.971803];
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
            colorscalerange: "auto",
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
            colorscalerange: '0,3',
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

function sacosta(){
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


$(function() {
    currents();
    sapo();
    wind();
    aviso();
    sacosta();
});