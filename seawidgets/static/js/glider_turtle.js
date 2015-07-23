var POSITION = [39.6145, 1.99363];
var Real_Time_Viewer = function(layers, container) {
    var currentTime = new Date();
    currentTime.setUTCMinutes(0, 0, 0);
    //var endDate = new Date(currentTime.getTime());
    var endDate = new Date(2014, 7, 20, 0, 0, 0, 0);
    L.TimeDimension.Util.addTimeDuration(endDate, "P3D", true);

    this.options = {
        container: container,
        layers: layers,
        mapOptions: {
            center: POSITION,
            zoom: 8,
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
        default_range_selector: 0
    };
    this.gridViewer = new NCWMSGridTimeseriesViewer(this.options);

    this.gridViewer.layerControl.h
    var rt_map = this.gridViewer.getMap();
    //getTurtles(rt_map)

    var turtles = [
        [227, 391, 'Callypso','turtle-1'],
        [226, 390,'Kontiki','turtle-2']
    ];

    var overLayers = [];
    for (var i = 0, l = turtles.length; i < l; i++) {
        var turtlesLayer = L.timeDimension.layer.drifterDeployment({
            id_platform: turtles[i][0],
            id_deployment: turtles[i][1],
            duration: "P1D",
            addlastPoint: true
        });
        turtlesLayer.addTo(rt_map);
        overLayers.push({
            name: turtles[i][2],
            icon: iconByName(turtles[i][3]),
            layer: turtlesLayer
        })
    }

    var panelLayers = new L.Control.PanelLayers(null, overLayers, {collapsed: true});
    rt_map.addControl(panelLayers);
};

function iconByName(name) {
	return '<img class"legend-icon" src="../static/images/icons/'+ name +'.png" style="width: 20px;height: 20px;"/>';
}

function getTurtles(rt_map){
    $.getJSON('/deployments/current_turtles.json', function(data) {
      var geojson = L.geoJson(data.features, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup(feature.properties.html);
        }
      });
      geojson.addTo(rt_map);
    });
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
            numcolorbands: 50,
        },
        visible: true,
        singleTile: false,
        autoExtent: false,
        timeseriesWhenNotVisible: true
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
        timeseriesWhenNotVisible: true
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
        }
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
        }
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
        }
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
        }
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
        visible: true,
        singleTile: false,
        autoExtent: false,
        TimeDimensionOptions: {
            updateTimeDimension: true
        }
    }];

    var rtMap = new Real_Time_Viewer(rt_layers, 'map');
}


L.TimeDimension.Layer.DrifterDeployment = L.TimeDimension.Layer.GeoJson.extend({

    initialize: function(layer, options) {
        layer = L.geoJson();
        L.TimeDimension.Layer.GeoJson.prototype.initialize.call(this, layer, options);
        this._id_platform = this.options.id_platform;
        this._id_deployment = this.options.id_deployment;
    },

    onAdd: function(map) {
        L.TimeDimension.Layer.prototype.onAdd.call(this, map);
        var proxy = '/services/wms-proxy';
        var url = "http://apps.socib.es/DataDiscovery/deployment-info?" +
            "id_platform=" + this._id_platform + "&id_deployment=" + this._id_deployment;
        $.getJSON(proxy + '?url=' + encodeURIComponent(url), (function(map, data) {
            this._baseLayer = this._createLayer(data);
            this._onReadyBaseLayer();
        }.bind(this, map)));
    },

    _createLayer: function(featurecollection) {
        // lastPosition
        this._color = this._pickRandomColor();


        this._icon = L.icon({
            iconUrl: '/static/images/icons/turtle-1.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        var layer = L.geoJson(null, {
            pointToLayer: (function(feature, latLng) {
                if (feature.properties.hasOwnProperty('last')) {
                    return new L.Marker(latLng, {
                        icon: this._icon
                    });
                }
                return L.circleMarker(latLng, {
                    fillColor: this._color,
                    fillOpacity: 0.5,
                    stroke: false,
                    radius: 3
                });
            }).bind(this),
            style: (function(feature) {
                return {
                    "color": this._color,
                    "weight": 2,
                    "opacity": 1
                };
            }).bind(this)
        });
        if (!featurecollection.features) {
            return layer;
        }
        layer.addData(featurecollection.features[0]);
        for (var i = 1, l = featurecollection.features.length; i < l; i++) {
            var point = featurecollection.features[i];
            layer.addData(point);
        }
        // save last point
        this._lastPoint = featurecollection.features[featurecollection.features.length - 1];
        return layer;
    },

    _pickRandomColor: function() {
        var colors = ["#00aaff", "#ffaa00", "#ff00aa", "#ff0000", "#00ffaa", "#00ff00", "#0000ff", "#aa00ff", "#aaff00"];
        var index = Math.floor(Math.random() * colors.length);
        return colors[index];
    },

    _addDeploymentTrajectory: function(layer, trajectory_feature) {
        // remove the old one
        if (this._deploymentTrajectory) {
            layer.removeLayer(this._deploymentTrajectory);
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
        // deploymentTrajectory.on('click', deployment.popupFunction.bind(this, deployment, undefined));
        deploymentTrajectory.addTo(layer);
        // save for later
        this._deploymentTrajectory = deploymentTrajectory;
    },

    _addDeploymenPoint: function(layer, point, isLastPoint) {
        var deploymentPoint = L.geoJson(point, {
            pointToLayer: (function(feature, latLng) {
                if (isLastPoint) {
                    return new L.Marker(latLng, {
                        icon: this._icon
                    });
                } else {
                    return L.circleMarker(latLng, {
                        fillColor: this._color,
                        fillOpacity: 0.5,
                        stroke: false,
                        radius: 3
                    });
                }
            }).bind(this)
        });
        // deploymentPoint.on('click', deployment.popupFunction.bind(this, deployment, point));
        deploymentPoint.addTo(layer);
        if (isLastPoint)
            this._lastPoint = deploymentPoint;
    }


});

L.timeDimension.layer.drifterDeployment = function(options) {
    return new L.TimeDimension.Layer.DrifterDeployment(null, options);
};

$(function() {
    real_time();
});