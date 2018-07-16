/* jshint esversion: 6 */
importScripts('idb.js');

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
    event.waitUntil(
      idb.open('restaurant-db', 1, function (upgradeDb) {
        var storeReviewsTmp = upgradeDb.createObjectStore('reviews-tmp', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }).then(function (db) {
        if (!db) {
          return;
        } else {
          let storeReviewsTmp = db.transaction('reviews-tmp', 'readonly')
                               .objectStore('reviews-tmp');
          return storeReviewsTmp.getAll();
          console.log('got them');
        }
      }).then(function (reviews) {

        reviews.forEach(x => console.log(x));

        return Promise.all(reviews.map(function (review) {

                const url = 'http://localhost:1337/reviews/';
                const data = {
                  restaurant_id: review.restaurant_id,
                  name: review.name,
                  rating: review.rating,
                  comments: review.comments,
                  createdAt: review.createdAt,
                  updatedAt: review.updatedAt,
                };
                console.log('fetch the message');

                return fetch(url, {
                  method: 'POST',
                  body: JSON.stringify(data),
                  headers: { 'Content-Type': 'application/json' },
                }).then(function (response) {
                  return response.json();
                }).catch(function (error) {
                  console.log(error);
                })/*.then(function (data) {
                  console.log('delete the message');
                  if (data.result === 'success') {
                    storeReviewsTmp = db.transaction('reviews-tmp', 'readwrite')
                                        .objectStore('reviews-tmp');
                    return storeReviewsTmp.delete(review.comments);
                  }
                })*/;
              })
           );

      }).catch(function (err) {
        console.error(err);
      }) // idbopen

    ); // waituntil
  } // if sync
}); //eventlistener
