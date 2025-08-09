// /Users/rd/CaseManageVue/src/firebase.js

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence
} from "firebase/auth";
import { 
  getFirestore
} from "firebase/firestore";
import { 
  getStorage
} from "firebase/storage";
import { 
  getFunctions
} from "firebase/functions";

// Jepson Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXMm_ZBTXOd7k0e9FqQkvRRBOWfMUtGZ8",
  authDomain: "casemanagevue-jepson-prod.firebaseapp.com",
  projectId: "casemanagevue-jepson-prod",
  storageBucket: "casemanagevue-jepson-prod.firebasestorage.app",
  messagingSenderId: "1017885957186",
  appId: "1:1017885957186:web:f561608ff50c63730661db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Production-only configuration - no emulators

// Set auth persistence for production
auth.setPersistence(browserLocalPersistence).then(() => {
  console.log('🔒 Firebase auth persistence set to LOCAL - each tab maintains independent auth state');
}).catch((error) => {
  console.error('❌ Error setting auth persistence:', error);
});

// Production Firebase configuration complete

// Set up Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Gmail scope check removed to prevent OAuth errors
// The app will work without Gmail scope for basic functionality

console.log('🔥 Connected to Firebase project:', firebaseConfig.projectId);

export { auth, db, storage, functions, googleProvider };