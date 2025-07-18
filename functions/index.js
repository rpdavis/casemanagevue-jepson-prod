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

// ─── ENHANCED SECURITY HELPER FUNCTIONS ──────────────────────────────────────
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

// Enhanced input validation and sanitization
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

// Enhanced security threat detection
function checkSecurityThreats(input) {
  if (typeof input !== 'string') return { isSafe: true, threats: [] };
  
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
  
  // Check for HTML injection
  if (/<[^>]*>/i.test(input)) {
    threats.push('HTML injection attempt');
  }
  
  if (threats.length > 0) {
    throw new HttpsError("invalid-argument", `Security threat detected: ${threats.join(', ')}`);
  }
  
  return { isSafe: true, threats: [] };
}

// Enhanced student data validation
function validateStudentData(data) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError("invalid-argument", "Invalid student data");
  }
  
  // Validate required fields
  if (!data.app || !data.app.studentData) {
    throw new HttpsError("invalid-argument", "Student data structure is invalid");
  }
  
  const studentData = data.app.studentData;
  
  // Validate required student fields
  validateRequired(studentData.firstName, "First name");
  validateRequired(studentData.lastName, "Last name");
  validateRequired(studentData.caseManagerId, "Case manager");
  
  // Sanitize text fields
  const textFields = ['firstName', 'lastName', 'instruction', 'assessment'];
  textFields.forEach(field => {
    if (studentData[field]) {
      checkSecurityThreats(studentData[field]);
      studentData[field] = sanitizeString(studentData[field], 100);
    }
  });
  
  // Validate encrypted fields are strings or null
  if (data.app.accommodations && typeof data.app.accommodations !== 'string' && data.app.accommodations !== null) {
    throw new HttpsError("invalid-argument", "Accommodations must be encrypted string or null");
  }
  
  if (data.app.classServices && typeof data.app.classServices !== 'string' && data.app.classServices !== null) {
    throw new HttpsError("invalid-argument", "Class services must be encrypted string or null");
  }
  
  if (studentData.plan && typeof studentData.plan !== 'string' && studentData.plan !== null) {
    throw new HttpsError("invalid-argument", "Student plan must be encrypted string or null");
  }
  
  return true;
}

// Enhanced user data validation
function validateUserData(data) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError("invalid-argument", "Invalid user data");
  }
  
  // Validate required fields
  validateRequired(data.name, "Name");
  validateRequired(data.email, "Email");
  validateRequired(data.role, "Role");
  
  // Validate email format
  if (!validateEmail(data.email)) {
    throw new HttpsError("invalid-argument", "Invalid email format");
  }
  
  // Validate role
  if (!VALID_ROLES.includes(data.role)) {
    throw new HttpsError("invalid-argument", "Invalid role");
  }
  
  // Sanitize text fields
  checkSecurityThreats(data.name);
  checkSecurityThreats(data.email);
  
  data.name = sanitizeString(data.name, 100);
  data.email = sanitizeString(data.email, 255).toLowerCase();
  
  return true;
}

// Rate limiting helper
const rateLimitMap = new Map();

function checkRateLimit(userId, action, limit = 10, windowMs = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const rateLimitData = rateLimitMap.get(key);
  
  if (now > rateLimitData.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (rateLimitData.count >= limit) {
    throw new HttpsError("resource-exhausted", "Rate limit exceeded");
  }
  
  rateLimitData.count++;
  return true;
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

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      console.error(`❌ Invalid role: ${role}`);
      return;
    }

    // Get user record from Firebase Auth
    const userRec = await adminAuth.getUser(uid);
    const authEmail = userRec.email;

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role, name });

    // Update email if different
    if (firestoreEmail && firestoreEmail !== authEmail) {
      await adminAuth.updateUser(uid, { email: firestoreEmail });
    }

    console.log(`✅ Synced claims for UID: ${uid}, Role: ${role}`);
  } catch (error) {
    console.error(`❌ Error syncing claims for UID: ${uid}`, error);
  }
});

exports.addUserWithRole = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ADMIN_ROLES);
  
  const { email, name, role, password } = request.data;
  
  // Enhanced validation
  validateUserData({ email, name, role });
  
  // Rate limiting
  checkRateLimit(request.auth.uid, 'addUser', 5, 300000); // 5 users per 5 minutes
  
  if (!password || password.length < 8) {
    throw new HttpsError("invalid-argument", "Password must be at least 8 characters");
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
    });

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { role, name });

    // Create user document in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name: sanitizeString(name, 100),
      email: email.toLowerCase(),
      role,
      createdAt: new Date(),
      createdBy: request.auth.uid
    });

    console.log(`✅ Created user: ${email} with role: ${role}`);
    return { uid: userRecord.uid, email, name, role };

  } catch (error) {
    console.error("Add user error:", error);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError("already-exists", "Email already exists");
    }
    throw new HttpsError("internal", "Failed to create user");
  }
});

