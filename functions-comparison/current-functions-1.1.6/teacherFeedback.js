/* eslint-disable */
// functions/teacherFeedback.js

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { google } = require("googleapis");

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
const db = getFirestore();

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
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
      "https://www.googleapis.com/auth/forms.responses.readonly"
    ],
  });
};

// Google Sheets API helper
async function createGoogleSheet(title, description) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Create a new spreadsheet with multiple sheets
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Feedback Responses - ${title}`,
        },
        sheets: [
          {
            properties: {
              title: 'Summary',
              gridProperties: {
                rowCount: 1000,
                columnCount: 20
              }
            }
          },
          {
            properties: {
              title: 'Template',
              gridProperties: {
                rowCount: 1000,
                columnCount: 20
              }
            }
          }
        ]
      }
    });
    
    // Add description to the Summary sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      range: 'Summary!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[`Feedback Form: ${title}`, '', '', '', '']]
      }
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      range: 'Summary!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[`Description: ${description}`, '', '', '', '']]
      }
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      range: 'Summary!A4',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Created:', new Date().toISOString(), '', '', '']]
      }
    });
    
    // Add student tracking to Summary sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      range: 'Summary!A6',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Student Name', 'Tab Name', 'Response Count', 'Last Response', 'Status']]
      }
    });
    
    // Add template structure to Template sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      range: 'Template!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Timestamp', 'Teacher Name', 'Student Name', 'Question 1', 'Question 2', 'Question 3', 'Additional Notes']]
      }
    });
    
    return {
      spreadsheetId: spreadsheet.data.spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit`,
      success: true
    };
    
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw new HttpsError('internal', 'Failed to create Google Sheet: ' + error.message);
  }
}

