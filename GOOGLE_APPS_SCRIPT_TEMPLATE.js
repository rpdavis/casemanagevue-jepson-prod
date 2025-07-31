/**
 * Google Apps Script for Dynamic Document Generation
 * 
 * This script automatically creates and updates Google Docs from Google Sheets data.
 * It can be attached to any Google Sheet to generate readable documents.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default code with this template
 * 4. Customize the configuration section below
 * 5. Save and authorize the script
 * 6. Set up triggers (see bottom of file)
 */

// =============================================================================
// CONFIGURATION - CUSTOMIZE THESE SETTINGS
// =============================================================================

const CONFIG = {
  // Document settings
  documentTitle: 'Teacher Feedback Summary',
  documentFolder: 'Feedback Documents', // Optional: folder name to organize docs
  
  // Sheet settings
  dataRange: 'A:Z', // Range to read from sheet
  headerRow: 1, // Row number containing headers
  
  // Formatting settings
  includeTimestamp: true,
  includeResponseCount: true,
  groupByStudent: true, // Group responses by student if student column exists
  
  // Column mappings (customize based on your form structure)
  columns: {
    timestamp: 'Timestamp',
    teacherEmail: 'Email Address',
    studentName: 'Student Name',
    period: 'Period/Subject',
    // Add more column mappings as needed
  },
  
  // Document template
  template: {
    title: 'Teacher Feedback Summary',
    subtitle: 'Generated from Google Forms responses',
    sections: [
      'summary',
      'responses'
    ]
  }
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Main function to generate/update document from sheet data
 */
function generateDocumentFromSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = getSheetData(sheet);
    
    if (!data || data.length === 0) {
      console.log('No data found in sheet');
      return;
    }
    
    const document = getOrCreateDocument(sheet.getName());
    updateDocumentContent(document, data);
    
    console.log('Document updated successfully');
    
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
}

/**
 * Get data from the active sheet
 */
function getSheetData(sheet) {
  const range = sheet.getRange(CONFIG.dataRange);
  const values = range.getValues();
  
  if (values.length <= CONFIG.headerRow) {
    return [];
  }
  
  const headers = values[CONFIG.headerRow - 1];
  const dataRows = values.slice(CONFIG.headerRow);
  
  return dataRows
    .filter(row => row.some(cell => cell !== '')) // Remove empty rows
    .map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
        if (header) {
          rowData[header] = row[index] || '';
        }
      });
      return rowData;
    });
}

/**
 * Get existing document or create new one
 */