exports.deleteUserAuth = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ADMIN_ROLES);
  
  const { uid } = request.data;
  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID required");
  }

  // Rate limiting
  checkRateLimit(request.auth.uid, 'deleteUser', 3, 300000); // 3 deletions per 5 minutes

  try {
    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);
    
    // Delete from Firestore (this will trigger syncUserClaims)
    await db.collection("users").doc(uid).delete();

    console.log(`✅ Deleted user: ${uid}`);
    return { success: true };

  } catch (error) {
    console.error("Delete user error:", error);
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError("not-found", "User not found");
    }
    throw new HttpsError("internal", "Failed to delete user");
  }
});

exports.deleteAllUsers = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ["admin"]); // Only admin can delete all users
  
  const { confirmDelete } = request.data;
  if (confirmDelete !== "DELETE_ALL_USERS") {
    throw new HttpsError("invalid-argument", "Confirmation required");
  }

  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection("users").get();
    const deletePromises = [];

    usersSnapshot.forEach(doc => {
      const uid = doc.id;
      // Don't delete the requesting admin
      if (uid !== request.auth.uid) {
        deletePromises.push(adminAuth.deleteUser(uid));
        deletePromises.push(db.collection("users").doc(uid).delete());
      }
    });

    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted all users except admin: ${request.auth.uid}`);
    return { success: true, deletedCount: deletePromises.length / 2 };

  } catch (error) {
    console.error("Delete all users error:", error);
    throw new HttpsError("internal", "Failed to delete users");
  }
});

exports.cleanupDeletedUser = onDocumentWritten({
  document: "users/{uid}",
  region: "us-central1"
}, async (event) => {
  const uid = event.params.uid;
  
  // Only run on document deletion
  if (event.data?.after?.exists) {
    return;
  }

  try {
    // Clean up user-related data
    const batch = db.batch();
    
    // Remove user from any student assignments
    const studentsSnapshot = await db.collection("students")
      .where("app.studentData.caseManagerId", "==", uid)
      .get();
    
    studentsSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        "app.studentData.caseManagerId": null,
        "updatedAt": new Date()
      });
    });
    
    await batch.commit();
    console.log(`✅ Cleaned up data for deleted user: ${uid}`);

  } catch (error) {
    console.error(`❌ Error cleaning up deleted user: ${uid}`, error);
  }
});

// ─── AERIES INTEGRATION ──────────────────────────────────────────────────────
exports.getAeriesToken = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireAuth(request);
  
  const { username, password } = request.data;
  
  // Enhanced validation
  validateRequired(username, "Username");
  validateRequired(password, "Password");
  
  // Security checks
  checkSecurityThreats(username);
  
  // Rate limiting
  checkRateLimit(request.auth.uid, 'aeriesToken', 3, 300000); // 3 attempts per 5 minutes

  try {
    // This would integrate with your Aeries API
    // Implementation depends on your Aeries setup
    console.log(`Aeries token request for user: ${request.auth.uid}`);
    
    return { 
      success: true, 
      message: "Token request processed",
      // Don't return actual tokens in logs
    };

  } catch (error) {
    console.error("Aeries token error:", error);
    throw new HttpsError("internal", "Failed to get Aeries token");
  }
});

// ─── TEACHER FEEDBACK SYSTEM ─────────────────────────────────────────────────
exports.sendTeacherFeedbackForm = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireAuth(request);
  
  const { formData, studentId, teacherEmails } = request.data;
  
  // Enhanced validation
  validateRequired(formData, "Form data");
  validateRequired(studentId, "Student ID");
  validateRequired(teacherEmails, "Teacher emails");
  
  if (!Array.isArray(teacherEmails) || teacherEmails.length === 0) {
    throw new HttpsError("invalid-argument", "Teacher emails must be a non-empty array");
  }
  
  // Validate email addresses
  teacherEmails.forEach(email => {
    if (!validateEmail(email)) {
      throw new HttpsError("invalid-argument", `Invalid email: ${email}`);
    }
  });
  
  // Rate limiting
  checkRateLimit(request.auth.uid, 'sendFeedback', 10, 3600000); // 10 forms per hour

  try {
    // Validate user has access to this student
    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      throw new HttpsError("not-found", "Student not found");
    }
    
    const studentData = studentDoc.data();
    const userRole = request.auth.token.role;
    
    // Check permissions
    if (!ADMIN_ROLES.includes(userRole) && 
        userRole !== 'case_manager' && 
        studentData.app.studentData.caseManagerId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "No access to this student");
    }

    // Create feedback form document
    const formRef = await db.collection("feedbackForms").add({
      ...formData,
      studentId,
      teacherEmails,
      createdBy: request.auth.uid,
      createdAt: new Date(),
      status: 'sent'
    });

    // Log the send operation
    await db.collection("feedbackSendLog").add({
      formId: formRef.id,
      studentId,
      teacherEmails,
      sentBy: request.auth.uid,
      sentAt: new Date()
    });

    console.log(`✅ Sent feedback form for student: ${studentId}`);
    return { success: true, formId: formRef.id };

  } catch (error) {
    console.error("Send feedback error:", error);
    throw new HttpsError("internal", "Failed to send feedback form");
  }
});

exports.syncFormResponses = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireRole(request, ADMIN_ROLES);
  
  const { formId } = request.data;
  
  // Rate limiting
  checkRateLimit(request.auth.uid, 'syncResponses', 5, 300000); // 5 syncs per 5 minutes

  try {
    // This would integrate with Google Forms API
    // Implementation depends on your Google Forms setup
    console.log(`Sync responses for form: ${formId}`);
    
    return { success: true, message: "Responses synced" };

  } catch (error) {
    console.error("Sync responses error:", error);
    throw new HttpsError("internal", "Failed to sync responses");
  }
});

exports.autoSyncFormResponses = onSchedule({
  schedule: "every 24 hours",
  region: "us-central1"
}, async (context) => {
  try {
    console.log("Starting auto-sync of form responses");
    
    // Get all active forms
    const formsSnapshot = await db.collection("feedbackForms")
      .where("status", "==", "sent")
      .get();
    
    const syncPromises = [];
    formsSnapshot.forEach(doc => {
      // Add sync logic here
      console.log(`Processing form: ${doc.id}`);
    });
    
    await Promise.all(syncPromises);
    console.log("Auto-sync completed");

  } catch (error) {
    console.error("Auto-sync error:", error);
  }
});

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

// ─── STUDENT STAFF IDS MAINTENANCE ───────────────────────────────────────────
/**
 * Automatically maintain the app.staffIds array on student documents
 * This function fires on any create, update, or delete operation on students
 * It extracts all staff IDs who should have access to the student and updates the staffIds array
 */
exports.updateStudentStaffIds = onDocumentWritten({
  document: "students/{studentId}",
  region: "us-central1"
}, async (event) => {
  const studentId = event.params.studentId;
  const newData = event.data?.after?.data();
  
  // If document was deleted, nothing to do
  if (!newData) {
    console.log(`Student ${studentId} was deleted, skipping staffIds update`);
    return null;
  }
  
  const app = newData.app || {};
  const staffIds = new Set();
  
  // Add case manager
  const caseManagerId = app.studentData?.caseManagerId;
  if (caseManagerId) {
    staffIds.add(caseManagerId);
  }
  
  // Add teachers and co-teaching case managers from schedule
  const schedule = app.schedule?.periods || {};
  Object.values(schedule).forEach(periodData => {
    if (typeof periodData === 'string' && periodData) {
      // Simple string format (teacher ID)
      staffIds.add(periodData);
    } else if (periodData && typeof periodData === 'object') {
      // Complex object format
      if (periodData.teacherId) {
        staffIds.add(periodData.teacherId);
      }
      // Add co-teaching case manager if exists
      if (periodData.coTeaching?.caseManagerId) {
        staffIds.add(periodData.coTeaching.caseManagerId);
      }
    }
  });
  
  // Add service providers
  const providers = app.providers || {};
  Object.values(providers).forEach(providerId => {
    if (providerId && typeof providerId === 'string') {
      staffIds.add(providerId);
    }
  });
  
  // Convert to array and remove any empty strings
  const staffIdsArray = Array.from(staffIds).filter(id => id && id.trim() !== '');
  
  // Update the document with staffIds array
  try {
    await db.collection('students').doc(studentId).update({
      'app.staffIds': staffIdsArray,
      'app.lastUpdated': db.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Updated staffIds for student ${studentId}:`, staffIdsArray);
    return { success: true, staffIds: staffIdsArray };
  } catch (error) {
    console.error(`❌ Failed to update staffIds for student ${studentId}:`, error);
    throw error;
  }
});

exports.getStudentFeedback = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  requireAuth(request);
  
  const { studentId } = request.data;
  if (!studentId) {
    throw new HttpsError("invalid-argument", "Student ID required");
  }
  
  // Rate limiting
  checkRateLimit(request.auth.uid, 'getFeedback', 20, 300000); // 20 requests per 5 minutes

  try {
    // Validate user has access to this student
    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      throw new HttpsError("not-found", "Student not found");
    }
    
    const studentData = studentDoc.data();
    const userRole = request.auth.token.role;
    
    // Check permissions
    if (!ADMIN_ROLES.includes(userRole) && 
        userRole !== 'case_manager' && 
        studentData.app.studentData.caseManagerId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "No access to this student");
    }

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
      timestamp: new Date(),
      message: 'Cloud Functions are operational',
      version: '2.0.0'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw new functions.https.HttpsError('internal', 'Health check failed');
  }
});