import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

let firestoreQuotaExceeded = false;

export function isFirestoreQuotaExceeded(): boolean {
  return firestoreQuotaExceeded;
}

export function setFirestoreQuotaExceeded(val: boolean = true): void {
  firestoreQuotaExceeded = val;
  if (val) {
    console.warn(
      '⚠️ [Firebase Firestore] Quota limit reached (resource-exhausted). Firestore writes/listeners paused; using local storage & Supabase.'
    );
  }
}

// Connection test with quota check
export async function testFirestoreConnection(): Promise<boolean> {
  if (firestoreQuotaExceeded) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Cloud Firestore connection verified');
    return true;
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota limit exceeded') ||
      error?.message?.includes('resource-exhausted')
    ) {
      setFirestoreQuotaExceeded(true);
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline, operating in offline cache mode.');
    } else {
      console.warn('[Firebase] Firestore test connection:', error);
    }
    return false;
  }
}
