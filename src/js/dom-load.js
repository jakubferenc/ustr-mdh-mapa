import { __addClass, __remove, __hasClass, __removeClass, __toggleClass } from './lib/utils/utils';
import geoJsonMdhData from '../../data-maps/topografie-pameti-julius-fucik.json';


const domLoad = () => {

  console.log('domLoad');

  const d = document;
  const $body = d.body;

  const mymap = L.map('mapbox', {zoomControl: false}).setView([50.08804, 14.42076], 7);

  let currentPage = undefined;
  let previousPage = undefined;

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Mapová data ÚSTR | Podkladová mapa &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    maxZoom: 15,
    zoomOffset: -1,
    id: 'jakubferenc/ckfnqth7411u319o31xieiy4n',
    accessToken: 'pk.eyJ1IjoiamFrdWJmZXJlbmMiLCJhIjoiY2tjbTNjbDI2MW01NzJ5czUzNGc0Y3FwNyJ9.bTpq3aGIwEIUqRkxlMOvCw',
    }).addTo(mymap);

  //vytvoří proměnou s daty
  const places = geoJsonMdhData;


  //vytvoří skupinu s vrstvou  bez klastrů
  let vrstvaPlaces = L.geoJSON(places, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`
          <div id="popup-${feature.properties.name}" class="map-popup">
          <h1 class="popup-layer-title">${feature.properties.name}</h1>
          <div class="popup-layer-tag">
            <div class="meta meta-category">
              <span class="text-icon">#</span>
              <span class="text-content">${feature.properties.layer}</span>
            </div>
          </div>
        `);
      },
      pointToLayer: function (feature, latlng) {

          let classNamesArray = ['mdh-map-icon'];
          classNamesArray = [...classNamesArray, feature.properties.type]; // the type comes form the GeoJSON of places

          const thisMarker = L.marker(latlng, {icon: L.divIcon({
            className: '',
            html: `<div style="background-color: ${places.mapSettings.layers[feature.properties.layer].color}" class="${classNamesArray.join(' ')}" aria-label="${feature.properties.name}" data-marker-type="${feature.properties.type}"  data-marker-layer="${feature.properties.layer}"></div>`,
            iconSize: 'auto',
            riseOnHover: true,
            click: function(e) {
              alert("dsd");
            }
          })});

          return thisMarker;

      },
  });
  const placesGroup = L.layerGroup([vrstvaPlaces]);
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

    const $closeBtn = $item.querySelector('[data-component="close"]');
    $closeBtn.addEventListener('click', (e) => {

      history.replaceState(null, '', previousPage);

      __toggleClass($item, 'is-hidden');

    });

  });


  // cards

  const $cards = document.querySelectorAll('[data-component="card"]');

  Array.from($cards).forEach( ($card) => {

    const cardId = $card.dataset.objectId;

    $card.addEventListener('click', (e) => {

      const $cardDetail = document.querySelector(`[data-object-detail-id="${cardId}"]`);

      previousPage = window.location;
      history.replaceState(null, $card.dataset.objectName, `?objekt=${$card.dataset.objectName}`);

      __removeClass($cardDetail, 'is-hidden');

    });

  });


  // filter

  let activeFilterItems = {
    "categories": [],
    "types": []
  }

  const isHiddenClassName = 'is-hidden';


  const filterLayers = (layerName) => {

    const $allObjects = document.querySelectorAll(`[data-object-layer]`);
    const $allMarkers = document.querySelectorAll(`[data-marker-layer]`);

    let showAll = false;

    // edit active filter items
    if (activeFilterItems.categories.includes(layerName)) {
      activeFilterItems.categories = activeFilterItems.categories.filter( (item) => item !== layerName);
    } else {
      activeFilterItems.categories = [...activeFilterItems.categories, layerName];
    }

    // check if we are supposed to do filtering (an item is selected, if not show all)
    if (activeFilterItems.categories.length === 0) {
      __removeClass($allObjects, isHiddenClassName);
      __removeClass($allMarkers, isHiddenClassName);

      return;
    }

    Array.from($allObjects).forEach( (item) => {

      const thisItemLayerName = item.dataset.objectLayer;

      if ( !activeFilterItems.categories.includes(thisItemLayerName) ) {
        __addClass(item, isHiddenClassName);
      } else {
        __removeClass(item, isHiddenClassName);
      }


    });

    Array.from($allMarkers).forEach( (item) => {

      const thisItemLayerName = item.dataset.markerLayer;

      if ( !activeFilterItems.categories.includes(thisItemLayerName) ) {
        __addClass(item, isHiddenClassName);
      } else {
        __removeClass(item, isHiddenClassName);
      }

    });


  };

  const filterTypes = (typeName) => {

    const $allObjects = document.querySelectorAll(`[data-object-type]`);
    const $allMarkers = document.querySelectorAll(`[data-marker-type]`);

    let showAll = false;

    // edit active filter items
    if (activeFilterItems.types.includes(typeName)) {
      activeFilterItems.types = activeFilterItems.types.filter( (item) => item !== typeName);
    } else {
      activeFilterItems.types = [...activeFilterItems.types, typeName];
    }

    // check if we are supposed to do filtering (an item is selected, if not show all)
    if (activeFilterItems.types.length === 0) {
      __removeClass($allObjects, isHiddenClassName);
      __removeClass($allMarkers, isHiddenClassName);

      return;
    }

    Array.from($allObjects).forEach( (item) => {

      const thisItemTypeName = item.dataset.objectType;

      if ( !activeFilterItems.types.includes(thisItemTypeName) ) {
        __addClass(item, isHiddenClassName);
      } else {
        __removeClass(item, isHiddenClassName);
      }


    });

    Array.from($allMarkers).forEach( (item) => {

      const thisItemTypeName = item.dataset.markerType;

      if ( !activeFilterItems.types.includes(thisItemTypeName) ) {
        __addClass(item, isHiddenClassName);
      } else {
        __removeClass(item, isHiddenClassName);
      }

    });


  };

  const $mapDetailFilterItemsLayer = $mapDetailFilter.querySelectorAll('[data-filter-layer]');
  const $mapDetailFilterItemsType = $mapDetailFilter.querySelectorAll('[data-filter-type]');

  Array.from($mapDetailFilterItemsLayer).forEach( ($item) => {

    $item.addEventListener('click', (e) => {

      const layerName = $item.dataset.filterLayer;

      if (!__hasClass($item, 'active')) {
        __addClass($item, 'active');
      } else {
        __removeClass($item, 'active');

      }

      filterLayers(layerName);


    });

  });

  Array.from($mapDetailFilterItemsType).forEach( ($item) => {

    $item.addEventListener('click', (e) => {

      const typeName = $item.dataset.filterType;

      if (!__hasClass($item, 'active')) {
        __addClass($item, 'active');
      } else {
        __removeClass($item, 'active');

      }

      filterTypes(typeName);

      e.stopImmediatePropagation();
      e.preventDefault();
      return false;

    });

  });

};


export default domLoad;
