// public/firebase/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

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

export { 
  app, 
  auth, 
  db, 
  storage, 
  firebaseConfig,
  googleProvider  // Make the configured provider available
};