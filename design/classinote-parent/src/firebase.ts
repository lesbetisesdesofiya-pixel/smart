import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { apiFetch } from './api';

const firebaseConfig = {
  apiKey: "AIzaSyAbmNkMlvwhOy_y646H-wnHq9oI9Lu0roc",
  authDomain: "classinote-f7bf4.firebaseapp.com",
  projectId: "classinote-f7bf4",
  storageBucket: "classinote-f7bf4.firebasestorage.app",
  messagingSenderId: "867330234176",
  appId: "1:867330234176:web:ac9cb6350003dc73e38ca5",
};

const VAPID_KEY = "BFmR2xscm5xdjJKgv-PHnFPkPFesz2wyw4tBbaQITk6vvlxxhOPUSjqnPeGzbGEmoRY0kjkvLYUkcAyReMZ0I3A";

let messaging: any = null;
let swRegistration: ServiceWorkerRegistration | null = null;

export async function initFirebaseMessaging() {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    if (!('serviceWorker' in navigator)) {
      return { messaging, registration: null };
    }

    const swPaths = [
      '/app/parent/firebase-messaging-sw.js',
      '/firebase-messaging-sw.js',
      '/smart/app/parent/firebase-messaging-sw.js',
      '/app/firebase-messaging-sw.js',
    ];

    for (const swUrl of swPaths) {
      try {
        const reg = await navigator.serviceWorker.register(swUrl);
        swRegistration = reg;
        return { messaging, registration: reg };
      } catch (e: any) {
      }
    }

    return { messaging, registration: null };
  } catch (err: any) {
    return { messaging: null, registration: null };
  }
}

export async function requestPushPermission(registration?: ServiceWorkerRegistration | null) {
  try {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      return false;
    }

    if (!messaging) {
      const result = await initFirebaseMessaging();
      registration = result.registration;
      messaging = result.messaging;
    }

    if (!messaging) {
      return false;
    }

    const reg = registration || swRegistration;

    const tokenOptions: any = { vapidKey: VAPID_KEY };
    if (reg) {
      tokenOptions.serviceWorkerRegistration = reg;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      await saveDeviceToken(token);
      return true;
    }

    return false;
  } catch (err: any) {
    return false;
  }
}

export async function removePushToken(): Promise<boolean> {
  try {
    if (messaging) {
      await deleteToken(messaging);
    }
    await apiFetch('/parent/device-token', { method: 'DELETE' });
    return true;
  } catch (err: any) {
    return false;
  }
}

async function saveDeviceToken(fcmToken: string) {
  try {
    const response = await apiFetch('/parent/device-token', {
      method: 'POST',
      body: JSON.stringify({ device_token: fcmToken }),
    });
    return response;
  } catch (err: any) {
    throw err;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    return;
  }
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}
