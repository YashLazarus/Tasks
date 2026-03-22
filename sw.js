const CACHE = 'tasks-v4';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.clients.claim();
  // purge old caches
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Never cache auth, Firebase, or API calls — always go to network
  if (url.includes('firebaseio.com') ||
      url.includes('googleapis.com') ||
      url.includes('identitytoolkit') ||
      url.includes('securetoken')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Never cache index.html — always get fresh version so updates work
  if (url.endsWith('/Tasks/') || url.endsWith('/Tasks/index.html') || url.endsWith('index.html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache fonts and static assets
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});
