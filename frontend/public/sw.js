self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.registration.unregister();
  await self.clients.claim();
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.navigate(client.url));
});