// Create a new tab for a specific student
async function createStudentTab(spreadsheetId, studentName, studentId) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Create a new sheet for the student
    const tabName = sanitizeTabName(studentName);
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20
                }
              }
            }
          }
        ]
      }
    });
    
    // Add headers to the new tab (copy from Template)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Timestamp', 'Teacher Name', 'Student Name', 'Question 1', 'Question 2', 'Question 3', 'Additional Notes']]
      }
    });
    
    // Add student info header
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${tabName}!A3`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[`Student: ${studentName}`, '', '', '', '', '', '']]
      }
    });
    
    // Update Summary sheet with new student
    const summaryRange = 'Summary!A6:E';
    const summaryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: summaryRange
    });
    
    const newRow = [studentName, tabName, '0', 'No responses yet', 'Active'];
    const updatedValues = [...(summaryResponse.data.values || []), newRow];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: summaryRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: updatedValues
      }
    });
    
    return {
      tabName: tabName,
      success: true
    };
    
  } catch (error) {
    console.error('Error creating student tab:', error);
    throw new HttpsError('internal', 'Failed to create student tab: ' + error.message);
  }
}

// Sanitize tab name for Google Sheets (remove special characters, limit length)
function sanitizeTabName(name) {
  return name
    .replace(/[\[\]*\/\\?]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .substring(0, 25); // Limit length
}

// Create individual case manager form, sheet, and doc
async function createCaseManagerFeedbackSystem(templateFormUrl, caseManagerEmail, caseManagerName) {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    const docs = google.docs({ version: 'v1', auth });
    
    // 1. Create individual Google Form for this case manager
    console.log(`🔄 Creating individual form for ${caseManagerName}...`);
    const formCopy = await drive.files.copy({
      fileId: extractFormId(templateFormUrl),
      requestBody: {
        name: `Feedback Form - ${caseManagerName}`,
        parents: ['root'] // Place in root folder
      }
    });
    
    // 2. Create individual Google Sheet for this case manager
    console.log(`🔄 Creating individual sheet for ${caseManagerName}...`);
    const sheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Feedback Responses - ${caseManagerName}`,
        },
        sheets: [
          {
            properties: {
              title: 'Summary',
              gridProperties: { rowCount: 1000, columnCount: 20 }
            }
          },
          {
            properties: {
              title: 'Template',
              gridProperties: { rowCount: 1000, columnCount: 20 }
            }
          }
        ]
      }
    });
    
    // 3. Create individual Google Doc for this case manager
    console.log(`🔄 Creating individual doc for ${caseManagerName}...`);
    const doc = await docs.documents.create({
      requestBody: {
        title: `Feedback Summary - ${caseManagerName}`,
        body: {
          content: [{
            paragraph: {
              elements: [{
                textRun: {
                  text: `Feedback Summary for ${caseManagerName}\n\nThis document will be automatically updated with feedback responses.\n\nGenerated: ${new Date().toISOString()}`
                }
              }]
            }
          }]
        }
      }
    });
    
    // 4. Set proper ownership and permissions
    console.log(`🔄 Setting ownership for ${caseManagerName}...`);
    
    // Transfer ownership of form to case manager
    await drive.permissions.create({
      fileId: formCopy.data.id,
      requestBody: {
        role: 'owner',
        type: 'user',
        emailAddress: caseManagerEmail
      },
      transferOwnership: true
    });
    
    // Transfer ownership of sheet to case manager
    await drive.permissions.create({
      fileId: sheet.data.spreadsheetId,
      requestBody: {
        role: 'owner',
        type: 'user',
        emailAddress: caseManagerEmail
      },
      transferOwnership: true
    });
    
    // Transfer ownership of doc to case manager
    await drive.permissions.create({
      fileId: doc.data.documentId,
      requestBody: {
        role: 'owner',
        type: 'user',
        emailAddress: caseManagerEmail
      },
      transferOwnership: true
    });
    
    // 5. Set up sheet structure
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet.data.spreadsheetId,
      range: 'Summary!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[`Feedback Form: ${caseManagerName}`, '', '', '', '']]
      }
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet.data.spreadsheetId,
      range: 'Summary!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[`Case Manager: ${caseManagerName}`, '', '', '', '']]
      }
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet.data.spreadsheetId,
      range: 'Summary!A4',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Created:', new Date().toISOString(), '', '', '']]
      }
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet.data.spreadsheetId,
      range: 'Summary!A6',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Student Name', 'Tab Name', 'Response Count', 'Last Response', 'Status']]
      }
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet.data.spreadsheetId,
      range: 'Template!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Timestamp', 'Teacher Name', 'Student Name', 'Question 1', 'Question 2', 'Question 3', 'Additional Notes']]
      }
    });
    
    return {
      success: true,
      caseManagerId: caseManagerEmail,
      caseManagerName: caseManagerName,
      formId: formCopy.data.id,
      formUrl: `https://docs.google.com/forms/d/${formCopy.data.id}/viewform`,
      spreadsheetId: sheet.data.spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.data.spreadsheetId}/edit`,
      documentId: doc.data.documentId,
      documentUrl: `https://docs.google.com/document/d/${doc.data.documentId}/edit`
    };
    
  } catch (error) {
    console.error('Error creating case manager feedback system:', error);
    throw new HttpsError('internal', 'Failed to create case manager feedback system: ' + error.message);
  }
}

// ─── CLOUD FUNCTIONS ─────────────────────────────────────────────────────────

