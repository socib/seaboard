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
      if (!this.trajectory) {
        return;
      }
      var coordinates = this.trajectory.geometry.coordinates;
      var last_coordinates = coordinates[coordinates.length - 1];
      if (last_coordinates[0] != data.long && last_coordinates[1] != data.lat) {
        this.trajectory.geometry.coordinates.push([data.long, data.lat]);
        var geojsonFeature = {
          "type": "Feature",
          "properties": {
            "name": "New position at " + data.datetime
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              last_coordinates, [data.long, data.lat]
            ]
          }
        };
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
        this.map.removeLayer(this.endPoint_layer);
        this.endPoint_layer = L.geoJson(geojsonFeature, this.endPoint_options);
        this.endPoint_layer.addTo(this.map);

        this.map.fitBounds(this.trajectory_layer.getBounds());

        console.log('Map added recieved data');
        console.log(data);
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
        crs: L.CRS.EPSG3857
      });

      L.tileLayer('/static/map/tiles/{z}/{x}/{y}.png', {
        maxZoom: 12
      }).addTo(this.map);

      L.control.coordinates({
        position: "bottomleft",
        decimals: 3,
        labelTemplateLat: "Latitude: {y}",
        labelTemplateLng: "Longitude: {x}"
      }).addTo(this.map);


      $.getJSON('/vessel/trajectory.json', (function(featurecollection) {
        var myStyle = {
          "color": "#ff7800",
          "weight": 3,
          "opacity": 1
        };

        this.trajectory = featurecollection.features[0];
        this.trajectory_layer = L.geoJson(this.trajectory, {
          style: myStyle
        });

        this.trajectory_layer.addTo(this.map);

        this.endPoint_layer = L.geoJson(featurecollection.features[1], this.endPoint_options);

        this.endPoint_layer.addTo(this.map);

        this.map.fitBounds(this.trajectory_layer.getBounds());
      }).bind(this));


    };

    return Vesselmap;

  })(Dashing.Widget);

}).call(this);