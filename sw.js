self.addEventListener('install', function(event) {
  const urlsToCache = [
    "/",
    "/index.html",
    "/restaurant.html",
    "/css/styles.css",
    "/data/restaurants.json",
    "/js/main.js",
    "/js/dbhelper.js",
    "/js/restaurant_info.js",
    "/img/"
  ];

  event.waitUntil(
    caches.open('restaurant-static').then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
