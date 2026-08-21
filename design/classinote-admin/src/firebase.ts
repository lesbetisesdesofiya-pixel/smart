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

    if (!('serviceWorker' in navigator)) { return { messaging, registration: null }; }

    const swPaths = [
      '/app/admin/firebase-messaging-sw.js',
      '/firebase-messaging-sw.js',
      '/smart/app/admin/firebase-messaging-sw.js',
    ];

    for (const swUrl of swPaths) {
      try {
        swRegistration = await navigator.serviceWorker.register(swUrl);
        return { messaging, registration: swRegistration };
      } catch (e: any) { }
    }
    return { messaging, registration: null };
  } catch (err: any) { return { messaging: null, registration: null }; }
}

export async function requestPushPermission(registration?: ServiceWorkerRegistration | null) {
  try {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    if (!messaging) { const r = await initFirebaseMessaging(); registration = r.registration; messaging = r.messaging; }
    if (!messaging) { return false; }

    const reg = registration || swRegistration;
    const opts: any = { vapidKey: VAPID_KEY };
    if (reg) opts.serviceWorkerRegistration = reg;

    const token = await getToken(messaging, opts);
    if (token) {
      await apiFetch('/school-admin/device-token', { method: 'POST', body: JSON.stringify({ device_token: token }) });
      return true;
    }
    return false;
  } catch (err: any) { return false; }
}

export async function removePushToken(): Promise<boolean> {
  try { if (messaging) await deleteToken(messaging); await apiFetch('/school-admin/device-token', { method: 'DELETE' }); return true; }
  catch { return false; }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) { return; }
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}
