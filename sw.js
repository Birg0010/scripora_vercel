// Scripora Service Worker v1.0
// Strategy: cache-first app shell, network-only for third-party APIs.
// Navigation requests always return /index.html from cache (SPA offline fix).

var CACHE = 'scripora-shell-v1';

// Every file the browser needs to render the app shell from a cold start.
// These are same-origin static assets only — no third-party URLs.
var SHELL = [
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

// ── Install: cache the app shell ──────────────────────────────────────────────
// Cache each asset individually so one 404 does not abort the entire install.
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return Promise.allSettled(
        SHELL.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    }).then(function() {
      // Activate immediately — do not wait for old tabs to close.
      return self.skipWaiting();
    })
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      // Take control of all open pages immediately.
      return self.clients.claim();
    })
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = new URL(req.url);

  // Rule 1: skip non-GET and cross-origin requests entirely.
  // Firebase Auth, Firestore, Google Analytics, Google Fonts — network only.
  // This preserves all cloud sync and authentication behaviour.
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Rule 2: navigation requests (page loads, PWA cold starts).
  // Always serve /index.html from cache — this is the SPA shell.
  // The app bootstraps itself from localStorage regardless of the URL.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(function(cached) {
        if (cached) return cached;
        // Shell not cached yet — fetch from network as fallback.
        return fetch('/index.html');
      })
    );
    return;
  }

  // Rule 3: same-origin static assets — cache-first, update in background.
  e.respondWith(
    caches.match(req).then(function(cached) {
      // Clone the request before it is consumed by fetch.
      var networkFetch = fetch(req.clone()).then(function(networkRes) {
        // Only cache valid, non-opaque responses.
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          var toCache = networkRes.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(req, toCache);
          });
        }
        return networkRes;
      }).catch(function() {
        // Network failed — cached version (if any) is the only option.
        return null;
      });

      // Serve from cache immediately if available; otherwise wait for network.
      return cached || networkFetch;
    })
  );
});
