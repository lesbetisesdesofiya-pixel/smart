// Firebase Push Notification Service - ClassiNote
// Ce module gère l'enregistrement et la réception des notifications push

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from './firebase-config';

let messaging = null;

export function initializeFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Erreur initialisation Firebase:', error);
    return null;
  }
}

export async function requestNotificationPermission(apiBaseUrl, token) {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Permission notification refusée');
      return false;
    }

    if (!messaging) {
      initializeFirebase();
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (currentToken) {
      await saveDeviceToken(apiBaseUrl, token, currentToken);
      return true;
    } else {
      console.log('Impossible d\'obtenir le token FCM');
      return false;
    }
  } catch (error) {
    console.error('Erreur permissions notifications:', error);
    return false;
  }
}

async function saveDeviceToken(apiBaseUrl, authToken, deviceToken) {
  try {
    const response = await fetch(`${apiBaseUrl}/device-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ device_token: deviceToken }),
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde device token');
    }

    return true;
  } catch (error) {
    console.error('Erreur sauvegarde token:', error);
    return false;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    callback(payload);
  });
}
