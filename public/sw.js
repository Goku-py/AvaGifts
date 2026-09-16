/*
 * AvaGifts service worker — runtime caching so Piku Runner (and the page)
 * keep working with no network. Dependency-free; registered only from
 * production builds (see src/components/layout/service-worker-registrar.tsx).
 *
 * Strategy:
 *  - navigations: network-first, cache fallback (+ cached shell)
 *  - /_next/static/*: cache-first (content-hashed, immutable)
 *  - other same-origin GETs: stale-while-revalidate
 *  - /api/* and non-GET are never intercepted
 */
const CACHE = 'avagifts-v1';
const SHELL = '/';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheable(request) {
  if (request.method !== 'GET') return false;
  if (request.headers.has('range')) return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  return true;
}

async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match(SHELL, { ignoreSearch: true });
      if (shell) return shell;
    }
    throw error;
  }
}

async function cacheFirst(request, cache) {
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  const result = cached || (await network);
  return result || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isCacheable(request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (request.mode === 'navigate') return networkFirst(request, cache);
      const url = new URL(request.url);
      if (url.pathname.startsWith('/_next/static/')) {
        return cacheFirst(request, cache);
      }
      return staleWhileRevalidate(request, cache);
    })(),
  );
});
