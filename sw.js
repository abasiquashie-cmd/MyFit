const CACHE = 'myfit-fresh-v2';
const INDEX = new URL('./index.html', self.registration.scope).href;
const ASSETS = ['./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(INDEX, {cache:'reload'});
    if (!response.ok) throw new Error('MyFit update unavailable');
    await cache.put(INDEX, response);
    await Promise.allSettled(ASSETS.map(async path => {
      const url = new URL(path, self.registration.scope).href;
      const r = await fetch(url, {cache:'reload'});
      if (r.ok) await cache.put(url,r);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(k => k.startsWith('myfit-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  if (req.mode !== 'navigate' && !ASSETS.some(p => new URL(p,self.registration.scope).href === req.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? INDEX : req.url;
    try {
      const response = await fetch(req, {cache:'no-store'});
      if (response.ok) {
        try { await cache.put(key,response.clone()); } catch (_) {}
      }
      return response;
    } catch (_) {
      return (await cache.match(key)) || new Response('MyFit is offline. Reconnect and try again.', {
        status:503,
        headers:{'Content-Type':'text/plain'}
      });
    }
  })());
});
