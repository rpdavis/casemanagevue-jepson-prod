// session.js
import { auth, db } from "../config/config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * guardPage — ensures only signed-in users with allowed roles can access the page.
 * @param {string[]} allowedRoles — array of roles permitted on this page
 * @param {(user:Object)=>void} onUserLoaded — callback once user is validated
 */
export function guardPage(allowedRoles, onUserLoaded) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      // Not signed in → send to login
      window.location.href = "/login.html";
      return;
    }
 console.log("Before getIdTokenResult(true)");
    // ── NEW: force-refresh the ID token so custom claims (role) are included ──
    try {
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      
           console.log("After getIdTokenResult(true)"); // LINE B
      console.log("🔄 Token refreshed; claims:", idTokenResult.claims); // LINE C
      console.log("Full idTokenResult object:", idTokenResult); // LINE D
    } catch (err) {
      console.error("❌ Error refreshing ID token:", err);
      // (we still proceed to Firestore check below)
    }

    // ── Your existing user-doc lookup and role-check logic ──
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

    // expose current user globally and invoke your page initializer
    window.currentUser = user;
    onUserLoaded(user);
  });
}