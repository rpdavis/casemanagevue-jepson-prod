// /Users/rd/CaseManageVue/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

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

console.log('🔥 Connected to Firebase project:', firebaseConfig.projectId);

export { auth, db, storage, functions, googleProvider };