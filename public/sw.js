const CACHE_NAME = 'noir-v1';

// Recursos que es cachen en instal·lar
const PRECACHE = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// ── Instal·lació ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activació (neteja caches velles) ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network first, cache fallback ─────────────────
// Estratègia: intenta xarxa primer (dades Supabase sempre fresques),
// si falla (offline) serveix des de cache.
self.addEventListener('fetch', (event) => {
  // Ignora peticions no-GET i peticions a Supabase (sempre volen xarxa)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('covers.openlibrary.org')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Desa còpia fresca a cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serveix des de cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback per a navegació
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
