// MyFit service worker. Built for low data use:
// - app code, styles and images have unique names, so each is downloaded once and reused
//   until it actually changes (even across app updates);
// - the small index.html is checked on each open, and only re-downloaded if it changed.
const CACHE = 'myfit-fresh-v4-e188866b';
const SCOPE = self.registration.scope;
const INDEX = new URL('./index.html', SCOPE).href;
const ASSETS = ["app.3ea63bb238.css", "app.3d741e7557.js", "patch.94767a68f9.js", "img/028e9fd820.webp", "img/08b3d7e584.webp", "img/1566c5f27b.webp", "img/1c21d4b44c.webp", "img/216594dfbe.webp", "img/2c6a698bcc.webp", "img/33c8b3a028.webp", "img/3d77df409c.webp", "img/3f763e2d4b.webp", "img/4510dd0d98.webp", "img/4c13543601.webp", "img/55302fc3fc.webp", "img/6030f418e9.webp", "img/680efd410a.webp", "img/6be7325e7b.webp", "img/741c7a419d.webp", "img/7ebae85f22.webp", "img/84f77d60a4.webp", "img/888ed54f93.webp", "img/942468f569.webp", "img/a0ce736c06.webp", "img/a7733cde00.webp", "img/d65447c34c.webp", "img/d77116aa2b.webp", "img/e647085f53.webp", "img/e81a0d8c0e.webp", "img/f204f0b45e.webp", "img/f4119cdf06.webp", "img/f96acbaac2.webp"].map(p => new URL(p, SCOPE).href);
const VOICES = new URL('./voices.js', SCOPE).href;
const EXTRAS = ['./manifest.webmanifest','./icon-192.png','./icon-512.png'].map(p => new URL(p, SCOPE).href);
// The photo/label text scanner library: kept after first use.
const RUNTIME_HOSTS = ['cdn.jsdelivr.net','tessdata.projectnaptha.com'];

async function reuseOrFetch(cache, url, required) {
  const old = await caches.match(url);            // already downloaded by an earlier version?
  if (old) return cache.put(url, old);
  const r = await fetch(url, {cache: 'no-cache'});
  if (r.ok) return cache.put(url, r);
  if (required) throw new Error('MyFit update unavailable: ' + url);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const index = await fetch(INDEX, {cache: 'no-cache'});
    if (!index.ok) throw new Error('MyFit update unavailable');
    await cache.put(INDEX, index);
    await Promise.all(ASSETS.map(url => reuseOrFetch(cache, url, true)));
    await Promise.allSettled(EXTRAS.map(url => reuseOrFetch(cache, url, false)));
    try { const v = await fetch(VOICES, {cache: 'no-cache'}); if (v.ok) await cache.put(VOICES, v); } catch (_) {}
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
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const response = await fetch(req);
      if (response.ok || response.type === 'opaque') { try { await cache.put(req, response.clone()); } catch (_) {} }
      return response;
    })());
    return;
  }
  if (!req.url.startsWith(SCOPE)) return;
  const clean = url.origin + url.pathname;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(INDEX, {cache: 'no-cache'});
        if (response.ok) { try { await cache.put(INDEX, response.clone()); } catch (_) {} }
        return response;
      } catch (_) {
        return (await cache.match(INDEX)) || new Response('MyFit is offline. Reconnect and try again.', {status: 503, headers: {'Content-Type': 'text/plain'}});
      }
    })());
    return;
  }
  // voices.js is edited by hand on GitHub: check for changes, keep a copy for offline.
  if (clean === VOICES) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(VOICES, {cache: 'no-cache'});
        if (response.ok) { try { await cache.put(VOICES, response.clone()); } catch (_) {} }
        return response;
      } catch (_) {
        return (await caches.match(VOICES)) || new Response('window.MYFIT_VOICES=window.MYFIT_VOICES||{};', {headers: {'Content-Type': 'text/javascript'}});
      }
    })());
    return;
  }
  // Files with a content code in their name never change, so any version can keep them.
  const hashed = /\.[0-9a-f]{10}\.(js|css)$|\/img\/[0-9a-f]{10}\.(webp|png|jpeg)$/.test(url.pathname);
  if (ASSETS.includes(clean) || EXTRAS.includes(clean) || hashed) {
    event.respondWith((async () => {
      const hit = await caches.match(clean);
      if (hit) return hit;
      const response = await fetch(req);
      if (response.ok) { try { await (await caches.open(CACHE)).put(clean, response.clone()); } catch (_) {} }
      return response;
    })());
  }
});
