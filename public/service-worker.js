
/**
 * Enhanced Service Worker for Aeturnis Online PWA
 * Includes offline support, background sync, and push notifications
 */

const CACHE_NAME = 'aeturnis-v3';
const CRITICAL_CACHE = 'aeturnis-critical-v3';
const GAME_DATA_CACHE = 'aeturnis-gamedata-v3';

// Critical resources that must be cached
const CRITICAL_RESOURCES = [
  '/',
  '/game/dashboard',
  '/css/responsive-base.css',
  '/css/style.css',
  '/js/game.js',
  '/js/mobile-navigation.js',
  '/js/performance-utils.js',
  '/manifest.json'
];

// Game data that can be cached with longer TTL
const GAME_DATA_RESOURCES = [
  '/api/progression/info',
  '/api/abilities/race-abilities'
];

// Routes that should never be cached
const SKIP_CACHE_URLS = [
  '/auth/',
  '/admin/',
  '/api/progression/award-experience',
  '/api/combat/',
  '/logout'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CRITICAL_CACHE).then(cache => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll([
          '/css/utilities.css',
          '/css/performance.css',
          '/css/mobile-features.css',
          '/js/chat-system.js',
          '/js/mobile-game-features.js'
        ]);
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== CRITICAL_CACHE && 
              cacheName !== GAME_DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip caching for dynamic routes
  const shouldSkipCache = SKIP_CACHE_URLS.some(skipUrl => 
    url.pathname.startsWith(skipUrl)
  );
  
  if (shouldSkipCache || event.request.method !== 'GET') {
    // Network-first for dynamic content
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
    );
    return;
  }
  
  // Cache-first for static assets
  if (url.pathname.startsWith('/css/') || 
      url.pathname.startsWith('/js/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          if (fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
    );
    return;
  }
  
  // Network-first with cache fallback for game data
  if (GAME_DATA_RESOURCES.some(resource => url.pathname.startsWith(resource))) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(GAME_DATA_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Default: network-first for everything else
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'game-action-sync') {
    event.waitUntil(syncGameActions());
  }
});

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/icon-192.png',
      badge: '/images/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open Game',
          icon: '/images/action-open.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/images/action-dismiss.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes('/game/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow('/game/dashboard');
        }
      })
    );
  }
});

// Helper function to sync offline game actions
async function syncGameActions() {
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.log('Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Periodic background sync (for supported browsers)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'game-update-sync') {
    event.waitUntil(checkForGameUpdates());
  }
});

async function checkForGameUpdates() {
  try {
    // Check for character updates, new messages, etc.
    const response = await fetch('/api/updates/check');
    if (response.ok) {
      const updates = await response.json();
      if (updates.hasUpdates) {
        // Show notification about updates
        self.registration.showNotification('Aeturnis Update', {
          body: 'New content available in game!',
          icon: '/images/icon-192.png',
          tag: 'game-update'
        });
      }
    }
  } catch (error) {
    console.log('Update check failed:', error);
  }
}
