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
      var storeRestaurants = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id',
      });
      storeRestaurants.createIndex('rest-id', 'id');
      var storeReviews = upgradeDb.createObjectStore('reviews', {
        keyPath: 'id',
        autoIncrement: true,
      });
      storeReviews.createIndex('restaurant_id',
                               'restaurant_id',
                               { unique: false });
      var storeReviewsTmp = upgradeDb.createObjectStore('reviews-tmp', {
        keyPath: 'id',
        autoIncrement: true,
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
              let storeRestaurants = db.transaction('restaurants', 'readwrite')
                            .objectStore('restaurants');
              restaurants.forEach(function (restaurant) {
                storeRestaurants.put(restaurant);
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

    // get reviews from indexedDB
    DBHelper.openDatabase().then(function (db) {
      if (!db) {
        return;
      }  else {
        let storeReviews = db.transaction('reviews', 'readwrite')
                             .objectStore('reviews');
        let restIndex = storeReviews.index('restaurant_id');
        return restIndex.getAll(parseInt(id));
      }
    }).then(function (reviews) {
      if (reviews.length === 0) return;
      callback(null, reviews);
    });

    /* Fetch reviews from network */
    fetch(`${DBHelper.REVIEWS_URL}${id}`)
           .then(response => response.json())
           .then(reviews => {

              /* Add reviews to indexedDB */
              DBHelper.openDatabase().then(function (db) {
                if (!db) {
                  return;
                } else {
                  let storeReviews = db.transaction('reviews', 'readwrite')
                                       .objectStore('reviews');
                  reviews.forEach(function (review) {
                    storeReviews.put(review);
                  });
                }
              });

              callback(null, reviews);
            })
           .catch(error => callback(`Request failed. Returned ${error}`, null));
  }

  /**
   * Post reviews to DB
   */
  static postReview(review) {
    return DBHelper.openDatabase().then(function (db) {
      if (!db) {
        return;
      } else {
        let transaction = db.transaction('reviews-tmp', 'readwrite');
        let storeReviews = transaction.objectStore('reviews-tmp');

        storeReviews.put(review);
        return transaction.complete;
      }
    });
  }

  static toggleFavorite(restaurantId, toggleValue) {
    return DBHelper.openDatabase().then(function (db) {
      if (!db) {
        return;
      } else {
        let storeRestaurants = db.transaction('restaurants', 'readwrite')
                                 .objectStore('restaurants');
        let restaurantIndex = storeRestaurants.index('rest-id');
        return restaurantIndex.openCursor();
      }
    }).then(function updateFavorite(cursor) {

      restaurantId = +restaurantId;

      if (!cursor) return;

      if (cursor.value.id === restaurantId) {
        var updateData = cursor.value;

        updateData.is_favorite = toggleValue;
        var request = cursor.update(updateData);
        request.onsuccess = function () {
          return;
        };
      };

      return cursor.continue().then(updateFavorite);

    }).then(function () {

      const url = `http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${toggleValue}`;

      fetch(url, {
          method: 'PUT',
        }).then((response) => response.json()
        ).catch((error) => {
          console.log('Error fetching is_favorite: ' + error);
        });
    });
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
