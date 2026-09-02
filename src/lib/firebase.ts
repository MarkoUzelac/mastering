import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signOut, browserLocalPersistence, setPersistence, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
export const app = isFirebaseConfigured ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId || '(default)') : null;

let persistenceConfigured = false;
async function ensureAnonymousSession(): Promise<User | null> {
  if (!auth) return null;
  if (!persistenceConfigured) {
    await setPersistence(auth, browserLocalPersistence);
    persistenceConfigured = true;
  }
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export const initializeAnonymousAuth = async (): Promise<User | null> => {
  try {
    return await ensureAnonymousSession();
  } catch (error) {
    console.error('[Auth] Anonymous session initialization failed', error);
    throw error;
  }
};

export const getApiAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = await ensureAnonymousSession();
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
};

export const logOut = async () => {
  if (!auth) return;
  await signOut(auth);
  await ensureAnonymousSession();
};
