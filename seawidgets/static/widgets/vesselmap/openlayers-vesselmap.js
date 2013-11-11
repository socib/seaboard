OpenLayersVesselmap = {
    map: null,

    aControls: [],

    selectedFeature: null,

    selectControl: null,

    Map: {

        container: null,

        loadLayers: function() {
            var lon = 3;
            var lat = 39;
            var zoom = 6;


            var socibLayer = new OpenLayers.Layer.WMS("SOCIB base layer",
                "http://knowseas.socib.es/geowms/gwc/service/wms", {
                    layers: 'gshhs:GSHHS_h_L1',
                    format: 'image/png'
                }, {
                    opacity: 1.0,
                    singleTile: false,
                    isBaseLayer: true,
                    projection: 'EPSG:4326',
                    units: 'degrees',
                    buffer: 0,
                    gutter: 0,
                    transitionEffect: 'resize'
                });
            
            var staticLayer = new OpenLayers.Layer.OSM('osm', '/static/map/tiles/${z}/${x}/${y}.png', {                
                projection: 'EPSG:3857'
            });


            return [staticLayer];
        },
        updateBBox: function(newBBox) {

        },
        init: function(ndaysParam, container) {
            if (typeof ndaysParam == 'undefined')
                ndaysParam = -1;
            var lon = 3;
            var lat = 39;
            var zoom = 6;


            var epsg4326Projection = new OpenLayers.Projection("EPSG:4326");
            var epsg3857Projection = new OpenLayers.Projection("EPSG:3857");

            var options = {
                projection: epsg4326Projection,
                displayProjection: epsg4326Projection
            };

            OpenLayersVesselmap.map = new OpenLayers.Map(container, options);
            OpenLayersVesselmap.Map.container = container;

            //Loading all the avaible layers
            var layersArray = OpenLayersVesselmap.Map.loadLayers();
            OpenLayersVesselmap.map.addLayers(layersArray);

            var newCenterProjected = new OpenLayers.LonLat(lon, lat);
            OpenLayersVesselmap.map.setCenter(newCenterProjected, zoom);

            OpenLayersVesselmap.map.addControl(new OpenLayers.Control.MousePosition());


            $.getJSON('/vessel/trajectory.json', function(featurecollection) {

                var geojsonFormat = new OpenLayers.Format.GeoJSON();
                var featureColor = '#f6b094';


                var startPointStyle = new OpenLayers.StyleMap({
                    fill: true,
                    fillOpacity: 0.6,
                    fillColor: featureColor,
                    strokeColor: featureColor,
                    strokeWidth: 0.5,
                    strokeOpacity: 0.8,
                    strokeDashstyle: 'solid',
                });

                var lineStringStyle = new OpenLayers.StyleMap({
                    strokeColor: featureColor,
                    strokeWidth: 1.0,
                    strokeOpacity: 0.8,
                    strokeDashstyle: 'solid'
                });

                var endPointStyle = new OpenLayers.StyleMap({
                    externalGraphic: '/static/widgets/vesselmap/images/icon-vessel.png',
                    fill: true,
                    fillOpacity: 1.0,
                    fillColor: featureColor,
                    strokeColor: featureColor,
                    strokeDashstyle: 'solid',
                    pointRadius: 15
                });

                if (featurecollection.features != undefined) {
                    var lineString = new OpenLayers.Layer.Vector("Vessel line string", {
                        styleMap: lineStringStyle,
                        preFeatureInsert: function(feature) {
                            feature.geometry.transform(new OpenLayers.Projection("EPSG:4326"), OpenLayersVesselmap.map.getProjectionObject());
                        }
                    });
                    var startPoint = new OpenLayers.Layer.Vector("Vessel deployment position", {
                        styleMap: startPointStyle,
                        preFeatureInsert: function(feature) {
                            feature.geometry.transform(new OpenLayers.Projection("EPSG:4326"), OpenLayersVesselmap.map.getProjectionObject());
                        }
                    });
                    var endPoint = new OpenLayers.Layer.Vector("Vessel latest position", {
                        styleMap: endPointStyle,
                        preFeatureInsert: function(feature) {
                            feature.geometry.transform(new OpenLayers.Projection("EPSG:4326"), OpenLayersVesselmap.map.getProjectionObject());
                        }
                    });

                    OpenLayersVesselmap.map.addLayer(startPoint);
                    OpenLayersVesselmap.map.addLayer(lineString);
                    OpenLayersVesselmap.map.addLayer(endPoint);

                    lineString.addFeatures(geojsonFormat.read(featurecollection.features[0]));
                    startPoint.addFeatures(geojsonFormat.read(featurecollection.features[1]));
                    endPoint.addFeatures(geojsonFormat.read(featurecollection.features[featurecollection.features.length - 1]));
                }

            });
        }
    }
};