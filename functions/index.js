/* eslint-disable */
// functions/index.js

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
// Firebase Functions v2
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions"); // Keep for v1 compatibility if needed
const { onRequest } = require('firebase-functions/v2/https');

// Firebase Admin
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

// Utilities
const axios = require("axios");
const { google } = require("googleapis");

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

// Import token removal functions
const { removeDownloadTokens, removeDownloadTokensOnFinalize, removeDownloadTokensOnMetadata } = require("./remove-tokens");

// Import teacher feedback functions
const teacherFeedbackFunctions = require("./teacherFeedback/index");

// Import test functions
const { testSchools } = require("./test-schools");

// Import setup functions
const { setupSharedDrive } = require("./setup-shared-drive");

// Import test functions
const { testSharedDriveAccess } = require("./test-shared-drive-access");

// Import Shared Drive management functions
const { createSharedDrive, updateSharedDriveId } = require("./create-shared-drive");

// Import debug function
const { debugSharedDriveAccess } = require("./debug-shared-drive-access");

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

// Extract form ID from Google Form URL
function extractFormId(url) {
  const match = url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Google Auth Helper
const getGoogleAuth = () => {
  const credentials = process.env.GOOGLE_KEY ? 
    JSON.parse(process.env.GOOGLE_KEY) : 
    require("./service-account.json");
  
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive",
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
// Imported from modular teacherFeedback/index.js
// Remove unused teacher feedback function exports
// exports.createCaseManagerFeedbackSystem = teacherFeedbackFunctions.createCaseManagerFeedbackSystem;
exports.createFeedbackFormSheet = teacherFeedbackFunctions.createFeedbackFormSheet;
exports.createFeedbackFormSheetWithUserAuth = teacherFeedbackFunctions.createFeedbackFormSheetWithUserAuth;
// exports.sendTeacherFeedbackForm = teacherFeedbackFunctions.sendTeacherFeedbackForm; // No longer used
// exports.getCaseManagerFeedbackSystem = teacherFeedbackFunctions.getCaseManagerFeedbackSystem;
// exports.syncFormResponses = teacherFeedbackFunctions.syncFormResponses;
// exports.autoSyncFormResponses = teacherFeedbackFunctions.autoSyncFormResponses;
// exports.generateFeedbackDocument = teacherFeedbackFunctions.generateFeedbackDocument;
exports.checkServiceAccountStorage = teacherFeedbackFunctions.checkServiceAccountStorage;
// exports.updateCaseManagerDocument = teacherFeedbackFunctions.updateCaseManagerDocument;
// exports.getCaseManagerResources = teacherFeedbackFunctions.getCaseManagerResources;


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

exports.healthCheck = onCall({
  region: "us-central1"
}, async (request) => {
  try {
    // Simple response to verify function is working
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Cloud Functions are operational'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw new HttpsError('internal', 'Health check failed');
  }
});

// ─── SECURE FILE ACCESS FUNCTIONS ────────────────────────────────────────────
exports.getStudentFileUrl = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireAuth(request);
  
  const { studentId, fileName } = request.data;
  
  // Validate inputs
  validateRequired(studentId, "Student ID");
  validateRequired(fileName, "File name");
  
  // Sanitize inputs
  const sanitizedStudentId = sanitizeString(studentId, 50);
  const sanitizedFileName = sanitizeString(fileName, 100);
  
  // Security checks
  checkSecurityThreats(sanitizedStudentId);
  checkSecurityThreats(sanitizedFileName);
  
  try {
    // Check if user has access to this student
    const studentDoc = await db.collection("students").doc(sanitizedStudentId).get();
    if (!studentDoc.exists) {
      throw new HttpsError("not-found", "Student not found");
    }
    
    const studentData = studentDoc.data();
    const staffIds = studentData.app?.staffIds || [];
    const caseManagerId = studentData.app?.studentData?.caseManagerId;
    
    // Authorization check
    const userRole = request.auth.token.role;
    const userId = request.auth.uid;
    
    const hasAccess = (
      // Super admins can access any file
      userRole === 'admin' || userRole === 'sped_chair' ||
      // 504 coordinators can access all files
      userRole === 'administrator_504_CM' ||
      // User is in the student's staff list
      staffIds.includes(userId) ||
      // Case manager can access their own student's files
      (userRole === 'case_manager' && userId === caseManagerId)
    );
    
    if (!hasAccess) {
      throw new HttpsError("permission-denied", "You don't have access to this student's files");
    }
    
    // Generate signed URL (expires in 5 minutes)
    const bucket = getStorage().bucket();
    
    // Check both possible file paths (students folder first for consistency)
    let filePath = `students/${sanitizedStudentId}/${sanitizedFileName}`;
    let file = bucket.file(filePath);
    
    // Check if file exists in students path
    let [exists] = await file.exists();
    
    // If not found, check encrypted-pdfs path (for backward compatibility)
    if (!exists) {
      filePath = `encrypted-pdfs/${sanitizedStudentId}/${sanitizedFileName}`;
      file = bucket.file(filePath);
      [exists] = await file.exists();
    }
    
    if (!exists) {
      throw new HttpsError("not-found", "File not found");
    }
    
    // Generate signed URL without download tokens
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000,  // 5 minutes
      version: 'v4',  // Use v4 signed URLs for better security
      responseDisposition: 'inline',  // Open in browser instead of downloading
      responseType: 'application/pdf'  // Set content type for PDF
    });
    
    console.log(`✅ Generated signed URL for ${filePath} (user: ${userId})`);
    
    return { url: signedUrl };
    
  } catch (error) {
    console.error(`❌ Error generating signed URL:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Failed to generate file URL: ${error.message}`);
  }
});

