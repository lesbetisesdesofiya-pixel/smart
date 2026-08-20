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

function getAppIcon() {
  const scope = self.registration.scope;
  if (scope.includes('/app/admin/')) return '/app/admin/icons/icon-192x192.png';
  if (scope.includes('/app/prof/')) return '/app/prof/icons/icon-192x192.png';
  return '/app/parent/icons/icon-192x192.png';
}

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', JSON.stringify(payload));
  const title = payload.notification?.title || 'ClassiNote';
  const icon = getAppIcon();
  const options = {
    body: payload.notification?.body || '',
    icon: icon,
    badge: icon,
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event.data ? event.data.text() : 'no data');
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  let url = '/smart/public/app/parent/';

  if (data?.type) {
    if (data.type.startsWith('parent_') || data.type === 'test') {
      url = '/smart/public/app/parent/';
    } else if (data.type.startsWith('prof_')) {
      url = '/smart/public/app/prof/';
    } else if (data.type.startsWith('admin_')) {
      url = '/smart/public/app/admin/';
    }
  }

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
