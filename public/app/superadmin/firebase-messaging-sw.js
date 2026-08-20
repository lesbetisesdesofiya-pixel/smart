importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAbmNkMlvwhOy_y646H-wnHq9oI9Lu0roc",
  authDomain: "classinote-f7bf4.firebaseapp.com",
  projectId: "classinote-f7bf4",
  storageBucket: "classinote-f7bf4.firebasestorage.app",
  messagingSenderId: "867330234176",
  appId: "1:867330234176:web:ac9cb6350003dc73e38ca5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', JSON.stringify(payload));
  const title = payload.notification?.title || 'ClassiNote';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event.data ? event.data.text() : 'no data');
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let url = '/smart/public/superadmin/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
