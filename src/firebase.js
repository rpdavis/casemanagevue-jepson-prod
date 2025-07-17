// /Users/rd/CaseManageVue/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { handleFirebaseError } from '@/utils/firebaseErrorHandler';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDx1jbQT-FzgzjASFqVA2kbAHWJ_TeUzdY",
  authDomain: "casemangervue.firebaseapp.com",
  projectId: "casemangervue",
  storageBucket: "casemangervue.firebasestorage.app",
  messagingSenderId: "756483333257",
  appId: "1:756483333257:web:694e2ad2415b7886563a58",
  measurementId: "G-YBRDQX9NFR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Set up Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence with unlimited cache
enableIndexedDbPersistence(db, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  synchronizeTabs: true
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser doesn\'t support persistence.')
  } else {
    console.error('Error enabling persistence:', err)
  }
});

// Configure Firestore settings
db.settings({
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true, // Force long polling instead of WebSocket
  experimentalAutoDetectLongPolling: true // Auto-detect best connection method
});

// Set up error handler for Firestore
db.onError = (error) => {
  console.error('Firestore error:', error);
  handleFirebaseError(error);
};

console.log('🔥 Connected to Firebase project:', firebaseConfig.projectId);

export { auth, db, storage, functions, googleProvider };