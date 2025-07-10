// /Users/rd/CaseManageVue/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Environment-based configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Functions with the correct region
const functions = getFunctions(app, 'us-central1');

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Connecting to Firebase emulators...');
  
  // Connect to Firestore emulator (if not already connected)
  try {
    if (!db._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('📊 Connected to Firestore emulator');
    }
  } catch (error) {
    console.log('📊 Firestore emulator already connected or unavailable');
  }
  
  // Connect to Storage emulator (if not already connected)
  try {
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('💾 Connected to Storage emulator');
    }
  } catch (error) {
    console.log('💾 Storage emulator already connected or unavailable');
  }
  
  // Connect to Functions emulator (if not already connected)
  try {
    if (!functions._delegate._url.includes('localhost')) {
      connectFunctionsEmulator(functions, 'localhost', 5002);
      console.log('⚡ Connected to Functions emulator');
    }
  } catch (error) {
    console.log('⚡ Functions emulator already connected or unavailable');
  }
}

// Configure Google OAuth Provider with Sheets API scope
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Export the services for use throughout the application
export {
  app,
  auth,
  db,
  storage,
  functions,
  googleProvider
};