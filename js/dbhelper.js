/* jshint esversion: 6 */

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANT_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEWS_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews/?restaurant_id=`;
  }

  /**
   * IDB creation
   *
   */
  static openDatabase () {

    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      console.log(`Browser doesn't support Service Workers`);
      return Promise.resolve();
    }

    return idb.open('restaurant-db', 1, function (upgradeDb) {
      var store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id',
      });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    // get restaurants from indexedDB
    DBHelper.openDatabase().then(function (db) {
      if (!db) {
        return;
      }  else {
        return db.transaction('restaurants', 'readwrite')
                 .objectStore('restaurants')
                 .getAll();
      }
    }).then(function (restaurants) {
      if (restaurants.length === 0) return;
      callback(null, restaurants);
    });

    fetch(DBHelper.RESTAURANT_URL)
    .then(
      function (response) {
        if (response.status !== 200) {
          console.log('Fetch Issue - Status Code: ' + response.status);
          return;
        }

        response.json().then(function (restaurants) {

          /* Add restaurants to indexedDB */
          DBHelper.openDatabase().then(function (db) {
            if (!db) {
              return;
            } else {
              let store = db.transaction('restaurants', 'readwrite')
                            .objectStore('restaurants');
              restaurants.forEach(function (restaurant) {
                store.put(restaurant);
              });
            }
          });

          callback(null, restaurants);
        });
      }
    )
    .catch(function (err) {
      console.log('Fetch Error: ', err);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }

        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }

        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);

        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);

        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(id, callback) {
    return fetch(`${DBHelper.REVIEWS_URL}${id}`)
           .then(response => response.json())
           .then(reviews => callback(null, reviews))
           .catch(error => callback(`Request failed. Returned ${error}`, null));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP,
    });
    return marker;
  }

}
