# API Integration Guide

This document covers all external API integrations in the CaseManageVue application.

## 📊 **Overview**

CaseManageVue integrates with several external APIs to provide comprehensive functionality:
- **Firebase Services**: Authentication, Firestore, Storage, Cloud Functions
- **Google APIs**: Sheets, Forms, Drive, Gmail
- **Aeries SIS API**: Student Information System integration
- **Custom APIs**: Internal Cloud Functions

## 🔥 **Firebase Integration**

### **Firebase Services Used**
- **Authentication**: User login and role management
- **Firestore**: Primary database for all application data
- **Storage**: Secure document storage (PDFs, images)
- **Cloud Functions**: Server-side processing and email
- **Hosting**: Web application hosting

### **Configuration**
```javascript
// firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  // Environment-specific configuration
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
```

### **Firestore Security Rules**
```javascript
// Current production rules (302 lines)
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // User authentication required for all access
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Student documents - role-based access
    match /students/{studentId} {
      allow read, write: if request.auth != null && (
        request.auth.token.role in ['admin', 'sped_chair'] ||
        request.auth.uid in resource.data.app.staffIds
      );
    }
    
    // User documents - admin only for write
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role in ['admin', 'sped_chair'];
    }
  }
}
```

## 📊 **Google APIs Integration**

### **Google Sheets API**
**Purpose**: Real-time data synchronization and export functionality

```javascript
// useGoogleSheetsIntegration.js
export function useGoogleSheetsIntegration(students, users, testingData) {
  const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ]
  
  const createLinkedGoogleSheet = async () => {
    try {
      // Create new spreadsheet
      const response = await gapi.client.sheets.spreadsheets.create({
        properties: {
          title: `CaseManageVue Data - ${new Date().toLocaleDateString()}`
        }
      })
      
      // Populate with student data
      await populateSheetWithData(response.result.spreadsheetId)
      
      return response.result.spreadsheetId
    } catch (error) {
      console.error('Error creating Google Sheet:', error)
      throw error
    }
  }
  
  return {
    createLinkedGoogleSheet,
    syncNow,
    openGoogleSheet,
    unlinkSheet
  }
}
```

**Authentication Setup**:
1. Enable Google Sheets API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized domains
4. Configure client ID in application

### **Google Forms API**
**Purpose**: Teacher feedback form creation and management

```javascript
// useTeacherFeedback.js - Cloud Functions integration
const sendTeacherFeedbackForm = httpsCallable(functions, 'sendTeacherFeedbackForm')

const createFeedbackForm = async (studentData, teacherEmails) => {
  try {
    const result = await sendTeacherFeedbackForm({
      student: studentData,
      teachers: teacherEmails,
      formTemplate: 'teacher_feedback_v2'
    })
    
    return result.data
  } catch (error) {
    console.error('Error creating feedback form:', error)
    throw error
  }
}
```

**Features**:
- Automated form creation with student-specific questions
- Email distribution to relevant teachers
- Response collection and analysis
- Integration with Firestore for data storage

### **Gmail API**
**Purpose**: Automated email notifications and communications

```javascript
// Cloud Functions - Gmail integration
const gmail = google.gmail({ version: 'v1', auth: jwtClient })

const sendEmail = async (to, subject, htmlBody) => {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody
  ].join('\n')

  const base64Email = Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: base64Email
    }
  })
}
```

## 🏫 **Aeries SIS Integration**

### **Overview**
Aeries Student Information System integration for importing student data and schedules.

```javascript
// useAeriesAPI.js
export function useAeriesAPI() {
  const connectionConfig = reactive({
    baseUrl: "encrypted",
    clientId: "encrypted", 
    clientSecret: "encrypted",
    selectedSchoolId: "school123",
    selectedClassIds: ["class1", "class2"],
    selectedApiTypes: {
      oneroster: true,
      nativeAeries: true
    }
  })

  const connect = async () => {
    try {
      // OAuth authentication with Aeries
      const authResponse = await fetch(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
      })
      
      const { access_token } = await authResponse.json()
      accessToken.value = access_token
      isConnected.value = true
      
    } catch (error) {
      console.error('Aeries connection failed:', error)
      throw error
    }
  }

  return {
    connect,
    disconnect,
    testEndpoint,
    fetchSchools,
    fetchClasses,
    importStudentData
  }
}
```

### **Supported Endpoints**
- **OneRoster API**: Standardized education data format
  - `/orgs` - District information
  - `/schools` - School sites
  - `/students` - Student roster
  - `/teachers` - Teacher roster
  - `/classes` - Class sections
  - `/enrollments` - Student-to-class relationships

- **Native Aeries API**: Aeries-specific endpoints
  - `/api/special-education/students` - Students with IEP/504 plans
  - `/api/special-education/ieps` - IEP documents and data
  - `/api/special-education/504-plans` - 504 plan records

### **Data Import Process**
1. **Authentication**: OAuth 2.0 client credentials flow
2. **School Selection**: Choose specific schools to import from
3. **Data Mapping**: Map Aeries fields to CaseManageVue structure
4. **Validation**: Verify data integrity before import
5. **Import**: Batch import with progress tracking
6. **Sync**: Ongoing synchronization for updates

## ☁️ **Cloud Functions**

