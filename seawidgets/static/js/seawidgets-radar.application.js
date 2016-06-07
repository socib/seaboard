var GALFI_POSITION = [38.94933, 1.2];
var ForecastMap = function(wms_server, layers, container) {
    this.wms_server = wms_server;
    var currentTime = new Date();
    currentTime.setUTCMinutes(0, 0, 0);
    var endDate = new Date(currentTime.getTime());
    L.TimeDimension.Util.addTimeDuration(endDate, "P3D", true);

    this.options = {
        container: container,
        layers: layers,
        mapOptions: {
            center: [38.85, 1.2],
            zoom: 10,
            scrollWheelZoom: false,
            timeDimensionOptions: {
                timeInterval: "PT2H/" + endDate.toISOString(),
                period: "PT1H",
                currentTime: currentTime.getTime()
            },
            timeDimensionControlOptions: {
                autoPlay: true,
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
            name: 'Galfi',
            position: GALFI_POSITION
        }]
    };
    this.gridViewer = new NCWMSGridTimeseriesViewer(this.options);
    var map = this.gridViewer.getMap();
};

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

    var sapoMap = new ForecastMap(wms_server, sapo_layers, 'map-waves');
}

$(function() {
    sapo();
});