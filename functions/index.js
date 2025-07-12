/* eslint-disable */
// functions/index.js

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
// Firebase Functions v2
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions"); // Keep for v1 compatibility if needed

// Firebase Admin
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

// Utilities
const axios = require("axios");
const { google } = require("googleapis");

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VALID_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider",
  "paraeducator"
];

const ADMIN_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair"
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
}

function requireRole(request, allowedRoles) {
  requireAuth(request);
  if (!allowedRoles.includes(request.auth.token.role)) {
    throw new HttpsError("permission-denied", "Insufficient permissions");
  }
}

// Input validation and sanitization
function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, maxLength);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new HttpsError("invalid-argument", `${fieldName} is required`);
  }
}

function checkSecurityThreats(input) {
  if (typeof input !== 'string') return;
  
  const threats = [];
  
  // Check for script injection
  if (/<script|javascript:|vbscript:|onload=|onerror=/i.test(input)) {
    threats.push('Script injection attempt');
  }
  
  // Check for SQL injection patterns
  if (/(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b).*(\bfrom\b|\binto\b|\bwhere\b)/i.test(input)) {
    threats.push('SQL injection pattern');
  }
  
  // Check for path traversal
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i.test(input)) {
    threats.push('Path traversal attempt');
  }
  
  if (threats.length > 0) {
    throw new HttpsError("invalid-argument", `Security threat detected: ${threats.join(', ')}`);
  }
}

// Google Auth Helper
const getGoogleAuth = () => {
  const credentials = process.env.GOOGLE_KEY ? 
    JSON.parse(process.env.GOOGLE_KEY) : 
    require("./service-account.json");
  
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/forms.responses.readonly",
      "https://www.googleapis.com/auth/gmail.send"
    ],
  });
};