// Export token removal functions
exports.removeDownloadTokens = removeDownloadTokens;
exports.removeDownloadTokensOnFinalize = removeDownloadTokensOnFinalize;
exports.removeDownloadTokensOnMetadata = removeDownloadTokensOnMetadata;

// ─── SECURE FILE PROXY ─────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const downloadApp = express();
downloadApp.use(cors({ origin: true }));
downloadApp.use(express.json());

// Authentication middleware
downloadApp.use(async (req, res, next) => {
  const authHeader = req.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    req.user = await getAuth().verifyIdToken(idToken);
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
});

// File download endpoint
// URL format: /downloadStudentFile?studentId=ID&fileName=filename.pdf
downloadApp.get('/downloadStudentFile', async (req, res) => {
  const { studentId, fileName } = req.query;
  if (!studentId || !fileName) {
    return res.status(400).send('studentId and fileName required');
  }
  const { role, uid } = req.user;
  // Authorization check
  const docSnap = await db.collection('students').doc(studentId).get();
  if (!docSnap.exists) {
    return res.status(404).send('Student not found');
  }
  const data = docSnap.data();
  const staffIds = data.app?.staffIds || [];
  const caseManagerId = data.app?.studentData?.caseManagerId;
  const allowed = (
    role === 'admin' || role === 'sped_chair' || role === 'administrator_504_CM' ||
    staffIds.includes(uid) || (role === 'case_manager' && uid === caseManagerId)
  );
  if (!allowed) {
    return res.status(403).send('Forbidden');
  }
  // Stream file from private bucket
  const bucket = getStorage().bucket();
  
  // Check both possible file paths (students folder first for consistency)
  let filePath = `students/${studentId}/${fileName}`;
  let file = bucket.file(filePath);
  
  // Check if file exists in students path
  let [exists] = await file.exists();
  
  // If not found, check encrypted-pdfs path (for backward compatibility)
  if (!exists) {
    filePath = `encrypted-pdfs/${studentId}/${fileName}`;
    file = bucket.file(filePath);
    [exists] = await file.exists();
  }
  
  if (!exists) {
    return res.status(404).send('File not found');
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  file.createReadStream().pipe(res).on('error', err => {
    console.error('Stream error:', err);
    res.status(500).end();
  });
});

// HTTPS function proxy for secure file streaming
exports.downloadStudentFile = onRequest(
  { region: 'us-central1', allowUnauthenticated: false },
  downloadApp
);

// ─── STUDENT STAFF IDS MAINTENANCE ───────────────────────────────────────────
/**
 * Cloud Function to maintain staffIds array on student documents
 * Triggers on any write to students/{studentId} and computes the staffIds array
 * based on case manager, schedule teachers, and service providers
 */
exports.updateStudentStaffIds = onDocumentWritten({
  document: "students/{studentId}",
  region: "us-central1"
}, async (event) => {
  const studentId = event.params.studentId;
  const beforeData = event.data?.before?.data();
  const afterData = event.data?.after?.data();
  
  // If document was deleted, nothing to do
  if (!afterData) {
    console.log(`Student ${studentId} deleted, skipping staffIds update`);
    return null;
  }
  
  // Get existing staffIds to check if update is needed
  const existingStaffIds = afterData.app?.staffIds || [];
  
  const staffIds = new Set();
  
  // Add case manager
  const caseManagerId = afterData.app?.studentData?.caseManagerId;
  if (caseManagerId) {
    staffIds.add(caseManagerId);
    console.log(`Added case manager: ${caseManagerId}`);
  }
  
  // Add teachers from schedule (including co-teaching case managers)
  const schedule = afterData.app?.schedule?.periods || {};
  Object.entries(schedule).forEach(([period, data]) => {
    if (typeof data === 'string' && data) {
      // Simple string format (legacy)
      staffIds.add(data);
      console.log(`Added teacher from period ${period}: ${data}`);
    } else if (typeof data === 'object' && data) {
      // Object format with potential co-teaching
      if (data.teacherId) {
        staffIds.add(data.teacherId);
        console.log(`Added teacher from period ${period}: ${data.teacherId}`);
      }
      if (data.coTeaching?.caseManagerId) {
        staffIds.add(data.coTeaching.caseManagerId);
        console.log(`Added co-teaching CM from period ${period}: ${data.coTeaching.caseManagerId}`);
      }
    }
  });
  
  // Add service providers
  const providers = afterData.app?.providers || {};
  Object.entries(providers).forEach(([providerType, providerId]) => {
    if (providerId) {
      staffIds.add(providerId);
      console.log(`Added ${providerType} provider: ${providerId}`);
    }
  });
  
  // Convert Set to array
  const staffIdsArray = Array.from(staffIds).sort();
  
  // Check if staffIds actually changed
  const existingSorted = [...existingStaffIds].sort();
  const hasChanged = JSON.stringify(existingSorted) !== JSON.stringify(staffIdsArray);
  
  if (!hasChanged) {
    console.log(`No changes to staffIds for student ${studentId}, skipping update`);
    return null;
  }
  
  console.log(`Updating student ${studentId} with ${staffIdsArray.length} staff members`);
  
  try {
    await db
      .collection('students')
      .doc(studentId)
      .update({
        'app.staffIds': staffIdsArray,
        'app.lastStaffIdsUpdate': FieldValue.serverTimestamp()
      });
    
    console.log(`Successfully updated staffIds for student ${studentId}`);
    return { success: true, staffCount: staffIdsArray.length };
  } catch (error) {
    console.error(`Error updating staffIds for student ${studentId}:`, error);
    throw error;
  }
});

// Cloud Function: Sync paraeducator studentIds when a student document changes
exports.syncParaeducatorStudentAssignments = onDocumentWritten({
  document: 'students/{studentId}',
  region: 'us-central1'
}, async (event) => {
  const studentId = event.params.studentId;
  const afterData = event.data.after?.data();
  const schedule = afterData?.app?.schedule?.periods || {};

  // Read all aideSchedules docs with admin privileges
  const aideSchedulesSnap = await db.collection('aideSchedules').get();
  for (const docSnap of aideSchedulesSnap.docs) {
    const aideId = docSnap.id;
    const aideData = docSnap.data() || {};
    let include = false;

    // Direct assignment
    const direct = Array.isArray(aideData.directAssignment)
      ? aideData.directAssignment
      : (aideData.directAssignment ? [aideData.directAssignment] : []);
    if (direct.includes(studentId)) include = true;

    // Class assignments (co-teach included)
    if (!include && aideData.classAssignment) {
      for (const [period, teacherIds] of Object.entries(aideData.classAssignment)) {
        const arr = Array.isArray(teacherIds) ? teacherIds : [teacherIds];
        const pd = schedule[period];
        let teacherId;
        if (typeof pd === 'string') teacherId = pd;
        else if (pd && typeof pd === 'object') teacherId = pd.teacherId;
        else continue;
        if (arr.includes(teacherId)) { include = true; break; }
      }
    }

    const docRef = db.doc(`aideSchedules/${aideId}`);
    if (include) {
      await docRef.update({ studentIds: FieldValue.arrayUnion(studentId) });
    } else {
      await docRef.update({ studentIds: FieldValue.arrayRemove(studentId) });
    }
  }
});

// Cloud Function: Rebuild paraeducator studentIds when an aideSchedules document changes
exports.rebuildParaeducatorStudentIds = onDocumentWritten({
  document: 'aideSchedules/{aideId}',
  region: 'us-central1'
}, async (event) => {
  const aideId = event.params.aideId;
  const data = event.data.after?.data() || {};
  const direct = Array.isArray(data.directAssignment)
    ? data.directAssignment
    : (data.directAssignment ? [data.directAssignment] : []);
  const classAssign = data.classAssignment || {};
  const accessible = new Set(direct.filter(Boolean));

  // Fetch all students (server-side)
  const studentsSnap = await db.collection('students').get();
  for (const sDoc of studentsSnap.docs) {
    const student = { id: sDoc.id, ...sDoc.data() };
    const plan = student.app?.studentData?.plan;
    if (plan !== 'IEP' && plan !== '504') continue;
    const schedule = student.app?.schedule?.periods || {};
    for (const [period, teacherIds] of Object.entries(classAssign)) {
      const arr = Array.isArray(teacherIds) ? teacherIds : [teacherIds];
      const pd = schedule[period];
      let teacherId;
      if (typeof pd === 'string') teacherId = pd;
      else if (pd && typeof pd === 'object') teacherId = pd.teacherId;
      else continue;
      if (arr.includes(teacherId)) { accessible.add(student.id); break; }
    }
  }

  const docRef = db.doc(`aideSchedules/${aideId}`);
  await docRef.update({ studentIds: Array.from(accessible) });
});

// Test function to check schools collection
exports.testSchools = testSchools;

// Setup function for Shared Drive
exports.setupSharedDrive = setupSharedDrive;

// Test function for Shared Drive access
exports.testSharedDriveAccess = testSharedDriveAccess;

// Shared Drive management functions
exports.createSharedDrive = createSharedDrive;
exports.updateSharedDriveId = updateSharedDriveId;

// Debug function for Shared Drive access
exports.debugSharedDriveAccess = debugSharedDriveAccess;

// Export all teacher feedback functions
Object.assign(exports, teacherFeedbackFunctions);