// Create individual case manager feedback system (form, sheet, doc)
exports.createCaseManagerFeedbackSystem = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  try {
    requireRole(request, ADMIN_ROLES);
    
    const { templateFormUrl, caseManagerEmail, caseManagerName } = request.data;
    
    // Validate input
    validateRequired(templateFormUrl, 'templateFormUrl');
    validateRequired(caseManagerEmail, 'caseManagerEmail');
    validateRequired(caseManagerName, 'caseManagerName');
    
    // Validate email format
    if (!validateEmail(caseManagerEmail)) {
      throw new HttpsError('invalid-argument', 'Invalid email format');
    }
    
    // Sanitize input
    const sanitizedFormUrl = sanitizeString(templateFormUrl, 500);
    const sanitizedEmail = sanitizeString(caseManagerEmail, 100);
    const sanitizedName = sanitizeString(caseManagerName, 100);
    
    // Create individual system for this case manager
    const result = await createCaseManagerFeedbackSystem(
      sanitizedFormUrl, 
      sanitizedEmail, 
      sanitizedName
    );
    
    // Store in Firestore for tracking
    await db.collection("caseManagerFeedbackSystems").add({
      caseManagerId: result.caseManagerId,
      caseManagerName: result.caseManagerName,
      formId: result.formId,
      formUrl: result.formUrl,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      documentId: result.documentId,
      documentUrl: result.documentUrl,
      createdAt: new Date(),
      createdBy: request.auth.uid
    });
    
    return {
      success: true,
      message: `Feedback system created successfully for ${result.caseManagerName}`,
      ...result
    };
    
  } catch (error) {
    console.error('Error in createCaseManagerFeedbackSystem:', error);
    throw new HttpsError('internal', error.message);
  }
});

// Automatically create Google Sheet when new feedback form is created
exports.createFeedbackFormSheet = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  try {
    requireRole(request, ADMIN_ROLES);
    
    const { title, description, formUrl } = request.data;
    
    // Validate input
    validateRequired(title, 'title');
    validateRequired(formUrl, 'formUrl');
    
    // Sanitize input
    const sanitizedTitle = sanitizeString(title, 100);
    const sanitizedDescription = sanitizeString(description || '', 500);
    
    // Create Google Sheet
    const sheetResult = await createGoogleSheet(sanitizedTitle, sanitizedDescription);
    
    // Extract form ID from URL
    const formId = extractFormId(formUrl);
    
    return {
      success: true,
      message: 'Google Sheet created successfully',
      spreadsheetId: sheetResult.spreadsheetId,
      spreadsheetUrl: sheetResult.spreadsheetUrl,
      formId: formId
    };
    
  } catch (error) {
    console.error('Error in createFeedbackFormSheet:', error);
    throw new HttpsError('internal', error.message);
  }
});



// Get case manager's own feedback system
exports.getCaseManagerFeedbackSystem = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  try {
    requireAuth(request);
    
    const caseManagerEmail = request.auth.token.email;
    
    // Get case manager's feedback system
    const systemQuery = await db.collection("caseManagerFeedbackSystems")
      .where("caseManagerId", "==", caseManagerEmail)
      .limit(1)
      .get();
    
    if (systemQuery.empty) {
      return {
        success: false,
        message: "No feedback system found for this case manager",
        hasSystem: false
      };
    }
    
    const systemData = systemQuery.docs[0].data();
    
    return {
      success: true,
      hasSystem: true,
      system: {
        id: systemQuery.docs[0].id,
        ...systemData
      }
    };
    
  } catch (error) {
    console.error('Error in getCaseManagerFeedbackSystem:', error);
    throw new HttpsError('internal', error.message);
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
    throw new HttpsError("invalid-argument", "Spreadsheet ID is required");
  }

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    // Get spreadsheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: true, synced: 0, message: "No data to sync" };
    }

    // Process rows (skip header)
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    let syncedCount = 0;
    
    for (const row of dataRows) {
      if (row.length < 3) continue; // Skip incomplete rows
      
      const [timestamp, teacherName, studentName, ...responses] = row;
      
      // Create response document
      await db.collection("feedbackResponses").add({
        timestamp: new Date(timestamp),
        teacherName: teacherName || "Unknown",
        studentName: studentName || "Unknown",
        responses: responses.map((response, index) => ({
          question: headers[index + 3] || `Question ${index + 1}`,
          answer: response || ""
        })),
        spreadsheetId,
        sheetName,
        syncedAt: new Date()
      });
      
      syncedCount++;
    }

    return {
      success: true,
      synced: syncedCount,
      message: `Successfully synced ${syncedCount} responses`
    };

  } catch (error) {
    console.error("Sync error:", error);
    throw new HttpsError("internal", "Failed to sync form responses");
  }
});

