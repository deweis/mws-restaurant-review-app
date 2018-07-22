/* jshint esversion: 6 */
importScripts('idb.js');
importScripts('js/dbhelper.js');

const cacheName = 'restaurant-static';

self.addEventListener('install', function (event) {
  const urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/img/',
  ];

  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  var url = new URL(event.request.url);

  if (url.origin != location.origin) {
    return;
  }

  event.respondWith(
    caches.open(cacheName).then(function (cache) {
      return cache.match(event.request)
            .then(response => response || fetch(event.request).then(resp => {
                cache.put(event.request, resp.clone());
                return resp;
              }));
    })
  );
});

self.addEventListener('sync', function (event) {
  if (event.tag == 'myFirstSync') {
    // console.log('sw: sync received');
    event.waitUntil(syncReview());
  }
});

const syncReview = () => {
  idb.open('restaurant-db', 1, function (upgradeDb) {
    var storeReviews = upgradeDb.createObjectStore('reviews-tmp', {
      keyPath: 'id',
      autoIncrement: true,
    });
  }).then(function (db) {
    if (!db) {
      return;
    } else {
      let storeReviews = db.transaction('reviews-tmp', 'readonly')
                           .objectStore('reviews-tmp');
      return storeReviews.getAll();
    }
  }).then(function (reviews) {

    let objRev = {};

    Promise.all(reviews.map(function (review) {
      const data = {
        restaurant_id: review.restaurant_id,
        name: review.name,
        rating: review.rating,
        comments: review.comments,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };
      return fetch('http://localhost:1337/reviews/', {
        body: JSON.stringify(data),
        method: 'POST',
      })
      .then((response) => response.json()).then((dataJSON) => {
        objRev = dataJSON;

        return idb.open('restaurant-db', 1, function (upgradeDb) {
          var storeReviews = upgradeDb.createObjectStore('reviews-tmp', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }).then(function (db) {
          if (!db) {
            return;
          } else {
            let tx = db.transaction('reviews-tmp', 'readwrite');
            let storeReviews = tx.objectStore('reviews-tmp');

            // console.log('delete review: ' + review.id);
            storeReviews.delete(review.id);
            return tx.complete;
          }
        }).catch(function (err) {
          console.log('Delete review failed: ' + err);
        });

      }).then(() => {
        return idb.open('restaurant-db', 1, function (upgradeDb) {
          var storeReviews = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }).then(function (db) {
          if (!db) {
            return;
          } else {
            let tx = db.transaction('reviews', 'readwrite');
            let storeReviews = tx.objectStore('reviews');

            storeReviews.put(objRev);

            return tx.complete;
          }
        }).catch((err) => {
          console.log(err);
        });
      }).catch((resp) => {
        console.log('review could not be fetched');
      });

    }));

  }).catch(function (err) { console.error(err); });
};
