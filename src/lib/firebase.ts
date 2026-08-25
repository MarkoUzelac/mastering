import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

export const app = isFirebaseConfigured ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]) : null;
export const auth = app ? getAuth(app) : null as any;
export const db = app ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId || '(default)') : null as any;
export const googleProvider = app ? new GoogleAuthProvider() : null as any;

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase is not configured. Missing API key.");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in db, if not create profile
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      const isAdmin = user.email === 'info@markouzelacuzy.com';
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: isAdmin ? 'admin' : 'user',
        subscriptionTier: isAdmin ? 'pro' : 'free',
        createdAt: new Date().toISOString()
      });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = () => {
  if (!auth) return;
  return signOut(auth);
};
