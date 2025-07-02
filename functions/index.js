/* eslint-disable */
// functions/index.js

// ─── Imports ──────────────────────────────────────────────────────────────────
// UPDATED: Using 2nd gen Firebase Functions
const {onDocumentWritten, onCall} = require("firebase-functions/v2/firestore");
const {onCall: onCallHttps} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
const axios = require("axios"); // Add axios for HTTP requests

// ─── Init Admin SDK ───────────────────────────────────────────────────────────
// Initialize Firebase Admin with explicit service account
initializeApp({
  projectId: 'casemangervue'
});

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
// UPDATED: Using 2nd gen onDocumentWritten
// This function syncs custom claims whenever a user document in 'users/{uid}' is written.
// This is useful as a fallback or if user roles can be changed directly in Firestore.
exports.syncUserClaims = onDocumentWritten("users/{uid}", async (event) => {
      const uid = event.params.uid;
      const afterData = event.data?.after?.data();

      try {
        if (!event.data?.after?.exists) {
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
// UPDATED: Using 2nd gen onCall
// This function securely creates a user in Auth, adds their data to Firestore by UID,
// and sets their custom claims.
exports.addUserWithRole = onCallHttps(async (request) => {
  // 1. Authentication & Authorization Check
  // Only allow signed-in users with the 'admin' role (from custom claims) to call this function.
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new Error("Only administrators are authorized to add users.");
  }

  const {name, email, role} = request.data;

  // 2. Input Validation
  if (!name || !email || !role) {
    throw new Error("Name, email, and role are required fields.");
  }

  // 3. Role Validation
  const validRoles = ["admin", "teacher", "counselor", "principal", "assistant"];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  try {
    // 4. Create User in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email,
      password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Generate a random password
      displayName: name,
    });

    // 5. Set Custom Claims (Role-based permissions)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: role });

    // 6. Store Additional User Data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      role: role,
      createdAt: new Date(),
    });

    // 7. Return Success Response
    return {
      message: `User "${name}" (${email}) created successfully with role "${role}". They will need to reset their password on first login.`,
      uid: userRecord.uid,
    };

  } catch (error) {
    console.error("Error creating user:", error);

    // Handle specific Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      throw new Error(`A user with the email "${email}" already exists.`);
    } else if (error.code === "auth/invalid-email") {
      throw new Error(`The email address "${email}" is not valid.`);
    } else {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
});

// ─── Aeries API Proxy Functions ───────────────────────────────────────────────
// UPDATED: Using 2nd gen onCall
// These functions handle Aeries API calls server-side to avoid CORS issues
// Updated permissions to allow admin, administrator, administrator_504_CM, and sped_chair roles

// Helper function to check if user has admin access
function hasAdminAccess(request) {
  if (!request.auth) return false;
  
  const adminRoles = ["admin", "administrator", "administrator_504_CM", "sped_chair"];
  return adminRoles.includes(request.auth.token.role);
}

// Get Aeries OAuth token
exports.getAeriesToken = onCallHttps(async (request) => {
  // Check if user is authenticated and has admin role
  if (!hasAdminAccess(request)) {
    throw new Error("Only administrators can access Aeries API.");
  }

  const { baseUrl, clientId, clientSecret } = request.data;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error("Base URL, Client ID, and Client Secret are required.");
  }

  try {
    // Create base64 encoded credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post(`${baseUrl}/token`, 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      success: true,
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in
    };

  } catch (error) {
    console.error('Aeries token error:', error.response?.data || error.message);
    throw new Error(`Failed to get Aeries token: ${error.response?.data?.error_description || error.message}`);
  }
});

// Test Aeries API endpoint
exports.testAeriesEndpoint = onCallHttps(async (request) => {
  // Check if user is authenticated and has admin role
  if (!hasAdminAccess(request)) {
    throw new Error("Only administrators can access Aeries API.");
  }

  const { baseUrl, endpoint, accessToken } = request.data;

  if (!baseUrl || !endpoint || !accessToken) {
    throw new Error("Base URL, endpoint, and access token are required.");
  }

  try {
    const startTime = Date.now();
    
    const response = await axios.get(`${baseUrl}/ims/oneroster/v1p1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      success: true,
      data: response.data,
      responseTime,
      status: response.status
    };

  } catch (error) {
    console.error('Aeries API error:', error.response?.data || error.message);
    throw new Error(`API call failed: ${error.response?.data?.error_description || error.message}`);
  }
});

// Test custom Aeries endpoints (for special education data)
exports.testCustomAeriesEndpoint = onCallHttps(async (request) => {
  // Check if user is authenticated and has admin role
  if (!hasAdminAccess(request)) {
    throw new Error("Only administrators can access Aeries API.");
  }

  const { baseUrl, endpoint, accessToken } = request.data;

  if (!baseUrl || !endpoint || !accessToken) {
    throw new Error("Base URL, endpoint, and access token are required.");
  }

  try {
    const startTime = Date.now();
    
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      success: true,
      data: response.data,
      responseTime,
      status: response.status
    };

  } catch (error) {
    console.error('Custom Aeries API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error_description || error.message,
      status: error.response?.status
    };
  }
});

// TEMPORARY: Function to set user role (for testing purposes)
exports.setUserRole = onCallHttps(async (request) => {
  // Only allow this in development/testing
  if (process.env.NODE_ENV === 'production') {
    throw new Error("This function is not available in production.");
  }

  const { userId, role } = request.data;

  if (!userId || !role) {
    throw new Error("User ID and role are required.");
  }

  const validRoles = ["admin", "administrator", "administrator_504_CM", "sped_chair", "case_manager", "teacher", "service_provider"];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  try {
    await db.collection("users").doc(userId).update({
      role: role
    });

    return {
      success: true,
      message: `Role set to '${role}' for user ${userId}`
    };

  } catch (error) {
    console.error("Error setting user role:", error);
    throw new Error(`Failed to set user role: ${error.message}`);
  }
});

// TEMPORARY: Function to manually trigger user claims sync
exports.triggerUserClaimsSync = onCallHttps(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new Error("User ID is required.");
  }

  try {
    // Get the current user document
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found in Firestore.`);
    }

    const userData = userDoc.data();
    console.log(`Current user data for ${userId}:`, userData);

    // Update the document to trigger the sync function
    await db.collection("users").doc(userId).update({
      lastSyncTrigger: new Date().toISOString()
    });

    return {
      success: true,
      message: `Triggered sync for user ${userId}. Check function logs for details.`,
      currentRole: userData.role
    };

  } catch (error) {
    console.error("Error triggering user claims sync:", error);
    throw new Error(`Failed to trigger sync: ${error.message}`);
  }
});