// ─── AUTOMATIC SYNC FUNCTION ─────────────────────────────────────────────────
exports.autoSyncFormResponses = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  try {
    // Get all active feedback forms
    const formsSnapshot = await db.collection("feedbackForms")
      .where("active", "==", true)
      .get();

    if (formsSnapshot.empty) {
      console.log("No active feedback forms found");
      return;
    }

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    for (const formDoc of formsSnapshot.docs) {
      const formData = formDoc.data();
      
      if (!formData.spreadsheetId) {
        console.log(`No spreadsheet ID for form: ${formData.title}`);
        continue;
      }

      try {
        // Get spreadsheet data
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: formData.spreadsheetId,
          range: "Form Responses 1"
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
          console.log(`No new data for form: ${formData.title}`);
          continue;
        }

        // Process new rows (skip header and already synced)
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        let syncedCount = 0;
        
        for (const row of dataRows) {
          if (row.length < 3) continue;
          
          const [timestamp, teacherName, studentName, ...responses] = row;
          
          // Check if already synced
          const existingResponse = await db.collection("feedbackResponses")
            .where("timestamp", "==", new Date(timestamp))
            .where("teacherName", "==", teacherName)
            .where("studentName", "==", studentName)
            .limit(1)
            .get();
          
          if (!existingResponse.empty) {
            continue; // Already synced
          }
          
          // Create response document
          await db.collection("feedbackResponses").add({
            timestamp: new Date(timestamp),
            teacherName: teacherName || "Unknown",
            studentName: studentName || "Unknown",
            responses: responses.map((response, index) => ({
              question: headers[index + 3] || `Question ${index + 1}`,
              answer: response || ""
            })),
            spreadsheetId: formData.spreadsheetId,
            formId: formDoc.id,
            syncedAt: new Date()
          });
          
          syncedCount++;
        }

        console.log(`Synced ${syncedCount} new responses for form: ${formData.title}`);

      } catch (error) {
        console.error(`Error syncing form ${formData.title}:`, error);
        // Continue with other forms
      }
    }

  } catch (error) {
    console.error("Auto-sync error:", error);
  }
});

// ─── DOCUMENT GENERATION ─────────────────────────────────────────────────────
exports.generateFeedbackDocument = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  try {
    requireAuth(request);
    
    const { formId, caseManagerId, studentId = null } = request.data;
    
    if (!formId || !caseManagerId) {
      throw new HttpsError("invalid-argument", "Form ID and Case Manager ID are required");
    }

    // Get form data
    const formDoc = await db.collection("feedbackForms").doc(formId).get();
    if (!formDoc.exists) {
      throw new HttpsError("not-found", "Feedback form not found");
    }
    const formData = formDoc.data();

    // Get responses
    let responsesQuery = db.collection("feedbackResponses")
      .where("formId", "==", formId);
    
    if (studentId) {
      responsesQuery = responsesQuery.where("studentName", "==", studentId);
    }
    
    const responsesSnapshot = await responsesQuery.get();
    const responses = responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (responses.length === 0) {
      throw new HttpsError("not-found", "No responses found for this form");
    }

    // Generate document content
    const content = generateDocumentContent(formData, responses, studentId);

    // Create or update Google Doc
    const auth = getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth: await auth.getClient() });

    // Check for existing document
    const existingDocQuery = await db.collection("feedbackDocuments")
      .where("formId", "==", formId)
      .where("caseManagerId", "==", caseManagerId)
      .limit(1)
      .get();

    let documentId, documentUrl;

    if (!existingDocQuery.empty) {
      // Update existing document
      const existingDoc = existingDocQuery.docs[0].data();
      documentId = existingDoc.documentId;
      documentUrl = existingDoc.documentUrl;

      // Clear existing content and update
      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: existingDoc.contentLength || 1000
                }
              }
            },
            {
              insertText: {
                location: { index: 1 },
                text: content
              }
            }
          ]
        }
      });

      // Update metadata
      await db.collection("feedbackDocuments").doc(existingDocQuery.docs[0].id).update({
        updatedAt: new Date(),
        responseCount: responses.length,
        contentLength: content.length
      });

    } else {
      // Create new document
      const newDoc = await docs.documents.create({
        requestBody: {
          title: `Feedback Summary - ${formData.title}`,
          body: {
            content: [{
              paragraph: {
                elements: [{
                  textRun: { text: content }
                }]
              }
            }]
          }
        }
      });

      documentId = newDoc.data.documentId;
      documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      // Store metadata
      await db.collection("feedbackDocuments").add({
        formId,
        caseManagerId,
        documentId,
        documentUrl,
        formTitle: formData.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        responseCount: responses.length,
        contentLength: content.length
      });
    }

    return {
      success: true,
      message: "Document generated successfully",
      documentUrl: documentUrl,
      responseCount: responses.length
    };

  } catch (error) {
    console.error("Document generation error:", error);
    throw new HttpsError("internal", "Failed to generate document: " + error.message);
  }
});

