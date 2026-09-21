const CACHE_NAME = 'musherfe-pwa-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/audio/quest/welcome.mp3',
  '/audio/quest/station1.mp3',
  '/audio/quest/station2.mp3',
  '/audio/quest/station3.mp3',
  '/audio/quest/station4.mp3',
  '/audio/quest/comic1.mp3',
  '/audio/quest/comic2.mp3',
  '/audio/quest/comic3.mp3',
  '/audio/quest/feedback_approved.mp3',
  '/audio/quest/feedback_hint.mp3'
];

// Install Event: cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Stale-while-revalidate for same-origin static assets, network-first for pages
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ONLY intercept same-origin requests and Google Fonts/CDNs
  const isSameOrigin = url.origin === self.location.origin;
  const isAllowedCdn = url.hostname.includes('fonts.googleapis.com') ||
                       url.hostname.includes('fonts.gstatic.com') ||
                       url.hostname.includes('cdnjs.cloudflare.com');

  if (!isSameOrigin && !isAllowedCdn) {
    // Let browser handle all external APIs, Firebase, Groq, images natively!
    return;
  }

  // For HTML navigation: Network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html') || await caches.match('/');
          if (cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // For other static assets: Cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background quietly
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse)).catch(() => {});
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.url.startsWith(self.location.origin) || event.request.url.includes('fonts.googleapis.com'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not cached, return graceful empty response instead of throwing unhandled rejection
          return new Response('', { status: 408, statusText: 'Network Error' });
        });
    })
  );
});

// =========================================================================
// Mobile Push Notifications & Web Notification Click Handlers
// =========================================================================

// 1. Listen for Push messages from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'مدرسة مشيرفة الابتدائية 🔔',
    body: 'هناك تحديث وإعلان جديد في المدرسة، اضغط للمشاهدة.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'عرض التفاصيل ➔' },
      { action: 'close', title: 'إغلاق' }
    ],
    tag: data.tag || 'musheirifa-news-update',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 2. Notification Click Event: open target page on phone / desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Message Event: trigger notification from app client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, url, tag } = event.data;
    const options = {
      body: body || 'إشعار جديد من مدرسة مشيرفة الابتدائية',
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: url || '/',
        dateOfArrival: Date.now()
      },
      tag: tag || 'school-alert',
      renotify: true
    };
    self.registration.showNotification(title || 'مدرسة مشيرفة الابتدائية 🔔', options);
  }
});
