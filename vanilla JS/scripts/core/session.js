// session.js
import { auth, db } from "../config/config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export function guardPage(allowedRoles, onUserLoaded) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      window.location.href = "/login.html";
      return;
    }

    try {
      await firebaseUser.getIdTokenResult(true);
    } catch (err) {
      console.error("❌ Error refreshing ID token:", err);
    }

    const udoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (!udoc.exists()) {
      alert("User not found");
      window.location.href = "/login.html";
      return;
    }

    const data = udoc.data();
    if (!allowedRoles.includes(data.role)) {
      alert("No permission");
      window.location.href = "/login.html";
      return;
    }

    const user = {
      uid:   firebaseUser.uid,
      email: data.email,
      name:  data.name || data.email,
      role:  data.role
    };

    window.currentUser = user;

    // --- NEW CODE START ---
    // Retrieve the stored access token from session storage
    const googleAccessToken = sessionStorage.getItem('googleAccessToken');
    if (googleAccessToken) {
      // Attach it to the window object for use by other scripts (like index.js)
      window.googleAccessToken = googleAccessToken;
    }
    // --- NEW CODE END ---

    onUserLoaded(user);
  });
}