import { __toggleClass } from './lib/utils/utils';
import geoJsonMdhData from './data-mdh.json';


const domLoad = () => {

  console.log('domLoad');

  const d = document;
  const $body = d.body;

  const mymap = L.map('mapbox', {zoomControl: false}).setView([50.08804, 14.42076], 7);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Podkladová mapa &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    maxZoom: 15,
    zoomOffset: -1,
    id: 'jakubferenc/ckfnqth7411u319o31xieiy4n',
    accessToken: 'pk.eyJ1IjoiamFrdWJmZXJlbmMiLCJhIjoiY2tjbTNjbDI2MW01NzJ5czUzNGc0Y3FwNyJ9.bTpq3aGIwEIUqRkxlMOvCw',
    }).addTo(mymap);



  //vytvoří proměnou s daty
  var places = geoJsonMdhData;

  var geojsonMarkerOptionsDefault = {
      radius: 8,
      weight: 0,
      opacity: 1,
      fillOpacity: 1,
      border: 0,
      stroke: "white",
  };

  var markerStyles = {
      "Ulice": {
          fillColor: "#99D0FA",
      },
      "Přírodní monumenty": {
          fillColor: "#FAED63",
      },
      "Podniky a pracovní kolektivy": {
          fillColor: "#EECBEC",
      }
  };

  //vytvoří skupinu s vrstvou  bez klastrů
  let vrstvaPlaces = L.geoJSON(places, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup('<span class="jmenoobeti">' + feature.properties.Name + '</span><br>' + '<p class="description">' + feature.properties.description + '</p>' + '<div class="popup-layer-tag">Vrstva: ' + feature.properties.layer + '</div>');
      },
      pointToLayer: function (feature, latlng) {

          return L.circleMarker(latlng, {...geojsonMarkerOptionsDefault, ...markerStyles[feature.properties.layer]});

      },
  });
  var placesGroup = L.layerGroup([vrstvaPlaces]);
  placesGroup.addTo(mymap);


  // map detail
  const $mapDetailFilter = document.querySelector('[data-component="filter"]');
  const $mapDetailFilterSwitch = document.querySelector('.filter-button-switch');
  $mapDetailFilterSwitch.addEventListener('click', (e) => {
    __toggleClass($mapDetailFilter, 'open');
  });

};


export default domLoad;