### **Function Deployment**
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendTeacherFeedbackForm
```

### **Available Functions**

#### **sendTeacherFeedbackForm**
**Purpose**: Create and send teacher feedback forms

```javascript
exports.sendTeacherFeedbackForm = onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }
  
  // Verify role permissions
  const userRole = context.auth.token.role
  if (!['admin', 'case_manager', 'sped_chair'].includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions')
  }
  
  const { student, teachers, formTemplate } = data
  
  try {
    // Create Google Form
    const form = await createGoogleForm(student, formTemplate)
    
    // Send emails to teachers
    const emailResults = await Promise.all(
      teachers.map(teacher => sendFeedbackEmail(teacher, student, form.url))
    )
    
    // Log the send event
    await admin.firestore().collection('feedbackSendLog').add({
      studentId: student.id,
      formId: form.id,
      teachers: teachers,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid
    })
    
    return {
      success: true,
      formId: form.id,
      formUrl: form.url,
      emailsSent: emailResults.length
    }
    
  } catch (error) {
    console.error('Error sending feedback form:', error)
    throw new functions.https.HttpsError('internal', 'Failed to send feedback form')
  }
})
```

#### **syncFormResponses**
**Purpose**: Sync Google Form responses to Firestore

```javascript
exports.syncFormResponses = onCall(async (data, context) => {
  const { formId } = data
  
  try {
    // Get form responses from Google Forms API
    const responses = await forms.forms.responses.list({ formId })
    
    // Process and store responses
    const batch = admin.firestore().batch()
    
    responses.data.responses?.forEach(response => {
      const docRef = admin.firestore()
        .collection('feedbackResponses')
        .doc(response.responseId)
      
      batch.set(docRef, {
        formId,
        responseId: response.responseId,
        answers: processFormAnswers(response.answers),
        submittedAt: new Date(response.lastSubmittedTime),
        syncedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    })
    
    await batch.commit()
    
    return {
      success: true,
      responsesSynced: responses.data.responses?.length || 0
    }
    
  } catch (error) {
    console.error('Error syncing form responses:', error)
    throw new functions.https.HttpsError('internal', 'Failed to sync responses')
  }
})
```

## 🔒 **Security & Authentication**

### **API Key Management**
```javascript
// Environment variables for secure API key storage
const config = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  },
  aeries: {
    baseUrl: process.env.AERIES_BASE_URL,
    clientId: process.env.AERIES_CLIENT_ID,
    clientSecret: process.env.AERIES_CLIENT_SECRET
  }
}
```

### **Authentication Flow**
1. **User Login**: Firebase Authentication with Google OAuth
2. **Role Verification**: Custom claims set in Firestore user document
3. **API Access**: Role-based permissions for external API calls
4. **Token Refresh**: Automatic token refresh for long-running operations

### **Data Protection**
- **Encryption**: Sensitive data encrypted before API transmission
- **HTTPS Only**: All API calls use secure HTTPS connections
- **Rate Limiting**: Prevent abuse with request rate limiting
- **Audit Logging**: All API calls logged for compliance

## 📊 **Error Handling & Monitoring**

### **Error Handling Strategy**
```javascript
// Standardized error handling across all APIs
const handleAPIError = (error, context) => {
  console.error(`API Error in ${context}:`, error)
  
  // Log to Firestore for monitoring
  logError({
    context,
    error: error.message,
    timestamp: new Date(),
    userId: getCurrentUserId()
  })
  
  // User-friendly error messages
  const userMessage = getErrorMessage(error.code) || 'An unexpected error occurred'
  
  throw new Error(userMessage)
}
```

### **Monitoring & Alerts**
- **Firebase Console**: Monitor function executions and errors
- **Google Cloud Logging**: Detailed logs for all API interactions
- **Error Tracking**: Automatic error reporting and alerting
- **Performance Monitoring**: Track API response times and success rates

## 🔧 **Development & Testing**

### **Local Development**
```bash
# Start Firebase emulators
firebase emulators:start

# Test Cloud Functions locally
firebase functions:shell
```

### **API Testing**
```javascript
// Example test for Aeries API
describe('Aeries API Integration', () => {
  test('should authenticate successfully', async () => {
    const { connect } = useAeriesAPI()
    await expect(connect()).resolves.toBeTruthy()
  })
  
  test('should fetch student data', async () => {
    const students = await fetchStudentsFromAeries()
    expect(students).toHaveLength(greaterThan(0))
  })
})
```

### **Environment Configuration**
```bash
# Development environment
VITE_FIREBASE_PROJECT_ID=casemanagevue-dev
VITE_GOOGLE_CLIENT_ID=dev-client-id
VITE_AERIES_BASE_URL=https://demo.aeries.net

# Production environment  
VITE_FIREBASE_PROJECT_ID=casemangervue
VITE_GOOGLE_CLIENT_ID=prod-client-id
VITE_AERIES_BASE_URL=https://district.aeries.net
```

## 📈 **Performance Optimization**

### **Caching Strategy**
- **Client-side caching**: Cache API responses for improved performance
- **Firebase caching**: Leverage Firestore offline persistence
- **CDN caching**: Static assets cached via Firebase Hosting CDN

### **Batch Operations**
```javascript
// Batch Firestore operations for efficiency
const batch = writeBatch(db)

students.forEach(student => {
  const docRef = doc(db, 'students', student.id)
  batch.set(docRef, student)
})

await batch.commit()
```

### **Rate Limiting**
- **Google APIs**: Respect quota limits and implement exponential backoff
- **Aeries API**: Batch requests to minimize API calls
- **Firebase**: Use connection pooling for optimal performance

---

**Last Updated**: July 2025  
**API Integrations**: 4 major integrations (Firebase, Google, Aeries, Custom)  
**Cloud Functions**: 15+ functions for server-side processing 