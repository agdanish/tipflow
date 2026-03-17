// TipFlow Service Worker — offline caching & PWA support
const CACHE_NAME = 'tipflow-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon.svg',
  '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API/navigation, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) return;

  // API calls & SSE: network-first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/events')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'You are offline' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ttf|eot)$/) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(() => {
          // Offline fallback for assets — just return nothing
          return new Response('', { status: 408 });
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            if (cached) return cached;
            return new Response(
              '<!DOCTYPE html><html><head><title>TipFlow — Offline</title>' +
              '<style>body{font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}' +
              '.box{text-align:center;padding:2rem;}.icon{font-size:3rem;margin-bottom:1rem;}h1{font-size:1.25rem;margin-bottom:0.5rem;}p{color:#94a3b8;font-size:0.875rem;}</style>' +
              '</head><body><div class="box"><div class="icon">&#9889;</div><h1>TipFlow is Offline</h1><p>Check your connection and try again.</p></div></body></html>',
              {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
              }
            );
          });
        })
    );
    return;
  }
});
