import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your configuration from the original config.js
const firebaseConfig = {
  apiKey: "AIzaSyAVLsa7zslsuVOtbYlsxsaNBHRVNOtBpb0",
  authDomain: "case-manager-app-9125d.firebaseapp.com",
  projectId: "case-manager-app-9125d",
  storageBucket: "case-manager-app-9125d.firebasestorage.app",
  messagingSenderId: "1013905438190",
  appId: "1:1013905438190:web:6794ef941ce8a3bf224aff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google OAuth Provider with Calendar scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// Export the services for use throughout the application
export {
  app,
  auth,
  db,
  storage,
  googleProvider
};