/* Ninfa del Agua — service worker
 *
 * Precaches the app shell so the UI works offline after first visit.
 * Audio is cached on first play (runtime) to avoid a huge install download.
 */

const CACHE_VERSION = "ninfa-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/config.js",
  "./js/audio.js",
  "./js/nav.js",
  "./js/app.js",
  "./vendor/confetti.browser.min.js",
  "./assets/images/Logoapp.png",
  "./assets/images/Piedra.png",
  "./assets/images/artifact-broken.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ninfa-") && key !== SHELL_CACHE && key !== AUDIO_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isAudioRequest(url) {
  return url.pathname.includes("/assets/audio/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests (and same path scope).
  if (url.origin !== self.location.origin) return;

  if (isAudioRequest(url)) {
    event.respondWith(cacheFirst(request, AUDIO_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline fallback for navigations
    if (request.mode === "navigate") {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
    }
    throw err;
  }
}
