const CACHE_NAME = 'disaster-emergency-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker installed successfully');
        return cache.addAll([
          '/',
          '/manifest.json'
        ]);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response; // Return cached version
        }
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request); // Fetch from network
      })
      .catch(() => {
        // If offline and no cache, return offline page
        if (event.request.url.includes('/api/') || event.request.url.includes('/sos')) {
          return new Response(JSON.stringify({
            message: 'Offline mode - SOS alert will be sent when connection is restored',
            offline: true,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
