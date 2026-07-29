// Bump this string on every deploy to force a fresh install of the SW.
const CACHE = 'expense-tracker-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Cache assets one at a time with allSettled: addAll() rejects the whole
// install if a single asset 404s, which would leave the app with no cache
// at all and no offline support.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      return Promise.allSettled(
        ASSETS.map(url => c.add(url).catch(err => {
          console.warn('SW: failed to cache', url, err);
          return null;
        }))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for GET requests: try the network so GitHub Pages updates
// are picked up instantly. Fall back to cache if offline. Cache the fresh
// copy on success. NEVER touches localStorage — your data is untouched by
// any cache activity.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Only cache successful basic responses (same-origin)
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
