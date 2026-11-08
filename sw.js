const CACHE_NAME = 'pillo-care-plus-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './assets.js',
  './app.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/adult_calm.webp',
  './assets/adult_impatient.webp',
  './assets/adult_angry.webp',
  './assets/adult_celebrating.webp',
  './assets/kid_calm.webp',
  './assets/kid_worried.webp',
  './assets/kid_worried_angry.webp',
  './assets/kid_angry.webp',
  './assets/icon_adult_pills.webp',
  './assets/icon_kid_meds.webp',
  './assets/icon_refill_alert.webp',
  './assets/icon_water_shield.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
