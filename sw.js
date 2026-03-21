var CACHE = 'scripora-v1';
var ASSETS = ['/', '/index.html'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}));
  self.skipWaiting();
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}));
  self.clients.claim();
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(function(cached){
    var fresh=fetch(e.request).then(function(r){caches.open(CACHE).then(function(c){c.put(e.request,r.clone());});return r;}).catch(function(){return cached;});
    return cached||fresh;
  }));
});
