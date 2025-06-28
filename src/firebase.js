// /Users/rd/CaseManageVue/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your configuration from the original config.js
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Functions with the correct region
const functions = getFunctions(app, 'us-central1');

// Configure Google OAuth Provider (removed Calendar scopes)
const googleProvider = new GoogleAuthProvider();

// Export the services for use throughout the application
export {
  app,
  auth,
  db,
  storage,
  functions,
  googleProvider
};