// Service Worker: Cache pro Build (Kennung und Dateiliste werden beim Bauen eingetragen). Beim Installieren wird
// das ganze Spiel gespeichert – danach läuft es ohne Netz (Flugmodus). Startseite: Netz zuerst, sonst aus dem Cache.
const CACHE = 'lgkart-__BUILD__';
const ASSETS = [/*__ASSETS__*/];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((ca) => ca.put('./', c)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then((ca) => ca.put(req, c)); }
    return res;
  })));
});
