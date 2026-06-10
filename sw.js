/**
 * DNR Control Center - Service Worker
 * Enables offline functionality (PWA)
 */

const CACHE_NAME = 'dnr-control-center-v2.0';
const CACHE_URLS = [
    './',
    './index.html',
    './css/styles.css',
    './js/data.js',
    './js/charts.js',
    './js/export.js',
    './js/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

const CDN_URLS = [
    'https://d1hilrkz3ka39e.cloudfront.net/plotly/plotly-2.27.0.min.js',
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// ═══ INSTALL ═══
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            // Cache local files
            cache.addAll(CACHE_URLS);
            // Cache CDN files (best effort)
            CDN_URLS.forEach(url => {
                fetch(url).then(response => {
                    if (response.ok) cache.put(url, response);
                }).catch(() => console.log('[SW] CDN cache skipped:', url));
            });
        })
    );
    self.skipWaiting();
});

// ═══ ACTIVATE ═══
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// ═══ FETCH STRATEGY: Network First, Cache Fallback ═══
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If it's a navigation request, return index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    // Return offline fallback
                    return new Response('Offline - recurso não disponível no cache', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});

// ═══ BACKGROUND SYNC (Future) ═══
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cases') {
        console.log('[SW] Background sync triggered');
        // Future: sync data with backend
    }
});