// ─── USER MANAGEMENT FUNCTIONS ────────────────────────────────────────────────
exports.syncUserClaims = onDocumentWritten({
  document: "users/{uid}",
  region: "us-central1"
}, async (event) => {
  const uid = event.params.uid;
  const afterData = event.data?.after?.data();

  try {
    // If document was deleted, only remove claims (don't delete the user)
    if (!event.data?.after?.exists) {
      try {
        const userRec = await adminAuth.getUser(uid);
        await adminAuth.setCustomUserClaims(userRec.uid, null);
        console.log(`✅ Removed claims for UID: ${uid}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`User ${uid} not found in Auth`);
        } else {
          console.error(`❌ Error removing claims: ${uid}`, error);
        }
      }
      return;
    }

    const { role, name, email: firestoreEmail } = afterData;
    if (!role) {
      console.log(`ℹ️ No role in document; skipping sync`);
      return;
    }

    const userRec = await adminAuth.getUser(uid);
    await adminAuth.setCustomUserClaims(userRec.uid, { role });
    console.log(`✅ Updated claims for ${uid}: ${role}`);

    await db.collection("usersByUID").doc(uid).set({
      uid,
      email: firestoreEmail || userRec.email,
      name: name || userRec.displayName || "",
      role
    }, { merge: true });
    
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log(`ℹ️ Auth user not found for UID ${uid}`);
    } else {
      console.error(`❌ syncUserClaims error:`, err);
    }
  }
});

exports.addUserWithRole = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ["admin"]);

  const { name, email, role, provider, aeriesId } = request.data;
  
  // Comprehensive input validation
  validateRequired(name, "Name");
  validateRequired(email, "Email");
  validateRequired(role, "Role");
  
  // Sanitize inputs
  const sanitizedName = sanitizeString(name, 100);
  const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
  const sanitizedRole = sanitizeString(role, 50);
  const sanitizedProvider = provider ? sanitizeString(provider, 10) : null;
  const sanitizedAeriesId = aeriesId ? sanitizeString(aeriesId, 20) : null;
  
  // Security threat detection
  checkSecurityThreats(sanitizedName);
  checkSecurityThreats(sanitizedEmail);
  checkSecurityThreats(sanitizedRole);
  if (sanitizedProvider) checkSecurityThreats(sanitizedProvider);
  if (sanitizedAeriesId) checkSecurityThreats(sanitizedAeriesId);
  
  // Validate email format
  if (!validateEmail(sanitizedEmail)) {
    throw new HttpsError("invalid-argument", "Invalid email format");
  }
  
  // Validate role
  if (!VALID_ROLES.includes(sanitizedRole)) {
    throw new HttpsError("invalid-argument", `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}`);
  }

  try {
    const userRecord = await adminAuth.createUser({
      email: sanitizedEmail,
      password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
      displayName: sanitizedName,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: sanitizedRole });

    const userData = {
      name: sanitizedName,
      email: sanitizedEmail,
      role: sanitizedRole,
      createdAt: new Date().toISOString(),
      ...(sanitizedProvider && { provider: sanitizedProvider }),
      ...(sanitizedAeriesId && { aeriesId: sanitizedAeriesId })
    };

    await db.collection("users").doc(userRecord.uid).set(userData);

    return { 
      success: true,
      message: `User "${sanitizedName}" created successfully`,
      uid: userRecord.uid
    };

  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", `Email "${sanitizedEmail}" already in use`);
    }
    throw new HttpsError("internal", `User creation failed: ${error.message}`);
  }
});

// Add after syncUserClaims function
exports.deleteUserAuth = onCall({
  region: "us-central1"
}, async (request) => {
  requireRole(request, ["admin"]);

  const { uid } = request.data;
  validateRequired(uid, "User ID");

  try {
    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);
    console.log(`✅ Deleted user from Firebase Auth: ${uid}`);
    
    // Also delete from usersByUID collection if it exists
    try {
      await db.collection("usersByUID").doc(uid).delete();
    } catch (error) {
      console.log(`Failed to delete from usersByUID: ${error.message}`);
    }
    
    return { 
      success: true,
      message: `User ${uid} deleted from Firebase Auth`
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return {
        success: true,
        message: `User ${uid} not found in Firebase Auth`
      };
    }
    throw new HttpsError("internal", `Failed to delete user: ${error.message}`);
  }
});

// Add after deleteUserAuth function
exports.deleteAllUsers = onCall({
  region: "us-central1"
}, async (request) => {
  requireRole(request, ["admin"]);

  try {
    // Get all users from Firebase Auth
    const listUsersResult = await adminAuth.listUsers();
    
    // Delete each user from Auth and usersByUID
    const deletePromises = listUsersResult.users.map(async userRecord => {
      try {
        await adminAuth.deleteUser(userRecord.uid);
        console.log(`✅ Deleted user from Auth: ${userRecord.uid}`);
        
        // Also delete from usersByUID if it exists
        try {
          await db.collection("usersByUID").doc(userRecord.uid).delete();
        } catch (error) {
          console.log(`Failed to delete from usersByUID: ${userRecord.uid} - ${error.message}`);
        }
      } catch (error) {
        console.error(`❌ Failed to delete user ${userRecord.uid}:`, error);
      }
    });
    
    await Promise.all(deletePromises);
    
    return { 
      success: true,
      message: `Deleted ${listUsersResult.users.length} users from Firebase Auth`
    };
  } catch (error) {
    throw new HttpsError("internal", `Failed to delete users: ${error.message}`);
  }
});

// Add Firestore trigger to delete Auth user when Firestore user is deleted
exports.cleanupDeletedUser = onDocumentWritten({
  document: "users/{userId}",
  region: "us-central1"
}, async (event) => {
  // Only run on delete
  if (event.data.after?.exists) return;

  const userId = event.params.userId;
  console.log(`🗑️ User document deleted from Firestore, cleaning up: ${userId}`);
  
  try {
    // Delete from Auth
    await adminAuth.deleteUser(userId);
    console.log(`✅ Deleted user from Auth after Firestore delete: ${userId}`);
    
    // Delete from usersByUID if it exists
    try {
      await db.collection("usersByUID").doc(userId).delete();
      console.log(`✅ Deleted user from usersByUID: ${userId}`);
    } catch (error) {
      if (error.code === 'not-found') {
        console.log(`User ${userId} not found in usersByUID`);
      } else {
        console.error(`❌ Failed to delete from usersByUID: ${error.message}`);
      }
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${userId} not found in Auth - already deleted`);
    } else {
      console.error(`❌ Failed to delete user from Auth: ${userId}`, error);
    }
  }
});

// ─── AERIES API FUNCTIONS ────────────────────────────────────────────────────
exports.getAeriesToken = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ADMIN_ROLES);

  const { baseUrl, clientId, clientSecret } = request.data;
  if (!baseUrl || !clientId || !clientSecret) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await axios.post(`${baseUrl}/token`, 
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    };

  } catch (error) {
    console.error("Aeries token error:", error.response?.data || error.message);
    throw new HttpsError("internal", "Failed to get Aeries token");
  }
});

// ─── TEACHER FEEDBACK FUNCTIONS ──────────────────────────────────────────────
exports.sendTeacherFeedbackForm = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ["case_manager"]);

  const { formUrl, studentId, teacherEmails, formTitle, customMessage } = request.data;
  
  if (!formUrl || !studentId || !teacherEmails?.length) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    // Get student data
    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      throw new HttpsError("not-found", "Student not found");
    }
    const student = studentDoc.data();

    // Prepare email
    const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
    const caseManager = request.auth.token.name || request.auth.token.email;
    
    const subject = formTitle || `Teacher Feedback Request - ${studentName}`;
    const message = customMessage || 
