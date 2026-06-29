import { precacheAndRoute } from 'workbox-precaching';

declare const self: any;

// Precache all assets compiled by Vite
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen for incoming Web-Push notifications from the server
self.addEventListener('push', (event: any) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const options = {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: {
        link: payload.link || '/dashboard',
      },
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'AYE', options)
    );
  } catch (err) {
    console.error('Error parsing push notification event data:', err);
  }
});

// Listen for clicks on the push notification banner
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const link = event.notification.data?.link || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any[]) => {
      // If a window is already open with the dashboard route, focus it
      for (const client of clientList) {
        if (client.url.includes(link) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    })
  );
});
