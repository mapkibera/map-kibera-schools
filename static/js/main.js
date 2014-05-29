;

// global leaflet config
L.Icon.Default.imagePath = WEB_ROOT + 'static/img/leaflet';

(function drawMaps() {

  var mapEl,
      data = { 'features': [] },
      geoProperties = {};

  if (mapEl = document.getElementById('main-map')) {
    map = drawMap(mapEl);
    domLoadSchoolDataAll();
    pinAllSchools(map);
  } else if (mapEl = document.getElementById('school-map-display')) {
    map = drawMap(mapEl);
    pinSchool(map);
  } else {
    return;
  }

  function getJSON(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function gotGet() {
      if (request.status >= 200 && request.status < 400) {
        data = JSON.parse(request.responseText);
        callback(data);
      } else {
        console.error('GET failed for url ' + url +
                      '; not running callback ' + callback);
      }
    };
    request.send();
  }

  function drawMap(mapEl) {
    var mapOptions = {
      center: [-1.313, 36.788],
      zoom: 15,
      scrollWheelZoom: false
    };
    var map = L.map(mapEl, mapOptions);
    // todo: switch back to custom tile styles, but base them on HOT.
    L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(map)
    return map;
  }

  function addPropertiesAndValues(properties, countedProperties) {
    // get all filters and possible values
    u.each(Object.keys(properties), function saveProperty(propertyName) {
      if (! (propertyName in countedProperties)) {
        countedProperties[propertyName] = {};
      }
      var value = properties[propertyName];
      if (! (value in countedProperties[propertyName])) {
        countedProperties[propertyName][value] = 1;
      } else {
        countedProperties[propertyName][value] += 1;
      }
    });
  }

  function fixProperties(propertiesWithCounts) {
    var properties = {};
    u.each(Object.keys(propertiesWithCounts), function collapseObj(propKey) {
      var propKeyArray = [];
      for (key in propertiesWithCounts[propKey]) {
        propKeyArray.push([key, propertiesWithCounts[propKey][key]]);
      }
      properties[propKey] = propKeyArray.sort(function sortProps(a, b) {
        return b[1] - a[1];  // sort desc
      });
    });
    return properties;
  }

  function domLoadSchoolDataAll() {
    var geoSchool,
        countedProperties = {},
        schoolEls = document.querySelectorAll('#schools .school-list > ul > li > a');
    u.eachNode(schoolEls, function loadSchoolData(node) {
      var schoolProperties = JSON.parse(decodeURIComponent(node.dataset.properties));
      addPropertiesAndValues(schoolProperties, countedProperties);
      schoolProperties.name = (node.textContent || el.innerText).trim();
      schoolProperties.href = node.getAttribute('href');
      geoSchool = {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [parseFloat(node.dataset.lat), parseFloat(node.dataset.lng)]
        },
        'properties': schoolProperties
      };
      data.features.push(geoSchool);
    });
    var niceProperties = fixProperties(countedProperties);
    u.extend(geoProperties, niceProperties);
  }

  function pinAllSchools(map) {
    function pinPopup(feature, layer) {
      var href = feature.properties.href,
          name = feature.properties.name;
      var popupContent = '<h3><a href="' + href + '">' + name + '</a></h3>';
      layer.bindPopup(popupContent);
    }
    L.geoJson(data, {onEachFeature: pinPopup}).addTo(map);
  }

  function pinSchool(map) {
    var location = school.geometry.coordinates[0].reverse();
    map.setView([location[0] + 0.0003, location[1]], 18);
    L.marker(location).addTo(map);
  }

  // exports
  window.geoData = data,
  window.geoProperties = geoProperties;

})();
