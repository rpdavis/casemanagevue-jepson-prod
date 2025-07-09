/* eslint-disable */
// functions/index.js

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
// Firebase Functions v2
const { onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");

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
exports.syncUserClaims = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const afterData = event.data?.after?.data();

  try {
    if (!event.data?.after?.exists) {
      const userRec = await adminAuth.getUser(uid);
      await adminAuth.setCustomUserClaims(userRec.uid, null);
      console.log(`✅ Removed claims for UID: ${uid}`);
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

exports.addUserWithRole = onCall(async (request) => {
  requireRole(request, ["admin"]);

  const { name, email, role, provider, aeriesId } = request.data;
  
  if (!name || !email || !role) {
    throw new HttpsError("invalid-argument", "Name, email, and role are required");
  }

  if (!VALID_ROLES.includes(role)) {
    throw new HttpsError("invalid-argument", `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}`);
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
      displayName: name,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    const userData = {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      ...(provider && { provider }),
      ...(aeriesId && { aeriesId })
    };

    await db.collection("users").doc(userRecord.uid).set(userData);

    return { 
      success: true,
      message: `User "${name}" created successfully`,
      uid: userRecord.uid
    };

  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", `Email "${email}" already in use`);
    }
    throw new HttpsError("internal", `User creation failed: ${error.message}`);
  }
});

// ─── AERIES API FUNCTIONS ────────────────────────────────────────────────────
exports.getAeriesToken = onCall(async (request) => {
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
exports.sendTeacherFeedbackForm = onCall(async (request) => {
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
exports.syncFormResponses = onCall(async (request) => {
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
exports.autoSyncFormResponses = onSchedule("every 30 minutes", async (event) => {
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
exports.getStudentFeedback = onCall(async (request) => {
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