import { __addClass, __remove, __hasClass, __removeClass, __toggleClass } from './lib/utils/utils';
import geoJsonMdhData from '../../temp/data_maps_merged.json';
import { MarkerClusterGroup } from 'leaflet.markercluster/src';

import Glide, { Controls } from '@glidejs/glide/dist/glide.modular.esm';

const domLoad = () => {

  console.log('domLoad');


  const d = document;
  const $body = d.body;


  let currentPage;
  let previousPage;

  let store = {
    page: {},
    data: {},
    markers: {}
  };

  // variables
   // map detail
 const $mapDetailView = document.querySelector('[data-component="map-detail-view"]');
 const $mapDetailFilter = document.querySelector('[data-component="filter"]');
 const $mapDetailFilterSwitch = document.querySelector('.filter-button-switch');

  // map view switch
  const $mapViewSwitch = document.querySelector('[data-component="view-switch"]');
  const $mapViewSwitchLinks = $mapViewSwitch.querySelectorAll('.item');

  const $mapbox = document.querySelector('[data-component="mapbox"]'); /*:TODO: currently working with only one mapbox per page */
  const $listViewContainer = document.querySelector('[data-component="list-view-container"]');
  const $listView = document.querySelector('[data-component="list-view"]');


  // functions
  ////////////////////////////////////////////////////////////

  const enableAllInactiveMarkers = () => {

    const $markers = document.querySelectorAll('.mdh-map-icon');
    Array.from($markers).forEach( ($marker) => {

      __removeClass($marker.parentElement, 'inactive');

    });

  };

  const disableAllInactiveMarkers = () => {

    const $markers = document.querySelectorAll('.mdh-map-icon');
    Array.from($markers).forEach( ($marker) => {

      __addClass($marker.parentElement, 'inactive');

    });

  };

  const disableAllActiveMarkers = () => {

    const $markers = document.querySelectorAll('.leaflet-marker-icon.active');
    Array.from($markers).forEach( ($marker) => {

      __removeClass($marker, 'active');

    });

  };

  const closeAllLeafletTooltips = () => {

    const $tooltips = document.querySelectorAll('.leaflet-popup');
    Array.from($tooltips).forEach( ($item) => {
      $item.remove();
    });

  };

  const cardDetailOpen = (cardProperties, fromMarker = false) => {

    const $activeCardDetail = document.querySelector(`[data-object-detail-id]:not(.is-hidden)`);

    if ($activeCardDetail) {
      __addClass($activeCardDetail, 'is-hidden');
    }

    const $cardDetail = document.querySelector(`[data-object-detail-id="${cardProperties.objectId}"]`);

    previousPage = window.location;
    history.replaceState(null, cardProperties.objectId, `?objekt=${cardProperties.objectId}`);

    /// save scroll position so that we can return back to it once detail is closed
    store.page.scrollTopPositionBeforeDetailOpen = $listViewContainer.scrollTop;
    $listViewContainer.scrollTop = 0;

    // prepare list view container for showing the object detail
    __addClass($listViewContainer, 'inactive');


    // open leafLeft marker popup
    disableAllInactiveMarkers();

    const $activeMarker = document.querySelector(`[data-marker-id="${cardProperties.objectId}"]`).parentElement;
    __removeClass($activeMarker, 'inactive');
    __addClass($activeMarker, 'active');


    //store.markers[cardProperties.objectId].openPopup();
    store.map.setView(store.markers[cardProperties.objectId].getLatLng(), 7);

    // close btn handler
    if (!__hasClass($cardDetail, 'has-handler-close')) {

      const $closeBtn = $cardDetail.querySelector('[data-component="close"]');
      $closeBtn.addEventListener('click', (e) => {

        e.stopPropagation();
        e.preventDefault();

        cardDetailClose($cardDetail);

        return false;
      });
      __addClass($cardDetail, 'has-handler-close');

    }


    __removeClass($cardDetail, 'is-hidden');


    // active gallery

    if (!__hasClass($cardDetail, 'has-gallery-init')) {

      const $thisCardMainGallery = $cardDetail.querySelector('[data-component="gallery-detail"]');

      if ($thisCardMainGallery) {

        // the object has images

        const glide = new Glide($thisCardMainGallery, {
          type: 'carousel',
          startAt: 0,
          perView: 1
        }).mount({ Controls });

        // init gallery
        const lightbox = GLightbox({
          touchNavigation: true,
          loop: true,
          autoplayVideos: false
        });


        __addClass($cardDetail, 'has-gallery-init');

      }

    }

  };

  const cardDetailClose = ($cardDetailObj) => {

    closeAllLeafletTooltips();

    history.replaceState(null, '', previousPage);

    __removeClass($listViewContainer, 'inactive');

    $listViewContainer.scrollTop = store.page.scrollTopPositionBeforeDetailOpen;
    console.log("after close, scroll position", store.page.scrollTopPositionBeforeDetailOpen);

    __toggleClass($cardDetailObj, 'is-hidden');

    enableAllInactiveMarkers();
    disableAllActiveMarkers();

  };

  const getHTMLforLeafletPopup = (feature) => {

    const html = `
          <div id="popup-${feature.properties.name}" class="map-popup">
          <h1 class="popup-layer-title">${feature.properties.name}</h1>
          <div class="popup-layer-tag">
            <div class="meta meta-category">
              <span class="text-icon">#</span>
              <span class="text-content">${feature.properties.layer}</span>
            </div>
          </div>
        `;

    return html;

  };


  ////////////////////////////////////////////////////////////



  // we have mapbox item, initialize Leafleft and Mapbox
  // find map DOM objects and initialize them through Leaflet
  if ($mapbox) {

    const mymap = L.map('mapbox', {zoomControl: true}).setView([50.08804, 14.42076], 7); /* :TODO: automatize setting the centre of a map via JSON */
    store.map = mymap;

    const markerClusters = L.markerClusterGroup();

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      attribution: 'Mapová data ÚSTR | Podkladová mapa &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      tileSize: 512,
      maxZoom: 15,
      zoomOffset: -1,
      id: 'jakubferenc/ckfnqth7411u319o31xieiy4n',
      accessToken: 'pk.eyJ1IjoiamFrdWJmZXJlbmMiLCJhIjoiY2tjbTNjbDI2MW01NzJ5czUzNGc0Y3FwNyJ9.bTpq3aGIwEIUqRkxlMOvCw',
      }).addTo(mymap);


    const thisMapSlug = $mapbox.dataset.slug;
    const places = geoJsonMdhData[thisMapSlug];

      //vytvoří skupinu s vrstvou  bez klastrů
    let vrstvaPlaces = L.geoJSON(places, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(getHTMLforLeafletPopup(feature));
      },
      pointToLayer: function (feature, latlng) {

          let classNamesArray = ['mdh-map-icon'];
          classNamesArray = [...classNamesArray, feature.properties.type]; // the type comes form the GeoJSON of places

          const thisMarker = L.marker(latlng, {icon: L.divIcon({
            className: '',
            html: `
              <div style="background-color: ${places.mapSettings.layers[feature.properties.layer].color}"
                  class="${classNamesArray.join(' ')}"
                  aria-label="${feature.properties.name}"
                  data-marker-id="${feature.properties.name}"
                  data-marker-type="${feature.properties.type}"
                  data-marker-layer="${feature.properties.layer}">
              </div>`,
            iconSize: 'auto',
            riseOnHover: true,
          })});

          thisMarker.on('mouseover', (e) => {

            thisMarker.openPopup();

          });

          thisMarker.on('mouseout', (e) => {

            thisMarker.closePopup();

          });

          thisMarker.on('contextmenu', () => {return false;})

          thisMarker.on('click', (e) => {

            cardDetailOpen({objectId: e.target.feature.properties.name});

            thisMarker.setZIndexOffset(30);
            thisMarker.openPopup();
            e.preventDefault();
            e.stopImmediatePropagation();

          });

          store.markers[feature.properties.name] = thisMarker;

          markerClusters.addLayer( thisMarker );

          return thisMarker;

      },
  });

  const placesGroup = L.layerGroup([vrstvaPlaces]);
  placesGroup.addTo(mymap);

    // mymap.addLayer( markerClusters );

  }


  $mapDetailFilterSwitch.addEventListener('click', (e) => {
    __toggleClass($mapDetailFilter, 'open');
  });

  Array.from($mapViewSwitchLinks).forEach($item => {

    $item.addEventListener('click', (e) => {

      const viewSwitchAction = e.currentTarget.getAttribute('rel');

      $mapDetailView.setAttribute('data-mode', `${viewSwitchAction}`);

      if (viewSwitchAction === 'default') {

        store.map.invalidateSize();

      }

      if (viewSwitchAction === 'map') {

        store.map.invalidateSize();

      }

      __removeClass(Array.from($mapViewSwitchLinks), 'active');
      __addClass(e.currentTarget, 'active');

    });

  });

  // card detail

  // cards

  const $cards = document.querySelectorAll('[data-component="card"]');

  Array.from($cards).forEach( ($card) => {

    $card.addEventListener('click', (e) => cardDetailOpen($card.dataset));

  });


  // filter

  let activeFilterItems = {
    "categories": [],
    "types": []
  };

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
