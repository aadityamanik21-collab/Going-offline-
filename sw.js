const CACHE_NAME = 'zenith-immortal-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './tailwind.js',
    './chart.js',
    './confetti.js'
];

// Install Phase: Lock local assets into the vault
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activation Phase: Purge old weak caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception Phase: Cache-First Strategy with FontAwesome Archiving
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                // If the request is for FontAwesome (CSS or Webfonts), archive it permanently
                if (event.request.url.includes('font-awesome') || event.request.url.includes('fontawesome')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Failsafe: If totally offline and asset is missing, return nothing to prevent crashes
                return new Response('', { status: 408, statusText: 'Offline' });
            });
        })
    );
});
