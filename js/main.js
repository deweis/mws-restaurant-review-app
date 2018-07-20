/* jshint esversion: 6 */
let restaurants;
let neighborhoods;
let cuisines;
let map;
var markers = [];

/**
* Register the service Worker.
*/
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/sw.js')
    .then(function (reg) {
      console.log('Service Worker registered!');
    }).catch(function (err) {
      console.log('Service Worker not registered: ' + err);
    });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501,
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false,
  });
  addMarkersToMap(); //updateRestaurants();
  google.maps.event.addListenerOnce(self.map, 'idle', function () {
      document.querySelector('iframe').title = 'Google map of the restaurant area';
    });

  document.getElementById('map').removeEventListener('mouseover', initMap);
};

document.getElementById('map').addEventListener('mouseover', initMap);

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  //addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  var myLazyLoad = new LazyLoad();

  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Picture related to the ${restaurant.name} restaurant`;
  li.append(image);

  /* change src to data-src for lazyload of images */
  let src = image.getAttribute('src');
  if (src != '/img/undefined.webp') {      // lazyload not loading the placeholder
    image.removeAttribute('src');
    image.setAttribute('data-src', src);
  }

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const wrapper = document.createElement('div');
  wrapper.setAttribute('class', 'wrapper');
  li.append(wrapper);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  /*more.aria-label = restaurant.name;*/
  more.setAttribute('aria-label', 'View details of ' + restaurant.name);
  wrapper.append(more);

  const favorite = document.createElement('i');
  const isFavorite = restaurant.is_favorite == 'true' ? 'fas' : 'far'; // API PUT converts true into 'true'...
  favorite.setAttribute('id', `rest${restaurant.id}`);
  favorite.setAttribute('class', `${isFavorite} fa-heart fa-3x`);
  favorite.setAttribute('tabindex', '0');
  favorite.setAttribute('role', 'button');
  if (restaurant.is_favorite == 'true') {
    favorite.setAttribute('aria-label', `Unmark ${restaurant.name} as favorite`);
  } else {
    favorite.setAttribute('aria-label', `Mark ${restaurant.name} as favorite`);
  }

  favorite.addEventListener('click', () => {
    const restId = favorite.getAttribute('id');
    toggleFav(restId, restaurant.name);
  });
  favorite.addEventListener('keydown', (e) => {
    if (e.keyCode === 13) { // = enter key
      const restId = favorite.getAttribute('id');
      toggleFav(restId, restaurant.name);
    }
  });
  wrapper.append(favorite);

  return li;
};

toggleFav = (restId, restName) => {
  const element = document.getElementById(restId);
  const setToggle = element.classList.contains('far');
  element.classList.toggle('far');
  element.classList.toggle('fas');
  if (setToggle) {
    element.setAttribute('aria-label', `Mark ${restName} as favorite`);
  } else {
    element.setAttribute('aria-label', `Unmark ${restName} as favorite`);
  }

  DBHelper.toggleFavorite(restId.slice(4), setToggle);
  //updateRestaurants();
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
