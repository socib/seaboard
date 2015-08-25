L.TimeDimension.Layer.GTDeployment = L.TimeDimension.Layer.GeoJson.extend({

    initialize: function(layer, options) {
        layer = L.geoJson();
        L.TimeDimension.Layer.GeoJson.prototype.initialize.call(this, layer, options);
        this._type_deployment = this.options.type_deployment;
        this._name_deployment = this.options.name_deployment;
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
    formatPopup: function(pointProps, lineProps, geom) {
        var html ="";
        if(pointProps != undefined && lineProps != undefined){

            if (this._type_deployment == 'ship'){
                var speed = (parseFloat(pointProps['speed'])/10).toFixed(2);
                html = "<b>Ship: </b>"+lineProps['name_deployment']+"</BR>"
                html += "<b>Speed: </b>" + speed + " kn / " + (speed * 1.852).toFixed(2) + " km/h</BR>";
                html += "<b>TimeStamp: </b>" + formatDate(new Date(pointProps['time'])) + " UTC</BR>";
                html += "<b>Position: </b>" + "Lon: " + geom.coordinates[0].toFixed(2) + " / Lat: " + geom.coordinates[1].toFixed(2);
            }else if (this._type_deployment == 'turtle'){
                html = "<h4><b>" + pointProps['platform_name'] + "</b></h4>";
                html += "<b>Time: </b>" + formatDate(new Date(pointProps['time stamp']*1000))+ " UTC</BR>";
                html += "<b>Position: </b>" + "Lon: " + geom.coordinates[0].toFixed(2) + " / Lat: " + geom.coordinates[1].toFixed(2) + "</BR>";
                html += "<b>Speed: </b>" + pointProps['SPEED'] + "</BR>";
                html += "<b>Angle: </b>" + pointProps['CUR_DIR'] + "</BR>";
                html += '<button type="button" class="btn btn-info" data-toggle="collapse" data-target="#abstract">More info</button>'
                html += "<div id='abstract' class='collapse'>" + lineProps.abstract + "</div>";
            }else if(this._type_deployment == 'glider'){
                html = "<h4><b>" + pointProps['platform_name'] + "</b></h4>";
                html += "<b>Time: </b>" + formatDate(new Date(pointProps['time stamp']*1000))+ " UTC</BR>";
                html += "<b>Position: </b>" + "Lon: " + geom.coordinates[0].toFixed(2) + " / Lat: " + geom.coordinates[1].toFixed(2) + "</BR>";
                html += "<b>Speed: </b>" + pointProps['SPEED'] + "</BR>";
                html += "<b>Angle: </b>" + pointProps['BEARING'] + "</BR>";
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
                        feature.properties.name_deployment = this._name_deployment;
                    }else if(this._type_deployment == "glider"){
                        angle = parseInt(propsPoint['BEARING'].split(" ")[0])
                    }else if(this._type_deployment == "turtle"){
                        angle = parseInt(propsPoint['CUR_DIR'].split(" ")[0]);
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
                    layer.bindPopup(this.formatPopup(feature.originalProps, feature.properties, feature.geometry));
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

L.timeDimension.layer.GTDeployment = function(options) {
    return new L.TimeDimension.Layer.GTDeployment(null, options);
};

var formatDate = function(d){
    return d.getUTCFullYear() + '-' + (addZ(d.getUTCMonth() + 1)) + '-' + (addZ(d.getDate())) + ' ' +
          addZ(d.getUTCHours()) + ':' + addZ(d.getUTCMinutes());
}

var addZ = function(n){return n<10? '0'+n:''+n;}