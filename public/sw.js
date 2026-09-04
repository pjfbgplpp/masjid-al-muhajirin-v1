// Masjid TV Display - Service Worker for Offline-First Digital Signage
const CACHE_NAME = 'masjid-tv-v1';
const ASSETS_CACHE_NAME = 'masjid-tv-media-v1';

// App shell resources to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/display',
  '/admin'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache non-fatal notice:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== ASSETS_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser-extension / socket schemes
  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Supabase REST or Realtime websocket requests: Network-first
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/realtime/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true, error: 'Network offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Media / Images caching strategy: Cache-first, then network and cache
  if (
    event.request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)(\?.*)?$/i) ||
    url.hostname.includes('images.unsplash.com')
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((networkRes) => {
              if (networkRes.ok && networkRes.type !== 'opaque') {
                cache.put(event.request, networkRes.clone()).catch(() => {});
              }
              return networkRes;
            })
            .catch(() => {
              // Return transparent 1x1 SVG if image cannot be fetched offline
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#022c22"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        });
      })
    );
    return;
  }

  // API displays endpoints: Stale-While-Revalidate or Network-first
  if (url.pathname.startsWith('/api/displays')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static Assets & App Shell: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/') || caches.match('/index.html');
          }
          return cached;
        });

      return cached || fetchPromise;
    })
  );
});
