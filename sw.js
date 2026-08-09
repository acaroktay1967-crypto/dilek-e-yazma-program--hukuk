const CACHE_NAME = 'hukuk-pro-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app.js',
  './ios-api.js',
  'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Source+Sans+3:wght@300;400;600;700;800&display=swap'
];

// Install – önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Önbelleğe alınıyor...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate – eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch – önce önbellekten, yoksa ağdan
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // Çevrimdışı durumda varsayılan sayfa (isteğe bağlı)
        return caches.match('index.html');
      })
  );
});
