import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase Web config (create a Web App in Firebase Console)
// Put these in frontend .env (Vite): VITE_FIREBASE_API_KEY, etc.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} as const;

const app = initializeApp(firebaseConfig);
export const fbAuth = getAuth(app);
