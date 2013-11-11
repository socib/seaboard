(function() {
  var map = L.map('map', {
    center: [39.59, 2.74],
    zoom: 7,
    crs: L.CRS.EPSG3857
  });

  L.tileLayer('/static/map/tiles/{z}/{x}/{y}.png', {
    maxZoom: 12
  }).addTo(map);

  L.control.coordinates().addTo(map);


  $.getJSON('/vessel/trajectory.json', function(featurecollection) {
    var myStyle = {
      "color": "#ff7800",
      "weight": 3,
      "opacity": 1
    };
    L.geoJson(featurecollection.features[0], {
      style: myStyle
    }).addTo(map);

    L.geoJson(featurecollection.features[1], {
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
    }).addTo(map);
  });

}).call(this);