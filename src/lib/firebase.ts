import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
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
export const googleProvider = app ? new GoogleAuthProvider() : null;

export const getApiAuthHeaders = async (): Promise<Record<string, string>> => {
  if (!auth?.currentUser) return {};
  const token = await auth.currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
};

export const signInWithGoogle = async () => {
  if (!auth || !googleProvider || !db) throw new Error('Firebase authentication is not configured.');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        subscriptionTier: 'free',
        createdAt: new Date().toISOString(),
      });
    }
    return user;
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const logOut = () => auth ? signOut(auth) : Promise.resolve();
