// Bump this string on every deploy to force a fresh install of the SW.
const CACHE = 'expense-tracker-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg'
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

/* Stale-while-revalidate for same-origin GETs.
 *
 * This was network-first, which reads as the safe choice and is the opposite
 * of what "offline-first" — a stated project principle — asks for. Being fully
 * offline was already handled: fetch rejects promptly and the cache answers.
 * The case it got wrong is the common one, degraded connectivity, where the
 * request neither succeeds nor fails for several seconds and the user stares
 * at nothing while a complete copy of the app sits in the cache.
 *
 * The cached copy is now returned immediately when there is one, and the
 * network runs anyway to refresh it. The revalidate is not fire-and-forget: it
 * goes through waitUntil so the browser keeps this worker alive long enough to
 * finish writing, otherwise a page that closes quickly could never pick up a
 * deploy. The cost is that a new deploy appears on the next load rather than
 * this one — the trade stale-while-revalidate exists to make.
 *
 * NEVER touches localStorage — the user's data is untouched by cache activity.
 */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Cross-origin (the exchange-rate API) is left to the browser. It has its own
  // error handling in the app, and caching a third party's responses here would
  // make this worker responsible for their freshness.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(staleWhileRevalidate(e));
});

function staleWhileRevalidate(e) {
  return caches.open(CACHE).then((cache) =>
    cache.match(e.request).then((cached) => {
      const revalidate = fetch(e.request)
        .then((res) => {
          // Only successful same-origin responses. An error page cached here
          // would outlive the outage that produced it.
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(e.request, res.clone());
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        e.waitUntil(revalidate);
        return cached;
      }
      // Nothing cached, so this one has to wait for the network. If that fails
      // too, fall back to the shell rather than a browser error page.
      return revalidate.then((res) =>
        res || cache.match('./index.html').then((shell) => shell || Response.error())
      );
    })
  );
}
