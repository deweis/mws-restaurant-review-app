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
    console.log('sw: sync received');
    event.waitUntil(syncReview());
  }
});

const syncReview = () => {
  idb.open('restaurant-db', 1, function (upgradeDb) {
    var storeReviews = upgradeDb.createObjectStore('reviews', {
      keyPath: 'id',
      autoIncrement: true,
    });
  }).then(function (db) {
    if (!db) {
      return;
    } else {
      let storeReviews = db.transaction('reviews', 'readonly')
                           .objectStore('reviews');
      return storeReviews.getAll();
    }
  }).then(function (reviews) {

    Promise.all(reviews.map(function (review) {
      return fetch('http://localhost:1337/reviews/', {
        body: JSON.stringify(review),
        method: 'POST',
      })
      .then((response) => response.json()).then((res) => {
        console.log('review fetched');
        return idb.open('restaurant-db', 1, function (upgradeDb) {
          var storeReviews = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }).then(function (db) {
          if (!db) {
            return;
          } else {
            let storeReviews = db.transaction('reviews', 'readwrite')
                                 .objectStore('reviews');
            console.log('delete review: ' + review.id);
            return storeReviews.delete(review.id);
          }
        }).catch(function (err) {
          console.log('Delete review failed: ' + err);
        });

      }).catch((resp) => {
        console.log('review could not be fetched');
      });

    }));

  }).catch(function (err) { console.error(err); });
};