// ─── HELPER FUNCTIONS FOR DOCUMENT GENERATION ────────────────────────────────
function generateDocumentContent(form, responses, studentId = null) {
  const title = studentId ? 
    `Feedback Summary for ${studentId}` : 
    `Feedback Summary - ${form.title}`;
  
  let content = `${title}\n`;
  content += `Generated: ${new Date().toLocaleDateString()}\n`;
  content += `Total Responses: ${responses.length}\n\n`;
  content += "=".repeat(50) + "\n\n";

  if (studentId) {
    // Filter responses for specific student
    const studentResponses = responses.filter(r => 
      r.studentName && r.studentName.toLowerCase().includes(studentId.toLowerCase())
    );
    
    if (studentResponses.length === 0) {
      content += `No responses found for student: ${studentId}\n`;
      return content;
    }
    
    responses = studentResponses;
  }

  // Group responses by teacher
  const responsesByTeacher = {};
  responses.forEach(response => {
    const teacher = response.teacherName || "Unknown Teacher";
    if (!responsesByTeacher[teacher]) {
      responsesByTeacher[teacher] = [];
    }
    responsesByTeacher[teacher].push(response);
  });

  // Generate content for each teacher
  Object.entries(responsesByTeacher).forEach(([teacher, teacherResponses], index) => {
    content += `Response ${index + 1}: ${teacher}\n`;
    content += `Date: ${teacherResponses[0].timestamp ? new Date(teacherResponses[0].timestamp).toLocaleDateString() : 'Unknown'}\n`;
    content += "-".repeat(30) + "\n\n";

    teacherResponses.forEach(response => {
      if (response.responses && Array.isArray(response.responses)) {
        response.responses.forEach((qResponse, qIndex) => {
          content += `Question ${qIndex + 1}: ${qResponse.question}\n`;
          content += `Answer: ${qResponse.answer}\n\n`;
        });
      }
    });

    content += "\n";
  });

  return content;
}

function formatResponseForDocument(response, index) {
  let formatted = `Response ${index + 1}:\n`;
  formatted += `Teacher: ${response.teacherName || 'Unknown'}\n`;
  formatted += `Date: ${response.timestamp ? new Date(response.timestamp).toLocaleDateString() : 'Unknown'}\n`;
  formatted += `Student: ${response.studentName || 'Unknown'}\n\n`;

  if (response.responses && Array.isArray(response.responses)) {
    response.responses.forEach((qResponse, qIndex) => {
      formatted += `Q${qIndex + 1}: ${qResponse.question}\n`;
      formatted += `A: ${qResponse.answer}\n\n`;
    });
  }

  return formatted;
} 