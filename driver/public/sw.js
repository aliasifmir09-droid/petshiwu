const CACHE = 'petshiwu-driver-shell-v1';
const SHELL = ['/driver/', '/driver/index.html', '/driver/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/proof')) return;
  if (event.request.method !== 'GET' || !url.pathname.startsWith('/driver/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match('/driver/'))));
});
