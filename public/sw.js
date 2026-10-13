// Service worker POSLO ONE: prima web push obavijesti za nove upite.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