function getOrCreateDocument(sheetName) {
  const folder = getOrCreateFolder();
  const fileName = `${CONFIG.documentTitle} - ${sheetName}`;
  
  // Try to find existing document
  const files = DriveApp.getFilesByName(fileName);
  let document;
  
  if (files.hasNext()) {
    document = DocumentApp.openById(files.next().getId());
    console.log('Found existing document');
  } else {
    // Create new document
    document = DocumentApp.create(fileName);
    const file = DriveApp.getFileById(document.getId());
    
    // Move to folder if specified
    if (folder) {
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    
    console.log('Created new document');
  }
  
  return document;
}

/**
 * Update document content with sheet data
 */
function updateDocumentContent(document, data) {
  const body = document.getBody();
  
  // Clear existing content
  body.clear();
  
  // Add title
  const title = body.appendParagraph(CONFIG.template.title);
  title.setHeading(DocumentApp.ParagraphHeading.TITLE);
  
  // Add subtitle with timestamp
  if (CONFIG.includeTimestamp) {
    const subtitle = body.appendParagraph(`Generated on ${new Date().toLocaleString()}`);
    subtitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  }
  
  // Add summary section
  if (CONFIG.includeResponseCount) {
    body.appendParagraph('');
    const summary = body.appendParagraph(`Total Responses: ${data.length}`);
    summary.setHeading(DocumentApp.ParagraphHeading.HEADING3);
  }
  
  // Add responses section
  body.appendParagraph('');
  const responsesTitle = body.appendParagraph('Teacher Responses');
  responsesTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  
  // Group responses by student if enabled
  if (CONFIG.groupByStudent && CONFIG.columns.studentName) {
    addGroupedResponses(body, data);
  } else {
    addIndividualResponses(body, data);
  }
  
  // Format document
  formatDocument(body);
}

/**
 * Add responses grouped by student
 */
function addGroupedResponses(body, data) {
  const studentGroups = {};
  
  // Group data by student
  data.forEach(row => {
    const studentName = row[CONFIG.columns.studentName] || 'Unknown Student';
    if (!studentGroups[studentName]) {
      studentGroups[studentName] = [];
    }
    studentGroups[studentName].push(row);
  });
  
  // Add each student's responses
  Object.keys(studentGroups).forEach(studentName => {
    const responses = studentGroups[studentName];
    
    body.appendParagraph('');
    const studentTitle = body.appendParagraph(`Student: ${studentName}`);
    studentTitle.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    
    responses.forEach((response, index) => {
      addResponseToDocument(body, response, index + 1);
    });
  });
}

/**
 * Add individual responses
 */
function addIndividualResponses(body, data) {
  data.forEach((response, index) => {
    addResponseToDocument(body, response, index + 1);
  });
}

/**
 * Add a single response to the document
 */
function addResponseToDocument(body, response, index) {
  body.appendParagraph('');
  const responseTitle = body.appendParagraph(`Response ${index}`);
  responseTitle.setHeading(DocumentApp.ParagraphHeading.HEADING4);
  
  // Add response details
  Object.entries(response).forEach(([key, value]) => {
    if (value && key !== CONFIG.columns.timestamp) {
      const detail = body.appendParagraph(`${key}: ${value}`);
      detail.setIndentStart(20);
    }
  });
  
  // Add timestamp if available
  if (response[CONFIG.columns.timestamp]) {
    const timestamp = body.appendParagraph(`Submitted: ${response[CONFIG.columns.timestamp]}`);
    timestamp.setIndentStart(20);
    timestamp.setItalic(true);
  }
}

/**
 * Format the document
 */
function formatDocument(body) {
  // Set document margins
  body.setMarginTop(72);
  body.setMarginBottom(72);
  body.setMarginLeft(72);
  body.setMarginRight(72);
  
  // Add some spacing between sections
  const paragraphs = body.getParagraphs();
  paragraphs.forEach(paragraph => {
    if (paragraph.getHeading() === DocumentApp.ParagraphHeading.HEADING2) {
      paragraph.setSpacingBefore(20);
    }
  });
}

/**
 * Get or create the documents folder
 */
function getOrCreateFolder() {
  if (!CONFIG.documentFolder) {
    return null;
  }
  
  const folders = DriveApp.getFoldersByName(CONFIG.documentFolder);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(CONFIG.documentFolder);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Test function to check sheet data
 */
function testSheetData() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = getSheetData(sheet);
  
  console.log('Sheet data:', data);
  console.log('Data count:', data.length);
  
  if (data.length > 0) {
    console.log('Sample row:', data[0]);
  }
}

/**
 * Manual trigger function
 */
function manualGenerate() {
  generateDocumentFromSheet();
}

// =============================================================================
// TRIGGER SETUP
// =============================================================================

/**
 * Set up automatic triggers
 * Run this function once to set up automatic document generation
 */
function setupTriggers() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateDocumentFromSheet') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger for form submission
  ScriptApp.newTrigger('generateDocumentFromSheet')
    .forSpreadsheet(sheet.getParent())
    .onFormSubmit()
    .create();
  
  // Create trigger for manual editing (optional)
  ScriptApp.newTrigger('generateDocumentFromSheet')
    .forSpreadsheet(sheet.getParent())
    .onEdit()
    .create();
  
  console.log('Triggers set up successfully');
}

/**
 * Remove all triggers
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateDocumentFromSheet') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  console.log('All triggers removed');
}

// =============================================================================
// CUSTOMIZATION EXAMPLES
// =============================================================================

/**
 * Example: Custom document template for specific form
 */
function generateCustomFeedbackDocument() {
  const CONFIG_CUSTOM = {
    ...CONFIG,
    documentTitle: 'Academic Performance Feedback',
    template: {
      title: 'Academic Performance Feedback Summary',
      subtitle: 'Teacher feedback on student academic performance',
      sections: ['summary', 'responses', 'recommendations']
    }
  };
  
  // Use custom config
  const originalConfig = CONFIG;
  Object.assign(CONFIG, CONFIG_CUSTOM);
  
  try {
    generateDocumentFromSheet();
  } finally {
    // Restore original config
    Object.assign(CONFIG, originalConfig);
  }
}

/**
 * Example: Generate document for specific date range
 */
function generateDocumentForDateRange(startDate, endDate) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = getSheetData(sheet);
  
  // Filter data by date range
  const filteredData = data.filter(row => {
    const timestamp = new Date(row[CONFIG.columns.timestamp]);
    return timestamp >= startDate && timestamp <= endDate;
  });
  
  if (filteredData.length === 0) {
    console.log('No data found for specified date range');
    return;
  }
  
  const document = getOrCreateDocument(`${sheet.getName()} (${startDate.toDateString()} - ${endDate.toDateString()})`);
  updateDocumentContent(document, filteredData);
}

/**
 * Example: Send document via email
 */
function emailDocument(recipientEmail, subject, message) {
  const document = getOrCreateDocument(SpreadsheetApp.getActiveSheet().getName());
  const file = DriveApp.getFileById(document.getId());
  
  GmailApp.sendEmail(recipientEmail, subject, message, {
    attachments: [file.getBlob()]
  });
  
  console.log('Document sent via email');
} 