OpenLayersRadar = {
    PATH: "facilities/radar/",

    BASE_MEDIA_PATH: 'files/images_iconos/',

    map: null,

    aControls: [],

    selectedFeature: null,

    selectControl: null,

    Map: {

        bounds: '',

        totalDeployments: null,

        deploymentList: new Array(),

        jWebChartLink: {},

        hfRadarWms: null,

        currentWMSLayerDateStr: null,
        currentTimeIndex: -1,
        container: null,
        capability_layer: null,

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

            var osmLayer = new OpenLayers.Layer.OSM();

            return [socibLayer];
        },
        updateBBox: function(newBBox) {

        },
        //        onLayerClick: function (event){
        //            console.log('Esta es la mierdaaaaaaaaa');
        //        },
        init: function(ndaysParam, container) {
            if (typeof ndaysParam == 'undefined')
                ndaysParam = -1;
            var lon = 0.97302341796873;
            var lat = 38.619735195313;
            var zoom = 9;

            var epsg3857Projection = new OpenLayers.Projection("EPSG:3857");
            var epsg4326Projection = new OpenLayers.Projection("EPSG:4326");

            var options = {
                projection: epsg4326Projection,
                displayProjection: epsg4326Projection
            };

            OpenLayersRadar.map = new OpenLayers.Map(container, options);
            OpenLayersRadar.Map.container = container;

            //Loading all the avaible layers
            var layersArray = OpenLayersRadar.Map.loadLayers();
            OpenLayersRadar.map.addLayers(layersArray);

            //Icon markers
            var markers = new OpenLayers.Layer.Markers("Markers");
            OpenLayersRadar.map.addLayer(markers);

            var size = new OpenLayers.Size(30, 30);
            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
            var icon = new OpenLayers.Icon('http://socib.es/files/images_iconos/radar_map.png', size, offset);

            //Galfi marker
            markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(1.211198, 38.94933), icon));
            //Form marker
            markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(1.39050, 38.65544), icon.clone()));


            //  map.addControl(new OpenLayers.Control.LayerSwitcher());
            OpenLayersRadar.map.zoomToMaxExtent();

            var wms_server = "http://thredds.socib.es/thredds/wms/hf_radar/hf_radar_ibiza-scb_codarssproc001/L1/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_latest.nc";

            /*OpenLayersRadar.Map.hfRadarWms = [new OpenLayers.Layer.WMS(
                "Sea water velocity",
                wms_server, {
                transparent: 'true',
                format: "image/png",
                layers: "sea_water_velocity",
                projection: "EPSG:4326",
                styles: 'linevec/ferret'

            }), new OpenLayers.Layer.WMS(
                "Sea water velocity",
                wms_server, {
                transparent: 'true',
                format: "image/png",
                layers: "sea_water_velocity",
                projection: "EPSG:4326",
                styles: 'vector/ferret'

            })];


            OpenLayersRadar.map.addLayer(OpenLayersRadar.Map.hfRadarWms[0]);
            OpenLayersRadar.map.addLayer(OpenLayersRadar.Map.hfRadarWms[1]);
            OpenLayersRadar.Map.hfRadarWms[1].setVisibility(false);*/

            // urlRadarImg = 'http://thredds.socib.es/thredds/wms/observational/hf_radar/hf_radar_ibiza-scb_codarssproc001_aggregation/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_agg.nc?REQUEST=GetMap&VERSION=1.3.0&STYLES=linevec/ferret&CRS=CRS:84&WIDTH=512&HEIGHT=512&FORMAT=image/gif&TRANSPARENT=true&LAYERS=sea_water_velocity&BBOX=-0.2,38.1,2.0,39.2&TIME=2013-06-26T00%3A00%3A00.000Z%2F2013-06-26T11%3A00%3A00.000Z';

            urlRadarImg =  '/radar/galfi/animation.gif'

            var options = {
                //numZoomLevels: 15,
                isBaseLayer: false,
                maxResolution: "auto",
                resolutions: OpenLayersRadar.map.layers[0].resolutions,
                projection: OpenLayersRadar.map.getProjectionObject(),
                strategies: [new OpenLayers.Strategy.Fixed()],
                displayInLayerSwitcher: true
            };

            OpenLayersRadar.Map.hfRadarImg = new OpenLayers.Layer.Image(
                'Sea water velocity',
                urlRadarImg,
                new OpenLayers.Bounds(-0.2, 38.1, 2.0, 39.2),
                new OpenLayers.Size(512, 512), options);
            OpenLayersRadar.map.addLayer(OpenLayersRadar.Map.hfRadarImg);
            OpenLayersRadar.map.addControl(new OpenLayers.Control.LayerSwitcher());

            
            var newCenterProjected = new OpenLayers.LonLat(lon, lat);
            OpenLayersRadar.map.setCenter(newCenterProjected, zoom);



            $.get('/radar/eiv/capabilities', function(response) {
                var capabilities = new OpenLayers.Format.WMSCapabilities().read(response);
                for (var i = 0, len = capabilities.capability.layers.length; i < len; i++) {
                    var layerObj = capabilities.capability.layers[i];
                    if (layerObj.name === 'sea_water_velocity') {
                        OpenLayersRadar.Map.capability_layer = layerObj;
                        break;
                    }
                }
                //setInterval(OpenLayersRadar.Map.nextTime, 3000); // every 2 seconds
                url = 'http://thredds.socib.es/thredds/wms/observational/hf_radar/hf_radar_ibiza-scb_codarssproc001_aggregation/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_agg.nc?REQUEST=GetMap&VERSION=1.3.0&STYLES=linevec/ferret&CRS=CRS:84&WIDTH=256&HEIGHT=256&FORMAT=image/gif&TRANSPARENT=true&LAYERS=sea_water_velocity&BBOX=-0.2,38.1,2.0,39.2&TIME=2013-06-26T00%3A00%3A00.000Z%2F2013-06-26T11%3A00%3A00.000Z';

            });


        },
        nextTime: function() {
            var timeIndex = OpenLayersRadar.Map.currentTimeIndex;
            timeIndex++;
            timeIndex = timeIndex % 24;
            OpenLayersRadar.Map.currentTimeIndex = timeIndex;

            var layerIndex = timeIndex % 2;
            // show new layer and hide current layer            
            /*OpenLayersRadar.Map.hfRadarWms[layerIndex].setVisibility(false);
            OpenLayersRadar.Map.hfRadarWms[(layerIndex+1)%2].setVisibility(true);


            timeIndex= OpenLayersRadar.Map.capability_layer.dimensions.time.values.length - 24 + timeIndex;

            var newTime = OpenLayersRadar.Map.capability_layer.dimensions.time.values[timeIndex].trim();
            // OpenLayersRadar.Map.hfRadarWms[layerIndex].mergeNewParams({'time': newTime});
            $(OpenLayersRadar.Map.container).parent().find('.date-label').html(newTime);*/
        },

    }
};