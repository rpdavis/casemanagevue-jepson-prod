/* eslint-disable */
// functions/index.js

// ─── Imports ──────────────────────────────────────────────────────────────────
// IMPORTANT CHANGE HERE: Destructure firestore AND https. 'auth' removed as onUserSignIn is commented.
const {firestore, https} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");

// ─── Init Admin SDK ───────────────────────────────────────────────────────────
initializeApp();
const db = getFirestore();
const adminAuth = getAuth(); // Renamed to avoid conflict with 'auth' from firebase-functions

// Define valid roles for server-side validation
const VALID_ROLES_SERVER = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider",
];

// ─── 1) Auth trigger: runs when a new user account is created ─────────────────
// This function is currently commented out. If uncommented, it would set claims
// when a user first signs up via Firebase Auth itself.
// exports.onUserSignIn = auth.user().onCreate(async (user) => {
//     const email = (user.email || "").toLowerCase();
//     const displayName = user.displayName || "";

//     if (!email) {
//         console.log("⚠️ New user has no email; skipping role assignment.");
//         return;
//     }

//     try {
//         // Fetch user doc from Firestore based on email (assuming initial email-based docs exist or are created elsewhere)
//         const userSnap = await db.collection("users").doc(email).get();
//         if (!userSnap.exists) {
//             console.log(`ℹ️ No /users/${email} doc; skipping setting custom claims on Auth user.`);
//             return;
//         }

//         const { role, name } = userSnap.data();
//         if (role) {
//             await adminAuth.setCustomUserClaims(user.uid, { role });
//             console.log(`✅ Set custom claim for ${email}: role='${role}'`);
//         }

//         // Ensure usersByUID collection is always kept in sync
//         await db.collection("usersByUID").doc(user.uid).set({
//             uid: user.uid,
//             email,
//             name: name || displayName,
//             role: role || null,
//             createdAt: new Date().toISOString()
//         }, { merge: true });
//         console.log(`✅ Synced usersByUID/${user.uid} on user creation.`);
//     } catch (err) {
//         console.error("❌ onUserSignIn error:", err);
//     }
// });


// ─── 2) Firestore trigger: sync on writes to users/{uid} ──────────────────────
// This function syncs custom claims whenever a user document in 'users/{uid}' is written.
// This is useful as a fallback or if user roles can be changed directly in Firestore.
exports.syncUserClaims = firestore
    .document("users/{uid}")
    .onWrite(async (change, context) => {
      const uid = context.params.uid;
      const afterData = change.after.exists ? change.after.data() : null;

      try {
        if (!change.after.exists) {
          // Document deleted, remove claims from Auth user (if user still exists in Auth)
          const userRec = await adminAuth.getUser(uid);
          await adminAuth.setCustomUserClaims(userRec.uid, null);
          console.log(`✅ Removed claims for UID: ${uid} (Firestore doc deleted)`);
          return;
        }

        const {role, name, email: firestoreEmail} = afterData;
        if (!role) {
          console.log(`ℹ️ /users/${uid} missing role in Firestore doc; skipping custom claim sync.`);
          return;
        }

        // Get the user record by UID directly from Auth
        const userRec = await adminAuth.getUser(uid);

        // Set custom claims on the Firebase Auth user record
        await adminAuth.setCustomUserClaims(userRec.uid, {role});
        console.log(`✅ Updated custom claims for UID ${uid}: role='${role}'`);

        // Optionally: keep usersByUID collection in sync (if used for other purposes)
        await db.collection("usersByUID").doc(userRec.uid).set({
          uid: userRec.uid,
          email: firestoreEmail || userRec.email, // Prefer email from Firestore, fallback to Auth user
          name: name || userRec.displayName || "",
          role,
        }, {merge: true});
        console.log(`✅ Synced usersByUID/${userRec.uid}`);
      } catch (err) {
        // auth/user-not-found occurs if a Firestore user doc exists but no corresponding Auth user.
        if (err.code === "auth/user-not-found") {
          console.log(`ℹ️ No Auth user for UID ${uid} yet; will sync when Auth user is created/linked.`);
        } else {
          console.error(`❌ syncUserClaims error for UID ${uid}:`, err);
        }
      }
    });

// ─── NEW: HTTPS Callable Function to Add User via Admin Panel ─────────────
// This function securely creates a user in Auth, adds their data to Firestore by UID,
// and sets their custom claims.
exports.addUserWithRole = https.onCall(async (data, context) => {
  // 1. Authentication & Authorization Check
  // Only allow signed-in users with the 'admin' role (from custom claims) to call this function.
  if (!context.auth || context.auth.token.role !== "admin") {
    throw new https.HttpsError(
        "permission-denied",
        "Only administrators are authorized to add users.",
    );
  }

  const {name, email, role} = data;

  // 2. Input Validation
  if (!name || !email || !role) {
    throw new https.HttpsError(
        "invalid-argument",
        "Name, email, and role are required fields.",
    );
  }
  if (!VALID_ROLES_SERVER.includes(role)) {
    throw new https.HttpsError(
        "invalid-argument",
        `Invalid role specified: ${role}.`,
    );
  }

  try {
    // 3. Create User in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      displayName: name,
      emailVerified: true, // Assuming manually added users are considered verified
    });

    const uid = userRecord.uid; // Get the UID generated by Firebase Auth

    // 4. Store User Data in Firestore (using UID as document ID)
    await db.collection("users").doc(uid).set({
      name: name,
      email: email,
      role: role,
    });
    console.log(`✅ Firestore user document created for UID: ${uid}, Email: ${email}`);

    // 5. Set Custom Claims on the Firebase Auth user record
    // This makes the role available in the client's ID token and for security rules.
    await adminAuth.setCustomUserClaims(uid, {role});
    console.log(`✅ Custom claims set for Auth user UID: ${uid}, role: '${role}'`);

    // The syncUserClaims function will also trigger on the Firestore write,
    // but setting claims here directly means it's available sooner.

    return {success: true, message: `User "${name}" (${email}) added successfully with role "${role}".`};
  } catch (error) {
    console.error("❌ Error in addUserWithRole Cloud Function:", error);
    // Handle specific Firebase Auth errors gracefully
    if (error.code === "auth/email-already-exists") {
      throw new https.HttpsError(
          "already-exists",
          `The email address "${email}" is already in use by another account.`,
      );
    } else if (error.code === "auth/invalid-email") {
      throw new https.HttpsError(
          "invalid-argument",
          `The provided email address "${email}" is not valid.`,
      );
    } else {
      // General error
      throw new https.HttpsError(
          "internal",
          "An unexpected error occurred while adding the user.",
          error.message, // Include original message for debugging
      );
    }
  }
});
