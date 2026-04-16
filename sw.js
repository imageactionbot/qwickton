const CACHE_VERSION = "v4";
const CACHE_NAME = `qwickton-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./robots.txt",
  "./sitemap.xml",
  "./manifest.webmanifest",
  "./assets/icons/icon.svg",
  "./css/styles.css",
  "./css/pages/business-tools.css",
  "./css/pages/calculator-tools.css",
  "./css/pages/converter-tools.css",
  "./css/pages/creator-tools.css",
  "./css/pages/daily-tools.css",
  "./css/pages/data-tools.css",
  "./css/pages/design-tools.css",
  "./css/pages/developer-tools.css",
  "./css/pages/document-tools.css",
  "./css/pages/file-tools.css",
  "./css/pages/font-tools.css",
  "./css/pages/image-tools.css",
  "./css/pages/math-tools.css",
  "./css/pages/passport-photo-maker.css",
  "./css/pages/pdf-tools.css",
  "./css/pages/personal-tools.css",
  "./css/pages/productivity-tools.css",
  "./css/pages/random-tools.css",
  "./css/pages/security-tools.css",
  "./css/pages/seo-tools.css",
  "./css/pages/social-media-tools.css",
  "./css/pages/study-tools.css",
  "./css/pages/text-tools.css",
  "./css/pages/utility-tools.css",
  "./js/app.js",
  "./js/qwickton-category-tool-counts.js",
  "./js/home-advanced.js",
  "./js/category/category-bootstrap.js",
  "./js/category/category-core.js",
  "./js/category/category-meta.js",
  "./js/category/pages/business-tools.js",
  "./js/category/pages/calculator-tools.js",
  "./js/category/pages/converter-tools.js",
  "./js/category/pages/creator-tools.js",
  "./js/category/pages/daily-tools.js",
  "./js/category/pages/data-tools.js",
  "./js/category/pages/design-tools.js",
  "./js/category/pages/developer-tools.js",
  "./js/category/pages/document-tools.js",
  "./js/category/pages/file-tools.js",
  "./js/category/pages/font-tools.js",
  "./js/category/pages/image-tools.js",
  "./js/category/pages/math-tools.js",
  "./js/category/pages/passport-photo-maker.js",
  "./js/category/pages/pdf-tools.js",
  "./js/category/pages/personal-tools.js",
  "./js/category/pages/productivity-tools.js",
  "./js/category/pages/random-tools.js",
  "./js/category/pages/security-tools.js",
  "./js/category/pages/seo-tools.js",
  "./js/category/pages/social-media-tools.js",
  "./js/category/pages/study-tools.js",
  "./js/category/pages/text-tools.js",
  "./js/category/pages/utility-tools.js",
  "./js/image-lab-templates.js",
  "./js/template-category.js",
  "./js/tools-daily.js",
  "./js/tools-image.js",
  "./js/tools-passport.js",
  "./categories/daily-tools.html",
  "./categories/image-tools.html",
  "./categories/passport-photo-maker.html",
  "./categories/template-category.html",
  "./categories/pdf-tools.html",
  "./categories/text-tools.html",
  "./categories/converter-tools.html",
  "./categories/security-tools.html",
  "./categories/calculator-tools.html",
  "./categories/design-tools.html",
  "./categories/social-media-tools.html",
  "./categories/business-tools.html",
  "./categories/data-tools.html",
  "./categories/random-tools.html",
  "./categories/file-tools.html",
  "./categories/font-tools.html",
  "./categories/seo-tools.html",
  "./categories/document-tools.html",
  "./categories/math-tools.html",
  "./categories/personal-tools.html",
  "./categories/productivity-tools.html",
  "./categories/developer-tools.html",
  "./categories/utility-tools.html",
  "./categories/creator-tools.html",
  "./categories/study-tools.html",
  "./about.html",
  "./contact.html",
  "./terms.html",
  "./privacy.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        CORE_ASSETS.map((asset) => cache.add(asset).catch(() => null))
      );
      const rejected = results.filter((item) => item.status === "rejected").length;
      if (rejected > 0) {
        console.warn(`[SW] ${rejected} precache assets failed`);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) || (await caches.match("./index.html"));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkPromise;
    })
  );
});

self.addEventListener("error", (event) => {
  console.error("[SW] Runtime error", event.message);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection", event.reason);
});