`Dear Teacher,

Please provide feedback for ${studentName} (Grade ${student.grade || "N/A"}):

${formUrl}

Thank you,
${caseManager}
Case Manager`.trim();

    // Send emails via Gmail API
    const auth = getGoogleAuth();
    const gmail = google.gmail({ version: "v1", auth: await auth.getClient() });

    const results = await Promise.allSettled(
      teacherEmails.map(email => {
        const raw = [
          `To: ${email}`,
          `Subject: ${subject}`,
          "Content-Type: text/plain; charset=UTF-8",
          "",
          message
        ].join("\n");

        return gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: Buffer.from(raw).toString("base64")
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "")
          }
        });
      })
    );

    // Log results
    const successful = results.filter(r => r.status === "fulfilled").length;
    await db.collection("feedbackSendLog").add({
      studentId,
      studentName,
      caseManagerId: request.auth.uid,
      caseManager,
      formUrl,
      teacherEmails,
      successful,
      failed: results.length - successful,
      sentAt: new Date().toISOString()
    });

    return {
      success: true,
      sent: successful,
      failed: results.length - successful
    };

  } catch (error) {
    console.error("Feedback form error:", error);
    throw new HttpsError("internal", "Failed to send feedback forms");
  }
});

// ─── MANUAL SYNC FUNCTION ────────────────────────────────────────────────────
exports.syncFormResponses = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ["case_manager", "admin", "sped_chair"]);
  
  const { spreadsheetId, sheetName = "Form Responses 1" } = request.data;
  
  if (!spreadsheetId) {
    throw new HttpsError("invalid-argument", "Spreadsheet ID required");
  }

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return { success: true, message: "No responses found", synced: 0 };
    }

    const batch = db.batch();
    const [headers, ...dataRows] = rows;
    let syncedCount = 0;

    dataRows.forEach((row, index) => {
      if (!row.length) return;
      
      const docRef = db.collection("feedbackResponses").doc(`${spreadsheetId}_row_${index + 2}`);
      const data = headers.reduce((obj, header, i) => ({ 
        ...obj, 
        [header]: row[i] || "" 
      }), {
        spreadsheetId,
        rowNumber: index + 2,
        syncedAt: new Date().toISOString(),
        syncedBy: request.auth.uid
      });

      batch.set(docRef, data, { merge: true });
      syncedCount++;
    });

    await batch.commit();

    return {
      success: true,
      message: `Successfully synced ${syncedCount} responses`,
      synced: syncedCount
    };

  } catch (error) {
    console.error("Manual sync error:", error);
    throw new HttpsError("internal", "Failed to sync responses");
  }
});

// ─── SCHEDULED FUNCTIONS ─────────────────────────────────────────────────────
exports.autoSyncFormResponses = onSchedule({
  schedule: "every 30 minutes",
  region: "us-central1"
}, async (event) => {
  try {
    const formsSnapshot = await db.collection("feedbackForms")
      .where("active", "==", true)
      .get();

    if (formsSnapshot.empty) return;

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    for (const formDoc of formsSnapshot.docs) {
      const { responseSpreadsheetId, title } = formDoc.data();
      if (!responseSpreadsheetId) continue;

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: responseSpreadsheetId,
          range: "Form Responses 1!A:Z"
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) continue;

        const batch = db.batch();
        const [headers, ...dataRows] = rows;

        dataRows.forEach((row, index) => {
          if (!row.length) return;
          
          const docRef = db.collection("feedbackResponses").doc(`${responseSpreadsheetId}_row_${index + 2}`);
          const data = headers.reduce((obj, header, i) => ({ 
            ...obj, 
            [header]: row[i] || "" 
          }), {
            spreadsheetId,
            formId: formDoc.id,
            formTitle: title,
            rowNumber: index + 2,
            syncedAt: new Date().toISOString()
          });

          batch.set(docRef, data, { merge: true });
        });

        await batch.commit();
        console.log(`Synced ${dataRows.length} responses for ${title}`);

      } catch (error) {
        console.error(`Sync failed for ${title}:`, error);
      }
    }
  } catch (error) {
    console.error("Auto-sync error:", error);
  }
});

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
exports.getStudentFeedback = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireAuth(request);
  
  const { studentId } = request.data;
  if (!studentId) {
    throw new HttpsError("invalid-argument", "Student ID required");
  }

  try {
    const snapshot = await db.collection("feedbackResponses")
      .where("studentId", "==", studentId)
      .orderBy("syncedAt", "desc")
      .get();

    return {
      responses: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };

  } catch (error) {
    console.error("Get feedback error:", error);
    throw new HttpsError("internal", "Failed to retrieve feedback");
  }
});

exports.healthCheck = functions.https.onCall(async (data, context) => {
  try {
    // Simple response to verify function is working
    return {
      status: 'ok',
      timestamp: admin.firestore.Timestamp.now(),
      message: 'Cloud Functions are operational'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw new functions.https.HttpsError('internal', 'Health check failed');
  }
});