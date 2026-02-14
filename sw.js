// Service Worker for Invoice Scanner PWA
const CACHE_NAME = 'invoice-scanner-v2.8';

// רשימת הקבצים שיישמרו בזיכרון לשימוש אופליין
const ASSETS_TO_CACHE = [
  '/invoice-scanner/',
  '/invoice-scanner/index.html',
  '/invoice-scanner/manifest.json',
  '/invoice-scanner/icon-192.png',
  '/invoice-scanner/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// התקנה: שמירת הקבצים ב-Cache
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// הפעלה: ניקוי גרסאות קודמות של ה-Cache
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// שליפת מידע: קודם בודק ב-Cache, אם אין - הולך לאינטרנט
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Offline fallback
          return new Response('אופליין - אנא התחבר לאינטרנט', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
