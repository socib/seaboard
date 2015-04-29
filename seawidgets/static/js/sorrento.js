var Sorrento = function(wms_server, layers, container) {
    this.wms_server = wms_server;
    var currentTime = new Date();
    currentTime.setUTCHours(0, 0, 0, 0);
    var endDate = new Date(currentTime.getTime());
    L.TimeDimension.Util.addTimeDuration(endDate, "P3D", true);

    this.options = {
        container: container,
        layers: layers,
        mapOptions: {
            center: [39.56, 1.85],
            zoom: 9,
            timeDimensionOptions: {
                timeInterval: "P1M/" + endDate.toISOString(),
                period: "PT6H",
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
                    loop: false,
                }
            }
        },
        proxy: '/services/wms-proxy',
        default_range_selector: 0,
        default_markers: [{
            name: 'Sorrento',
            position: [39.56, 1.85]
        }]
    };
    this.gridViewer = new NCWMSGridTimeseriesViewer(this.options);
    var map = this.gridViewer.getMap();
};



function currents() {
    var wms_server = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/hydrodynamics/model_run_aggregation/wmop/wmop_best.ncd';
    var wmop_layers = [{
        name: "Sea Surface Velocity",
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
            colorscalerange: '0,6',
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
        name: "Predicción viento",
        url: wms_server,
        params: {
            layers: 'wind',
            format: 'image/png',
            transparent: true,
            colorscalerange: '0,2',
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
        name: "Geostrophic currents",
        url: wms_server,
        params: {
            layers: "surface_geostrophic_sea_water_velocity",
            transparent: true,
            colorscalerange: '-20,100',
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


$(function() {
    currents();
    sapo();
    wind();
    aviso();
});