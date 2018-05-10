const cacheName = 'restaurant-static';

self.addEventListener('install', function(event) {
  const urlsToCache = [
    "/",
    "/index.html",
    "/restaurant.html",
    "/css/styles.css",
    "/js/main.js",
    "/js/dbhelper.js",
    "/js/restaurant_info.js",
    "/img/"
  ];

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
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
    caches.open(cacheName).then(cache => {
      return cache.match(event.request)
            .then(response => response || fetch(event.request).then(resp => {
                cache.put(event.request, resp.clone())
                return resp;
            }))
    })
  );
});
