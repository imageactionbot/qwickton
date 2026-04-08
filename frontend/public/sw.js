const CACHE_SHELL = "qwickton-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(["/offline.html", "/manifest.webmanifest"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_SHELL ? caches.delete(k) : Promise.resolve())))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }
  event.respondWith(fetch(req));
});
