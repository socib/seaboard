var POSITION = [39.6145, 1.99363];
var GTViewer = function(layers, container) {
    var currentTime = new Date();
    currentTime.setUTCMinutes(0, 0, 0);
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
        [276, 520, 'Mel','turtle-1','#29CD50','turtle'],
        [107, 521, 'Glider','icon-glider','#F28826','glider'],
        [225964230, null,'SOCIB UNO','marker-boat','#FF0000','ship']
        //[224634000, null,'SOCIB UNO','marker-boat','#FF0000','ship']
    ];

    for (var i = 0, l = platforms.length; i < l; i++) {
        var layer = L.timeDimension.layer.Deployment({
            id_platform: platforms[i][0],
            id_deployment: platforms[i][1],
            duration: "P3D",
            addlastPoint: true,
            icon: platforms[i][3],
            color: platforms[i][4],
            type_deployment: platforms[i][5]
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
    var wms_myo_chl = 'http://myocean.artov.isac.cnr.it/thredds/wms/dataset-oc-med-chl-modis_a-l4-interp_4km_daily-rt-v02';

    var rt_layers = [{
        name: "Chlorophyll Concentration",
        url: wms_myo_chl,
        params: {
            layers: "CHL",
            styles: 'boxfill/rainbow',
            colorscalerange: '0.01,10',
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
    },{
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
    }];

    var rtMap = new GTViewer(rt_layers, 'map');
}

L.TimeDimension.Layer.Deployment = L.TimeDimension.Layer.GeoJson.extend({

    initialize: function(layer, options) {
        layer = L.geoJson();
        L.TimeDimension.Layer.GeoJson.prototype.initialize.call(this, layer, options);
        this._type_deployment = this.options.type_deployment;
        this._id_platform = this.options.id_platform;
        this._id_deployment = this.options.id_deployment;
        this._color = this.options.color || this._pickRandomColor();
        this._fitBounds = this.options.fitBounds || false;
        this._updateTimeDimensionMode = 'extremes';
        this._updateTimeDimension = false;
        this._updateCurrentTime = this.options.updateCurrentTime || false;
        this._iconImg = this.options.icon;
    },

    onAdd: function(map) {

        L.TimeDimension.Layer.prototype.onAdd.call(this, map);
        var requestURL;
        if(this._type_deployment == "ship"){
            requestURL = '/deployments/ship_tracking_' + this._id_platform + '.json'
        }else{
            var proxy = '/services/wms-proxy';
            var url = "http://apps.socib.es/DataDiscovery/deployment-info?" +
            "id_platform=" + this._id_platform + "&id_deployment=" + this._id_deployment + "&sample=1";

            requestURL = proxy + '?url=' + encodeURIComponent(url)
        }
        map.spin(true);
        $.getJSON(requestURL, (function(map, data) {
            if(!data.hasOwnProperty("error")){
                this._baseLayer = this._createLayer(data);
                this._onReadyBaseLayer();
            }else{
                console.log("ERROR: " + data.error + " for ship with mmsi:" + this._id_platform);
            }
            map.spin(false);
        }.bind(this, map)));

    },

    fitMapToBounds: function() {
        if (this._map && this._baseLayer) {
            this._map.fitBounds(this._baseLayer.getBounds());
        }
    },
    searchLastPoint: function() {
        if (this._map && this._baseLayer) {
            var lastTimeDimension = (this._type_deployment == 'ship') ?
                this._timeDimension.getCurrentTime() : this._timeDimension.getCurrentTime()/1000;
            var timeField = (this._type_deployment == 'ship') ? 'time' : 'time stamp';
            var lastTimeProperties = {};
            lastTimeProperties[timeField] = 0;
            var layers = this._baseLayer._layers
            for (l in layers) {
                if (layers[l].feature.properties[timeField] != undefined) {
                    if ((layers[l].feature.properties[timeField] < lastTimeDimension) &&
                        (layers[l].feature.properties[timeField] > lastTimeProperties[timeField] )) {
                        lastTimeProperties = layers[l].feature.properties;
                    }
                }
            }
            return lastTimeProperties
        }
    },
    formatPopup: function(pointProps, lineProps) {
        var html ="";
        if(pointProps != undefined && lineProps != undefined){

            if (this._type_deployment == 'ship'){
                var speed = (parseFloat(pointProps['speed'])/10).toFixed(2);
                html = "<b>Ship: </b>"+lineProps['name']+"</BR>"
                html += "<b>Speed: </b>" + speed + " kn / " + (speed * 1.852).toFixed(2) + " km/h</BR>";
                html += "<b>TimeStamp: </b>" + pointProps['time'] + " UTC</BR>";
                html += "<b>TimeStamp: </b>" + new Date(pointProps['time']).format('yyyy-mm-dd HH:MM') + " UTC</BR>";
            }else if (this._type_deployment == 'turtle'){
                html = "<b>" + pointProps['platform_name'] + "</b></BR>";
                html += "Time: " + new Date(pointProps['time stamp']*1000).format('yyyy-mm-dd HH:MM') + " (UTC)</BR>";
                html += "Position: " + pointProps['LON'].match(/^(\d*[.]\d*)/)[0] + "," + pointProps['LAT'].match(/^(\d*[.]\d*)/)[0] + "</BR>";
                html += "Speed: " + pointProps['SPEED'] + "</BR>";
                html += '<button type="button" class="btn btn-info" data-toggle="collapse" data-target="#abstract">More info</button>'
                html += "<div id='abstract' class='collapse'>" + lineProps.abstract + "</div>";
            }else if(this._type_deployment == 'glider'){
                html = "<b>" + pointProps['platform_name'] + "</b></BR>";
                html += "Time: " + new Date(pointProps['time stamp']*1000).format('yyyy-mm-dd HH:MM') + " (UTC)</BR>";
                html += "TimeStamp: " + pointProps['time stamp'] + " (UTC)</BR>";
                html += "Position: " + pointProps['LON'].match(/^(\d*[.]\d*)/)[0] + "," + pointProps['LAT'].match(/^(\d*[.]\d*)/)[0] + "</BR>";
                html += "Speed: " + pointProps['PSPEED'] + "</BR>";
                html += '<button type="button" class="btn btn-info" data-toggle="collapse" data-target="#abstract">More info</button>'
                html += "<div id='abstract' class='collapse'>" + lineProps.abstract + "</div>";
            }
        }
        return html;
    },

    _createLayer: function(featurecollection) {
        convertToSlug = function(Text) {
            return decodeURIComponent(Text)
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
        };

        this._icon = L.icon({
            iconUrl: '/static/images/icons/'+ this._iconImg +'.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        if(this._type_deployment == "ship"){
            this._icon.options.iconSize = [19, 26];
            this._icon.options.iconAnchor = [9, 13];
        }

        this._iconTarget = L.icon({
            iconUrl: '/static/images/icons/icon-target.png',
            iconSize: [22, 22],
            iconAnchor: [10, 20]
        });

        var layer = L.geoJson(null, {
            pointToLayer: (function(feature, latLng) {
                if (feature.properties.hasOwnProperty('class')){
                    if (feature.properties.class == 'mission_point') {
                        return L.circleMarker(latLng, {
                            fillColor: "#FFFFFF",
                            fillOpacity: 0.5,
                            stroke: false,
                            radius: 3
                        });
                    }
                    if (feature.properties.class == 'target_point') {
                        return new L.Marker(latLng, {
                            icon: this._iconTarget
                        });
                    }
                    if (feature.properties.class == 'target_linestring' || feature.properties.class == 'mission_line_string'){
                        return L.circleMarker(latLng, {
                            fillColor: "#FFFFFF",
                            fillOpacity: 0.5,
                            stroke: false,
                            radius: 3
                        });
                    }
                }
                if (feature.properties.hasOwnProperty('last')) {
                    var propsPoint = this.searchLastPoint();
                    feature.originalProps = propsPoint;
                    var angle= 0;
                    if (this._type_deployment == "ship"){
                        angle = parseInt(propsPoint['course'])
                    }else if(this._type_deployment == "glider"){
                        angle = parseInt(propsPoint['BEARING'].split(" ")[0])
                    }

                    return new L.Marker(latLng, {
                        icon: this._icon,
                        iconAngle: angle
                    });
                }
                 var circleMarker = L.circleMarker(latLng, {
                        fillColor: this._color,
                        fillOpacity: 0.5,
                        stroke: false,
                        radius: 5
                 });
                if(this._type_deployment == 'ship'){
                    circleMarker.options.radius = 0;
                    circleMarker.options.clicakable = false;
                }
                return circleMarker;
            }).bind(this),
            style: (function(feature) {
                if (feature.properties && feature.properties.class){
                    if (feature.properties.class == 'target_linestring'){
                        return {
                            "color": this._color,
                            "dashArray": 3,
                            "weight": 1,
                            "opacity": 0.5
                        }
                    }
                    if (feature.properties.class == 'mission_line_string'){
                        return {
                            "color": "#FFFFFF",
                            "dashArray": 2,
                            "weight": 2,
                            "opacity": 0.5
                        }
                    }
                }
                return {
                    "color": this._color,
                    "weight": 2,
                    "opacity": 0.5
                };
            }).bind(this),
            onEachFeature: (function (feature, layer) {
                if (feature.properties.hasOwnProperty('html')) {
                    layer.bindPopup(feature.properties.html);
                }else if(feature.properties.hasOwnProperty('last')){
                    layer.bindPopup(this.formatPopup(feature.originalProps, feature.properties));
                }
            }).bind(this)
        });
        layer.fire('data:loading');
        if (!featurecollection.features) {
            return layer;
        }
        layer.addData(featurecollection.features[0]);
        this._addDeploymentTrajectory(featurecollection.features[0]);
        for (var i = 1, l = featurecollection.features.length; i < l; i++) {
            var point = featurecollection.features[i];
            if (point.geometry.type == 'Point') {
                if (point.geometry.coordinates.length < 2 || point.geometry.coordinates[0] === null || point.geometry.coordinates[1] === null) {
                    continue;
                }
            }
            layer.addData(point);
        }
        // save last point
        this._lastPoint = featurecollection.features[featurecollection.features.length - 1];
        return layer;
    },

    _pickRandomColor: function() {
        var colors = ["#ff00aa", "#ff0000", "#00ffaa", "#00ff00", "#0000ff", "#aa00ff", "#aaff00", "#00aaff", "#ffaa00"];
        var index = Math.floor(Math.random() * colors.length);
        return colors[index];
    },

    _addDeploymentTrajectory: function(trajectory_feature) {
        // remove the old one
        if (this._deploymentTrajectory) {
            this._map.removeLayer(this._deploymentTrajectory);
        }
        var getStyle = (function(feature) {
            return {
                "color": this._color,
                "weight": 2,
                "opacity": 1
            };
        }).bind(this);
        var deploymentTrajectory = L.geoJson(trajectory_feature, {
            style: getStyle
        });
        deploymentTrajectory.bindPopup(trajectory_feature.properties.abstract);
        deploymentTrajectory.addTo(this._map);
        // save for later
        this._deploymentTrajectory = deploymentTrajectory;
    },

    eachLayer: function(method, context) {
        if (this._deploymentTrajectory) {
            method.call(context, this._deploymentTrajectory);
        }
        return L.TimeDimension.Layer.GeoJson.prototype.eachLayer.call(this, method, context);
    },

    _onReadyBaseLayer: function() {
        this._loaded = true;
        this._setAvailableTimes();
        if (this._updateCurrentTime)
            this._timeDimension.setCurrentTime(this._availableTimes[0]);
        this._update();
        if (this._fitBounds) {
            this.fitMapToBounds();
        }
    }
});

L.timeDimension.layer.Deployment = function(options) {
    return new L.TimeDimension.Layer.Deployment(null, options);
};

$(function() {
    real_time();
});