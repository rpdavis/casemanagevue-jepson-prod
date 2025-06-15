import { auth, db } from "./config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export function guardPage(allowedRoles, onUserLoaded) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      window.location.href = "/login.html";
      return;
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
      uid: firebaseUser.uid,
      email: data.email,
      name: data.name || data.email,
      role: data.role
    };
    window.currentUser = user;
    onUserLoaded(user);
  });
}