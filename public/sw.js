// Service worker POSLO ONE: web push obavijesti + offline poruka. Podaci se NE keširaju (rezervacije moraju biti uvijek svježe).
const OFFLINE_CACHE = 'poslo-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png'])).catch(() => {}).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE_CACHE && k.startsWith('poslo-offline-')).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
);

// Samo navigacije: ako nema mreže, prikaži offline stranicu. API i ostalo ide uvijek direktno na mrežu.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())));
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'POSLO ONE';
  const options = {
    body: typeof data.body === 'string' ? data.body : '',
    icon: '/poslo.one.png',
    badge: '/poslo.one.png',
    tag: typeof data.tag === 'string' ? data.tag : undefined,
    data: { url: typeof data.url === 'string' ? data.url : '/dashboard/inquiries' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Samo relativni linkovi unutar /dashboard.
  let target = '/dashboard/inquiries';
  try {
    const parsed = new URL((event.notification.data && event.notification.data.url) || target, self.location.origin);
    if (parsed.origin === self.location.origin && parsed.pathname.startsWith('/dashboard')) {
      target = parsed.pathname + parsed.search;
    }
  } catch (e) {
    /* ostaje zadani */
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
          return client.navigate(target).then((c) => c && c.focus());
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
