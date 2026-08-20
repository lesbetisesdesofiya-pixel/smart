// Firebase Configuration for ClassiNote
// Utilisez ce fichier dans vos apps React pour Firebase Cloud Messaging

export const firebaseConfig = {
  apiKey: "AIzaSyAbmNkMlvwhOy_y646H-wnHq9oI9Lu0roc",
  authDomain: "classinote-f7bf4.firebaseapp.com",
  projectId: "classinote-f7bf4",
  storageBucket: "classinote-f7bf4.firebasestorage.app",
  messagingSenderId: "867330234176",
  appId: "1:867330234176:web:ac9cb6350003dc73e38ca5",
  measurementId: "G-3FDVQJLHFT",
};

// VAPID Key pour Web Push (à générer dans Firebase Console > Cloud Messaging > Web Push certificates)
// Générer avec: npx web-push generate-vapid-keys
// Puis configurer dans Firebase Console > Project Settings > Cloud Messaging > Web push certificates
export const VAPID_KEY = "BFmR2xscm5xdjJKgv-PHnFPkPFesz2wyw4tBbaQITk6vvlxxhOPUSjqnPeGzbGEmoRY0kjkvLYUkcAyReMZ0I3A";
