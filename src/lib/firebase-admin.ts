import {
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  'demo-project';

const usingEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST
);

const firebaseApp =
  getApps()[0] ??
  initializeApp({
    projectId,
    ...(usingEmulators
      ? {}
      : {
          credential: applicationDefault(),
        }),
  });

export const firebaseAuth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export { firebaseApp };
