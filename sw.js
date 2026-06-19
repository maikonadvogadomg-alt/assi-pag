const CACHE = "ia-juridico-v2";
const BASE = self.location.pathname.replace(/sw\.js$/, "");

const SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Nunca intercepta chamadas de API externa
  if (url.hostname !== self.location.hostname) return;

  // Navegação: serve o shell (SPA)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match(BASE + "index.html"))
    );
    return;
  }

  // Assets: cache primeiro, busca em background
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then((res) => {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached ?? network;
    })
  );
});
