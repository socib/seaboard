(function() {
  var _ref,
    __bind = function(fn, me) {
      return function() {
        return fn.apply(me, arguments);
      };
    },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) {
      for (var key in parent) {
        if (__hasProp.call(parent, key)) child[key] = parent[key];
      }

      function ctor() {
        this.constructor = child;
      }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
      child.__super__ = parent.prototype;
      return child;
    };

  var colorPalette = ["#000080", "#0000f1", "#0063ff", "#00d4ff", "#47ffb8", "#b8ff47", "#ffd500", "#ff6300", "#f10000", "#800000"];

  Dashing.Vesselmap = (function(_super) {
    __extends(Vesselmap, _super);

    function Vesselmap() {
      this.showMap = __bind(this.showMap, this);
      _ref = Vesselmap.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Vesselmap.prototype.ready = function() {
      // init some options
      this.endPoint_options = {
        onEachFeature: function(feature, layer) {
          layer.bindPopup(feature.properties.html);
        },
        pointToLayer: function(feature, latlng) {
          var ii = L.icon({
            iconUrl: '/static/widgets/vesselmap/images/icon-vessel.png',
            iconSize: [25, 25],
            iconAnchor: [12, 12],
            popupAnchor: [0, -15],

          });
          return L.marker(latlng, {
            icon: ii,
            title: feature.geometry.coordinates.join(',')
          });
        }
      };


      this.showMap();
      setInterval(this.showMap, 60000 * 30); // refresh every 30 minutes
    };

    Vesselmap.prototype.onData = function(data) {
      if (!this.trajectory_layer) {
        return;
      }
      if (data.error) {
        return;
      }
      var layers = this.trajectory_layer.getLayers();
      var last_layer = layers[layers.length - 1];
      var coordinates = last_layer.feature.geometry.coordinates;
      var last_coordinates = coordinates[coordinates.length - 1];
      if (last_coordinates[0] != data.long && last_coordinates[1] != data.lat) {
        var currentValue = null;
        var parameter = this.activeParameter;
        try {
          if (parameter == 'salinidad') {
            currentValue = lastTermosal['sea_water_salinity'];
          } else if (parameter == 'temperatura') {
            currentValue = lastTermosal['sea_water_temperature'];
          } else if (parameter == 'fluor') {
            currentValue = lastTermosal['fluor'];
          }
        } catch (Exception) {
        }

        var geojsonFeature = {
          "type": "Feature",
          "properties": {
            "name": "New position at " + data.time,
            "time": data.time
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              last_coordinates, [data.long, data.lat]
            ]
          }
        };
        geojsonFeature['properties'][parameter] = currentValue;
        this.trajectory_layer.addData(geojsonFeature);
        // Move marker
        geojsonFeature = {
          "type": "Feature",
          "properties": {
            "name": "New position at " + data.time,
            "html": "<div class=\"popup_content\"><strong>time</strong>: " + data.time + "<br/><strong>position</strong>: N" + data.lat + " E" + data.long + "     <br/><strong>speed</strong>: " + data.speed + " m s-1 <br/><strong>depth</strong>: " + data.depth + " m <br/><strong>speed OG</strong>: " + data.sog + " m s-1 <br/><strong>course OG</strong>: " + data.cog + " degree</div>"
          },
          "geometry": {
            "type": "Point",
            "coordinates": [data.long, data.lat]
          }
        };
        this.lastPosition(geojsonFeature);
        this.map.fitBounds(this.trajectory_layer.getBounds());
      }
    };

    Vesselmap.prototype.showMap = function() {

      if (this.map) {
        this.map.remove();
        $(this.node).append('<div class="map"></div>');
      }

      this.map = L.map($(this.node).find('.map').get(0), {
        center: [39.59, 2.74],
        zoom: 7,
        crs: L.CRS.EPSG3857,
        thermosalParametersControl: true,
      });
      this.map.vesselmap = this;

      var continentsLayer = L.tileLayer('/static/map/tiles-continents/{z}/{x}/{y}.png', {
        maxZoom: 12
      });
      var bathymetryLayer = L.tileLayer('/static/map/tiles-bathymetry/{z}/{x}/{y}.png', {
        maxZoom: 12
      });
      var baseMaps = {
          "Continents": continentsLayer,
          "Bathymetry": bathymetryLayer
      };
      L.control.layers(baseMaps).addTo(this.map);
      continentsLayer.addTo(this.map);

      L.control.coordinates({
        position: "bottomleft",
        decimals: 3,
        labelTemplateLat: "Latitude: {y}",
        labelTemplateLng: "Longitude: {x}",
        useDMS: true,
      }).addTo(this.map);

      this.loadTrajectory('temperatura');
      $('.leaflet-control-thermosal-parameters.temperatura').addClass('active');

    };

    Vesselmap.prototype.loadTrajectory = function(parameter) {

      if (this.trajectory_layer) {
        this.map.removeLayer(this.trajectory_layer);
      }
      this.activeParameter = parameter;
      var trajectoryURL = '/vessel/trajectory.json';
      if (parameter !== null) {
        trajectoryURL = '/vessel/' + parameter + '_trajectory.json';
      }
      $.getJSON(trajectoryURL, (function(featurecollection) {
        if (!featurecollection.features) {
          return;
        }

        // Add last position to the map and remove from featurecollection
        if (featurecollection.features.length > 1) {
          this.lastPosition(featurecollection.features.pop());
        }

        var cl = colorPalette.length - 1;
        this.scaleDomainVariable = [];
        var values = [];
        var value;
        for (var i = 0, l = featurecollection.features.length; i < l; i++) {
          value = featurecollection.features[i].properties[parameter];
          if (value != "N/A")
            values.push(value);
        }
        values.sort();
        // set min and max values excluding 5% lower and 8% upper values
        var min = values[Math.round(values.length * 0.05)];
        var max = values[Math.round(values.length * 0.95)];

        for (var i = 0; i <= cl; i++) {
          this.scaleDomainVariable.push((min * (cl - i) + max * i) / cl);
        }

        var colorscale = d3.scale.linear()
          .clamp(true)
          .domain(this.scaleDomainVariable)
          .range(colorPalette);

        var getColor = function(value){
          if (isNaN(value)){
            return "#FFFFFF";
          }else{
            return colorscale(value);
          }
        };

        var getStyle = function(feature) {
          return {
            "color": getColor(feature.properties[parameter]),
            "weight": 3,
            "opacity": 1
          };
        };
        var popUp = function(feature, layer) {
          layer.bindPopup("Time: " + feature.properties.time + "<br/>" + parameter + ": " + feature.properties[parameter]);
        };
        this.trajectory_layer = L.geoJson(featurecollection, {
          style: getStyle,
          onEachFeature: popUp
        });
        this.trajectory_layer.on('mouseover', function(e) {
          e.layer.openPopup();
        });
        this.trajectory_layer.on('mouseout', function(e) {
          e.layer.closePopup();
        });
        this.trajectory_layer.addTo(this.map);
        this.map.fitBounds(this.trajectory_layer.getBounds());
      }).bind(this));
    };

    Vesselmap.prototype.lastPosition = function(feature) {
      if (this.endPoint_layer) {
        this.map.removeLayer(this.endPoint_layer);
      }
      this.endPoint_layer = L.geoJson(
        feature,
        this.endPoint_options);
      this.endPoint_layer.addTo(this.map);
    };

    return Vesselmap;

  })(Dashing.Widget);

}).call(this);