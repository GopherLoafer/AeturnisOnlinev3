/**
 * Service Worker for Aeturnis Online PWA
 */

const CACHE_NAME = 'aeturnis-v2';
const urlsToCache = [
  '/css/style.css',
  '/css/responsive-base.css',
  '/css/utilities.css',
  '/css/performance.css',
  '/css/mobile-features.css',
  '/js/game.js',
  '/js/mobile-navigation.js',
  '/js/performance-utils.js',
  '/js/mobile-game-features.js',
  '/manifest.json'
];

// Don't cache these URLs to avoid redirect issues
const SKIP_CACHE_URLS = [
  '/auth/',
  '/game/',
  '/admin/',
  '/api/',
  '/'
];

// Install event - cache static resources only
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - handle requests intelligently
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip caching for auth, game, admin, and API routes
  const shouldSkipCache = SKIP_CACHE_URLS.some(skipUrl => 
    url.pathname.startsWith(skipUrl)
  );
  
  if (shouldSkipCache || event.request.method !== 'GET') {
    // Always fetch from network for dynamic routes
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Cache static assets only
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(fetchResponse => {
          // Only cache successful responses for static assets
          if (fetchResponse.status === 200 && 
              (url.pathname.startsWith('/css/') || 
               url.pathname.startsWith('/js/') ||
               url.pathname.includes('.json'))) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return fetchResponse;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});