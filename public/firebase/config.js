// public/firebase/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVLsa7zslsuVOtbYlsxsaNBHRVNOtBpb0",
  authDomain: "case-manager-app-9125d.firebaseapp.com",
  projectId: "case-manager-app-9125d",
  // usually this ends with ".appspot.com" — verify in your Console:
  storageBucket: "case-manager-app-9125d.appspot.com",
  messagingSenderId: "1013905438190",
  appId: "1:1013905438190:web:6794ef941ce8a3bf224aff"
};

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };


