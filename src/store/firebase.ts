import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration extracted from the google-services.json file provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBDv1veBWmGgbBSfzbE6PV5LqCSgoX_3mw",
  authDomain: "my-root-in.firebaseapp.com",
  projectId: "my-root-in",
  storageBucket: "my-root-in.firebasestorage.app",
  messagingSenderId: "907074249813",
  appId: "1:907074249813:android:ab61b376040493378620dc"
};

// Initialize Firebase App in a safe way for React Native / Expo environment
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
