import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Parse service account key from env variable
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccountKey) {
  console.error('🔥 FIREBASE_SERVICE_ACCOUNT_KEY is missing.');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env variable not set');
}

initializeApp({
  credential: cert(serviceAccountKey),
});

export const db = getFirestore();
export const storage = getStorage();
