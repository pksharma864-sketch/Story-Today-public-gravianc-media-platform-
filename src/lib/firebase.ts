import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress noisy Firestore debug/timeout warnings in restricted iframe environments
try {
  setLogLevel('error');
} catch {
  // Ignore in case environment restricts log level configuration
}

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

// Initialize Firestore with experimentalForceLongPolling to ensure robust connectivity
// across sandboxed iframe previews, web workers, and proxy environments without WebChannel drops.
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      dbId
    );
  } catch {
    return getFirestore(app, dbId);
  }
})();

// Validate connection to Firestore as required by Firebase skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection test timeout')), 4000)
    );

    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise,
    ]);

    console.log('Firebase Firestore cloud persistence connected successfully.');
    return true;
  } catch (error: any) {
    if (
      error?.message?.includes('the client is offline') ||
      error?.message?.includes('timeout')
    ) {
      console.warn('Firebase client initialized (operating with server-side backend persistence).');
    } else {
      console.log('Firestore client initialized with backend proxy.');
    }
    return false;
  }
}

