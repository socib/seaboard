var MapGT = function(options) {
    this.container = options.container || 'map';
    this.layers = options.layers;
    this.baseMaps = options.baseMaps;
    this.mapOptions = options.mapOptions || {};
    this.proxy = options.proxy || null;
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

MapGT.prototype.addLayersToMap = function() {
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

            var updateTimeDimension = false;
            if (layer.TimeDimensionOptions && layer.TimeDimensionOptions.updateTimeDimension){
                updateTimeDimension = true;
            }
            layer.timeLayer = L.timeDimension.layer.wms(layer.tilelayer, {
                proxy: this.proxy,
                updateTimeDimension: updateTimeDimension
            });

            var oLayer ={
                name: layer.name,
                layer: layer.timeLayer,
                icon: iconByName(layer.icon)
            }

            this.layerControl.addOverlay(oLayer);
            if (layer.legend === undefined || layer.legend) {
                var variableLegend = L.control({
                    position: 'bottomright'
                });
                variableLegend.onAdd = this.addLegend.bind(this, layer);

                variableLegend.onRemove = this.removeLegend.bind(this, layer);
                layer.timeLayer.legend = variableLegend;
            }
            if (layer.visible) {
                layer.timeLayer.addTo(this.map);
            }
        }
    }
};

MapGT.prototype.getLayerMinMax = function(layer, callback) {
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

MapGT.prototype.getMap = function() {
    return this.map;
};

MapGT.prototype.createMap = function(map) {
    var baseMaps = {};
    if (map) {
        this.map = map;
    } else {
        var mapOptions = {
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: 'topright'
              },
            timeDimension: true,
            // timeDimensionControl: true,
            center: [39.4, 2.9],
            zoom: 6
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

            this.baseMaps = {
                //"Emodnet bathymetry": bathymetryGroupLayer,
                "OSM": osmLayer
            };
        } else {
            for (var baselayer in this.baseMaps) {
                this.baseMaps[baselayer].addTo(this.map);
                break;
            }
        }
        L.control.coordinates({
            position: "bottomleft",
            decimals: 3,
            labelTemplateLat: "Latitude: {y}",
            labelTemplateLng: "Longitude: {x}",
            useDMS: true,
            enableUserInput: false
        }).addTo(this.map);
    }
    var overlayMaps = [];


    var baseLayers = [
        {
            active: false,
            name: "OpenStreetMap",
            icon:iconByName("base-layer"),
            layer: osmLayer
        },{
            active: true,
            name: "Emodnet Bathymery",
            icon:iconByName("base-layer"),
            layer: bathymetryGroupLayer
        }
    ];



    this.layerControl = new L.Control.PanelLayers(baseLayers, overlayMaps, {collapsed: true, position: 'topleft'});
    this.map.addControl(this.layerControl)

    this.map.on('layeradd', function(eventLayer) {
        if (eventLayer.layer.legend) {
            eventLayer.layer.legend.addTo(this);
        }
    });

    this.map.on('layerremove', function(eventLayer) {
        if (eventLayer.layer.legend) {
            this.removeLayer(eventLayer.layer.legend);
            eventLayer.layer.legend.onRemove();
        }
    });

    if (!this.map.timeDimension) {
        this.map.timeDimension = L.timeDimension({});
    }
};


MapGT.prototype.addLegend = function(layer, map) {
    var div_wrapper = L.DomUtil.get('legend-wrapper');
    if (!div_wrapper) {
        div_wrapper = L.DomUtil.create('div', 'legend-wrapper');
        /* div_wrapper.id = "legend-wrapper";*/
    }
    var styles = layer.params.styles;
    var palette = styles.substring(styles.indexOf('/') + 1);
    var colorscalerange = layer.params.colorscalerange || 'default';
    var div = L.DomUtil.create('div', 'info legend-div', div_wrapper);
    div.id = "legend-" + layer.params.layers;
    if (colorscalerange == 'auto') {
        // TODO: get colorscalerange
        return div_wrapper;
    }
    if (layer.legendHTML) {
        div.innerHTML = layer.legendHTML.apply();
    } else {
        var src = layer.url + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&TRANSPARENT=true&LAYER=" + layer.params.layers + "&PALETTE=" + palette + "&COLORSCALERANGE=" + colorscalerange;
        if (layer.params.numcolorbands) {
            src += '&numcolorbands=' + layer.params.numcolorbands;
        }
        div.innerHTML +=            
            '<img class="legend-img" src="' + src + '" alt="legend" style="height: 220px;">';
    }

    return div_wrapper;
};

MapGT.prototype.removeLegend = function(layer, map) {
    var div = L.DomUtil.get("legend-" + layer.params.layers);
    div.remove();
    return;
};

MapGT.prototype.removeLayer = function(layerName) {
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