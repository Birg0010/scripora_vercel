// Scripora Service Worker v7.0
var CACHE = 'scripora-v9';
var ASSETS = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/engine.js',
  '/sync.js',
  '/manifest.json',
  '/Icon/icon-192.png',
  '/Icon/icon-512.png',
  '/Icon/favicon-32.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('chrome-extension') >= 0) return;
  // Skip API calls - always fetch live
  if (e.request.url.indexOf('/api/') >= 0) return;
  // Skip Firebase/Google auth calls
  if (e.request.url.indexOf('firebaseapp.com') >= 0) return;
  if (e.request.url.indexOf('googleapis.com') >= 0) return;
  if (e.request.url.indexOf('gstatic.com') >= 0) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // Network first for HTML, cache-first for assets
      var isHTML = e.request.headers.get('accept') &&
                   e.request.headers.get('accept').indexOf('text/html') >= 0;
      if (isHTML) {
        return fetch(e.request).then(function(r) {
          caches.open(CACHE).then(function(c) { c.put(e.request, r.clone()); });
          return r;
        }).catch(function() { return cached; });
      }
      return cached || fetch(e.request).then(function(r) {
        caches.open(CACHE).then(function(c) { c.put(e.request, r.clone()); });
        return r;
      });
    })
  );
});
