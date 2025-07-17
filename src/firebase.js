// /Users/rd/CaseManageVue/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator 
} from "firebase/firestore";
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

let app;
let auth;
let db;
let storage;
let functions;
let googleProvider;

// Initialize Firebase services
const initializeFirebase = async () => {
  try {
    // Initialize Firebase app if not already initialized
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase app initialized');
    }

    // Initialize Auth if not already initialized
    if (!auth) {
      auth = getAuth(app);
      console.log('🔐 Firebase Auth initialized');
    }

    // Initialize Firestore if not already initialized
    if (!db) {
      db = getFirestore(app);
      
      // Configure Firestore settings
      db.settings({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true
      });

      // Enable offline persistence
      try {
        await enableIndexedDbPersistence(db, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          synchronizeTabs: true
        });
        console.log('📦 Firestore offline persistence enabled');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence enabled in another tab');
        } else if (err.code === 'unimplemented') {
          console.warn('Browser doesn\'t support persistence');
        } else {
          console.error('Error enabling persistence:', err);
        }
      }
      
      console.log('🗄️ Firestore initialized');
    }

    // Initialize Storage if not already initialized
    if (!storage) {
      storage = getStorage(app);
      console.log('📁 Firebase Storage initialized');
    }

    // Initialize Functions if not already initialized
    if (!functions) {
      functions = getFunctions(app);
      console.log('⚡ Firebase Functions initialized');
    }

    // Initialize Google Auth Provider if not already initialized
    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
      console.log('🔑 Google Auth Provider initialized');
    }

    console.log('✅ All Firebase services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
};

// Initialize immediately
initializeFirebase().catch(console.error);

// Set up error handler for Firestore
db.onError = (error) => {
  console.error('Firestore error:', error);
  handleFirebaseError(error);
};

console.log('🔥 Connected to Firebase project:', firebaseConfig.projectId);

// Export initialized services and initialization function
export { 
  auth, 
  db, 
  storage, 
  functions, 
  googleProvider,
  initializeFirebase // Export for manual re-initialization if needed
};