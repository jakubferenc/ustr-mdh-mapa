import { __addClass, __remove, __removeClass, __toggleClass } from './lib/utils/utils';
import geoJsonMdhData from '../../data-maps/topografie-pameti-julius-fucik.json';


const domLoad = () => {

  console.log('domLoad');

  const d = document;
  const $body = d.body;

  const mymap = L.map('mapbox', {zoomControl: false}).setView([50.08804, 14.42076], 7);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Mapová data ÚSTR | Podkladová mapa &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    maxZoom: 15,
    zoomOffset: -1,
    id: 'jakubferenc/ckfnqth7411u319o31xieiy4n',
    accessToken: 'pk.eyJ1IjoiamFrdWJmZXJlbmMiLCJhIjoiY2tjbTNjbDI2MW01NzJ5czUzNGc0Y3FwNyJ9.bTpq3aGIwEIUqRkxlMOvCw',
    }).addTo(mymap);

  //vytvoří proměnou s daty
  var places = geoJsonMdhData;

  var geojsonMarkerOptionsDefault = {
      radius: 30,
      weight: 0,
      opacity: 1,
      fillOpacity: 1,
      border: 0,
      stroke: "white",
      className: "testClass"
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
        layer.bindPopup(`<div id="popup-${feature.properties.Name}" class="map-popup"><h1 class="popup-layer-title">${feature.properties.Name}<div class="popup-layer-tag"><div class="meta meta-category"><span class="text-icon">#</span><span class="text-content">${feature.properties.layer}</span></div></div>`);

      },
      pointToLayer: function (feature, latlng) {

          return L.circleMarker(latlng, {...geojsonMarkerOptionsDefault, ...markerStyles[feature.properties.layer]});

      },
  });
  var placesGroup = L.layerGroup([vrstvaPlaces]);
  placesGroup.addTo(mymap);


  // map detail
  const $mapDetailView = document.querySelector('[data-component="map-detail-view"]');
  const $mapDetailFilter = document.querySelector('[data-component="filter"]');
  const $mapDetailFilterSwitch = document.querySelector('.filter-button-switch');
  $mapDetailFilterSwitch.addEventListener('click', (e) => {
    __toggleClass($mapDetailFilter, 'open');
  });

  // map view switch
  const $mapViewSwitch = document.querySelector('[data-component="view-switch"] ');
  const $mapViewSwitchLinks = $mapViewSwitch.querySelectorAll('.item');

  const $mapbox = document.getElementById('mapbox');
  const $listViewContainer = document.querySelector('.list-view-container');

  Array.from($mapViewSwitchLinks).forEach($item => {

    $item.addEventListener('click', (e) => {

      const viewSwitchAction = e.currentTarget.getAttribute('rel');

      $mapDetailView.setAttribute('data-mode', `${viewSwitchAction}`);

      if (viewSwitchAction === 'default') {

        mymap.invalidateSize();

      }

      if (viewSwitchAction === 'map') {

        mymap.invalidateSize();

      }

      __removeClass($mapViewSwitchLinks, 'active');
      __addClass(e.currentTarget, 'active');

    });

  });

  // card detail
  const $cardDetail = document.querySelectorAll('[data-component="card-detail"]');

  Array.from($cardDetail).forEach( ($item) => {

    console.log($cardDetail);

    const $closeBtn = $item.querySelector('[data-component="close"]');
    $closeBtn.addEventListener('click', (e) => {

      __toggleClass($item, 'is-hidden');

    });

  });


  // cards

  const $cards = document.querySelectorAll('[data-component="card"]');

  Array.from($cards).forEach( ($card) => {

    $card.addEventListener('click', (e) => {

      const $cardDetail = document.querySelector('[data-component="card-detail"]');

      __toggleClass($cardDetail, 'is-hidden');

    });

  });

};


export default domLoad;
