const CACHE_NAME = 'hukuk-pro-iphone-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './ios-api.js',
  './manifest.webmanifest',
  './resources/icon.png',
  './resources/icon_128.png',
  './resources/icon_256.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
