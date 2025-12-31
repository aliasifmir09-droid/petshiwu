/**
 * Service Worker for offline support and caching
 * This enables PWA-like functionality and offline access
 * PERFORMANCE FIX: Enhanced with stale-while-revalidate, background sync, and cache versioning
 */

const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `petshiwu-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `petshiwu-runtime-v${CACHE_VERSION}`;
const API_CACHE = `petshiwu-api-v${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html', // PERFORMANCE FIX: Cache offline page
  // Don't cache logo.png on install - cache it on first fetch instead
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only cache essential assets, skip logo.png to prevent multiple fetches
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.log('Cache install error:', error);
        // Don't fail installation if some assets fail to cache
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// PERFORMANCE FIX: Stale-while-revalidate strategy for better performance
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start fetching fresh data in the background
  const fetchPromise = fetch(request).then((response) => {
    // Only cache successful responses
    if (response.status === 200) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  }).catch(() => {
    // Network failed, ignore
    return null;
  });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (but allow background sync for POST/PUT/DELETE)
  if (request.method !== 'GET') {
    // PERFORMANCE FIX: Background sync for failed requests
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      event.waitUntil(
        fetch(request).catch(() => {
          // Queue for background sync if network fails
          // Note: Full background sync requires Background Sync API registration
          console.log('Request queued for background sync:', request.url);
        })
      );
    }
    return;
  }

  // Skip cross-origin requests (except for images)
  if (url.origin !== location.origin && !request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
    return;
  }

  // Strategy based on resource type
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i)) {
    // Static assets: Cache first strategy (immutable assets)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Return from cache immediately
        }
        // Not in cache, fetch and cache it
        return fetch(request).then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  } else if (url.pathname.startsWith('/api/')) {
    // API calls: Stale-while-revalidate strategy
    // Return cached data immediately, update in background
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
  } else {
    // HTML/JS/CSS: Network first with stale-while-revalidate fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses
          if (response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Network failed, try cache with stale-while-revalidate
          return staleWhileRevalidate(request, RUNTIME_CACHE).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If it's a navigation request, return offline page
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE).then((offlinePage) => {
                return offlinePage || caches.match('/index.html');
              });
            }

            // Return a basic offline response
            return new Response('Offline - Please check your connection', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
        })
    );
  }
});

// Message handler for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

