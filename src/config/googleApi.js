// Google API configuration and constants

export const GOOGLE_API_CONFIG = {
  // Google Sheets API configuration
  sheets: {
    version: 'v4',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  },
  
  // Default sheet formatting
  formatting: {
    header: {
      backgroundColor: {
        red: 0.2,
        green: 0.6,
        blue: 0.9
      },
      textFormat: {
        bold: true,
        foregroundColor: {
          red: 1,
          green: 1,
          blue: 1
        }
      }
    }
  },
  
  // Sheet properties
  sheetProperties: {
    defaultRows: 1000,
    defaultColumns: 10
  }
}

// Column definitions for different sheet types
export const SHEET_COLUMNS = {
  main: [
    'First Name',
    'Last Name', 
    'Grade',
    'Case Manager',
    'Assessment Accommodations'
  ],
  
  custom: [
    'First Name',
    'Last Name',
    'Period',
    'Teacher',
    'Grade',
    'Case Manager',
    'Assessment Accommodations'
  ]
}

// Error messages
export const ERROR_MESSAGES = {
  AUTHENTICATION_FAILED: 'Authentication failed. Please try again.',
  SHEET_CREATION_FAILED: 'Failed to create Google Sheet. Please check your authentication and try again.',
  TAB_CREATION_FAILED: 'Failed to create custom tab. Please try again.',
  TAB_DELETION_FAILED: 'Failed to delete custom tab. Please try again.',
  API_NOT_INITIALIZED: 'Google Sheets API not initialized.',
  NO_SHEET_CREATED: 'No sheet created yet.',
  SHEET_NOT_FOUND: 'Sheet not found.'
} 