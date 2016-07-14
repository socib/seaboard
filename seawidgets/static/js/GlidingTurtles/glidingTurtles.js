var POSITION = [39.6145, 1.99363];
var GTViewer = function(layers, container) {
    var currentTime = new Date();
    currentTime.setUTCHours(currentTime.getUTCHours() , 0, 0, 0);
    var endDate = new Date(currentTime.getTime());
    L.TimeDimension.Util.addTimeDuration(endDate, "P1D", true);

    this.options = {
        container: container,
        layers: layers,
        mapOptions: {
            center: POSITION,
            zoom: 8,
            scrollWheelZoom: false,
            timeDimensionOptions: {
                timeInterval: "P3D/" + endDate.toISOString(),
                period: "PT1H",
                currentTime: currentTime.getTime()
            },
            timeDimensionControlOptions: {
                autoPlay: false,
                speedSlider: false,
                timeSlider: true,
                displayDate: true,
                playerOptions: {
                    buffer: 0,
                    transitionTime: 500,
                    loop: false,
                }
            }
        },
        proxy: '/services/wms-proxy',
        default_range_selector: 0
    };
    this.gridViewer = new MapGT(this.options);

    getPlatforms(this.gridViewer);

};

function iconByName(name) {
	return '<img class"legend-icon" src="../static/images/icons/'+ name +'.png" style="width: 20px;height: 20px;"/>';
}

function getPlatforms(viewer){
    var rt_map = viewer.getMap();
    var platforms = [
        [278, 522, 'Pixel','turtle_green','#608823','turtle'],
        [280, 524, 'Eddy','turtle_orange','#C06117','turtle'],
        [103, 644, 'Glider','icon-glider','#E2DA26','glider']
        //[225964230, null,'SOCIB UNO','marker-boat','#FF0000','ship']
        //[224637000, null,'Marti i Soler','marker-boat','#FF0000','ship']
    ];

    for (var i = 0, l = platforms.length; i < l; i++) {
        var layer = L.timeDimension.layer.GTDeployment({
            id_platform: platforms[i][0],
            id_deployment: platforms[i][1],
            duration: "P3D",
            addlastPoint: true,
            icon: platforms[i][3],
            color: platforms[i][4],
            type_deployment: platforms[i][5],
            name_deployment: platforms[i][2]
        });
        layer.addTo(rt_map);
        var platformsLegend={
            name: platforms[i][2],
            icon: iconByName(platforms[i][3]),
            layer: layer
        }
        viewer.layerControl.addOverlay(platformsLegend);
    }
}

function real_time() {
    var wms_sapo = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/wave/model_run_aggregation/sapo_ib/sapo_ib_best.ncd';
    var wms_wmop = 'http://thredds.socib.es/thredds/wms/operational_models/oceanographical/hydrodynamics/model_run_aggregation/wmop/wmop_best.ncd';
    var wms_myo_chl = 'http://thredds.socib.es/thredds/wms/observational/satellite/ocean_color/myocean/chla/L3/ocean_color_myocean_chla_L3_NRT_agg/ocean_color_myocean_chla_L3_NRT_agg_best.ncd';

    var rt_layers = [{
        name: "Significant wave height",
        url: wms_sapo,
        params: {
            layers: "significant_wave_height",
            styles: 'shadefill/scb_bugnylorrd',
            colorscalerange: '0,2',
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
        },
        visible: false,
        singleTile: false,
        autoExtent: false,
        timeseriesWhenNotVisible: true,
        icon: 'sea_surface_wave_significant_height'
    }, {
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
        visible: false,
        singleTile: true,
        autoExtent: false,
        timeseries: false,
        legendHTML: function() {
            var innerHTML = '<img src="/static/images/black-arrow.png" /> mean direction';
            return innerHTML;
        },
        icon:'sea_surface_wave_from_direction'
    },{
        name: "Sea Surface Currents",
        url: wms_wmop,
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
        visible: false,
        singleTile: true,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        },
        icon:'direction_of_sea_water_velocity'
    },{
        name: "Sea Surface Temperature",
        url: wms_wmop,
        params: {
            layers: "temp",
            colorscalerange: "auto",
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
            styles: 'boxfill/spectral'
        },
        visible: false,
        singleTile: true,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        },
        icon:'sea_water_temperature'
    },{
        name: "Sea Surface Salinity",
        url: wms_wmop,
        params: {
            layers: "salt",
            colorscalerange: "36,38.5",
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
            styles: 'boxfill/spectral'
        },
        visible: false,
        singleTile: false,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        },
        icon:'sea_water_salinity'
    },{
        name: "Sea Surface Height",
        url: wms_wmop,
        params: {
            layers: "zeta",
            colorscalerange: "-1,0",
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
            styles: 'boxfill/spectral'
        },
        visible: false,
        singleTile: false,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        },
        icon: 'water_surface_height_above_reference_datum'
    },{
        name: "Chlorophyll Concentration",
        url: wms_myo_chl,
        params: {
            layers: "CHL",
            styles: 'boxfill/rainbow',
            colorscalerange: '0.02,0.1',
            logscale:true,
            abovemaxcolor: "extend",
            belowmincolor: "extend",
            numcolorbands: 100,
        },
        visible: false,
        singleTile: false,
        autoExtent: false,
        timeseriesWhenNotVisible: true,
        icon:'chla'
    },];

    var rtMap = new GTViewer(rt_layers, 'map');
}

$(function() {
    real_time();
});