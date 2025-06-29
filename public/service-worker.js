/**
 * Service Worker for Aeturnis Online PWA
 */

const CACHE_NAME = 'aeturnis-v1';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/responsive-base.css',
  '/css/utilities.css',
  '/css/performance.css',
  '/js/game.js',
  '/js/mobile-navigation.js',
  '/js/performance-utils.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
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
});