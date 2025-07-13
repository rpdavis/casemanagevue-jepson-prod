# Firestore Rules Backup

**Timestamp:** December 17, 2024 - 12:22 AM PST

## Current Status Analysis

The current Firestore rules and student query system **ALREADY** provide full admin access to the following roles:

- `admin`
- `administrator` 
- `administrator_504_CM`
- `sped_chair`

### Evidence:

1. **Firestore Rules (line 16):**
```javascript
function isAdmin() {
  return getUserRole() in ["admin", "administrator", "administrator_504_CM", "sped_chair"];
}
```

2. **Student Queries (lines 150-153):**
```javascript
case 'admin':
case 'administrator':
case 'administrator_504_CM':
case 'sped_chair':
  return await getAdminStudents()
```

3. **Student Access Rules (lines 134-137):**
```javascript
allow get: if isAuthenticated() && (
  isAdmin() ||  // This includes all admin roles
  // ... other role-specific access
```

## Current Firestore Rules (Full Backup)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to safely get user role (handles emulator case where token.role might be undefined)
    function getUserRole() {
      return request.auth.token.get('role', 'admin'); // Default to admin in emulator for development
    }
    
    function isAdmin() {
      return getUserRole() in ["admin", "administrator", "administrator_504_CM", "sped_chair"];
    }
    
    function isCaseManager() {
      return getUserRole() == "case_manager";
    }
    
    function isTeacher() {
      return getUserRole() == "teacher";
    }
    
    function isServiceProvider() {
      return getUserRole() == "service_provider";
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasValidRole() {
      return getUserRole() in [
        "admin", "administrator", "administrator_504_CM", "sped_chair",
        "case_manager", "teacher", "service_provider", "paraeducator"
      ];
    }
    
    function isValidEmail(email) {
      return email.matches('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
    }
    
    function isValidStringLength(value, maxLength) {
      return value is string && value.size() <= maxLength;
    }
    
    function hasNoScriptTags(value) {
      return !(value.matches('.*<script.*') || value.matches('.*javascript:.*'));
    }
    
    function isValidStudentData(data) {
      // Basic validation for bulk import - ensure required structure exists
      return data.app != null &&
             data.app.studentData != null &&
             data.app.studentData.ssid is string &&
             data.app.studentData.firstName is string &&
             data.app.studentData.lastName is string &&
             data.app.studentData.grade is string &&
             (data.app.studentData.plan == null || 
              data.app.studentData.plan in ["IEP", "504", "RTI", "None"]);
    }
    
    function isValidUserData(data) {
      return data.keys().hasAll(['name', 'email', 'role']) &&
             isValidStringLength(data.name, 100) &&
             isValidStringLength(data.email, 255) &&
             isValidEmail(data.email) &&
             hasNoScriptTags(data.name) &&
             hasNoScriptTags(data.email) &&
             data.role in ["admin", "administrator", "administrator_504_CM", "sped_chair", "case_manager", "teacher", "service_provider", "paraeducator"];
    }
    
    // ─── SECURITY RULES ───────────────────────────────────────────────────────
    
    // UsersByUID collection - For user lookup and role sync
    match /usersByUID/{userId} {
      allow read: if isAuthenticated() && hasValidRole();
      allow write: if false; // Only Cloud Functions can write to this collection
    }

    // Users collection - Enhanced validation
    match /users/{userId} {
      allow read: if isAuthenticated() && hasValidRole();
      allow create: if isAuthenticated() && isAdmin() && isValidUserData(resource.data);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin()) && isValidUserData(resource.data);
      allow delete: if isAuthenticated() && isAdmin();
      
      // Aeries configuration - users can only access their own encrypted config
      match /aeries_config/{configId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
    }
    
    // App Settings collection - Admin only with validation
    match /app_settings/{document} {
      allow read: if isAuthenticated() && hasValidRole();
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // Legacy appSettings collection - for backward compatibility
    match /appSettings/{document} {
      allow read: if isAuthenticated() && hasValidRole();
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // Config collection - Read for all, write for admins
    match /config/{configId} {
      allow read: if isAuthenticated() && hasValidRole();
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // Students collection - Database-level security with required WHERE clauses
    match /students/{studentId} {
      // Helper to validate encrypted fields
      function hasValidEncryption() {
        let sensitiveFields = [
          'app.accommodations.assessment',
          'app.accommodations.instruction',
          'app.schedule.classServices',
          'app.studentData.plan'
        ];
        
        return request.resource.data.app != null &&
               sensitiveFields.hasAll([]) &&
               (get(request.resource.data, 'app.accommodations.assessment') == null || 
                get(request.resource.data, 'app.accommodations.assessment') is string) &&
               (get(request.resource.data, 'app.accommodations.instruction') == null || 
                get(request.resource.data, 'app.accommodations.instruction') is string) &&
               (get(request.resource.data, 'app.schedule.classServices') == null || 
                get(request.resource.data, 'app.schedule.classServices') is list) &&
               (get(request.resource.data, 'app.studentData.plan') == null || 
                get(request.resource.data, 'app.studentData.plan') is string);
      }
      
      // Single document access (get)
      allow get: if isAuthenticated() && (
        isAdmin() ||
        (isCaseManager() && resource.data.app.studentData.caseManagerId == request.auth.uid) ||
        (isTeacher() && (
          resource.data.app.schedule != null && 
          resource.data.app.schedule.periods != null &&
          request.auth.uid in resource.data.app.schedule.periods
        )) ||
        (isServiceProvider() && (
          (resource.data.app.providers != null && request.auth.uid in resource.data.app.providers) ||
          (resource.data.app.schedule != null && 
           resource.data.app.schedule.periods != null &&
           request.auth.uid in resource.data.app.schedule.periods)
        ))
      );
      
      // Collection queries (list) - TEMPORARY: Allow all authenticated users to test
      // TODO: Add proper WHERE clause validation once we debug the issue
      allow list: if isAuthenticated() && hasValidRole();
      
      allow create: if isAuthenticated() && (isAdmin() || isCaseManager()) && hasValidEncryption();
      allow update: if isAuthenticated() && (
        isAdmin() ||
        (isCaseManager() && resource.data.app.studentData.caseManagerId == request.auth.uid)
      ) && hasValidEncryption();
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Aide Schedules collection - Admin only
    match /aideSchedules/{aideId} {
      allow read, write: if isAuthenticated() && isAdmin();
    }
    
    // Teacher Feedback Forms - Case managers and admins
    match /feedbackForms/{formId} {
      allow read: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow create, update: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Teacher Feedback Responses - Read-only for authorized users, write-only for functions
    match /feedbackResponses/{responseId} {
      allow read: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow write: if false; // Only Cloud Functions can write responses
    }
    
    // Teacher Feedback Send Log - Read-only for authorized users, write-only for functions
    match /feedbackSendLog/{logId} {
      allow read: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow write: if false; // Only Cloud Functions can write send logs
    }
    
    // Time Tables - Admin only
    match /timeTables/{tableId} {
      allow read: if isAuthenticated() && hasValidRole();
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // Backup and restore data - Admin only
    match /backups/{backupId} {
      allow read, write: if isAuthenticated() && isAdmin();
    }
    
    // System logs - Admin read-only
    match /systemLogs/{logId} {
      allow read: if isAuthenticated() && isAdmin();
      allow write: if false; // Only system can write logs
    }
    
    // Rate limiting collection - Internal use only
    match /rateLimits/{limitId} {
      allow read, write: if false; // Only used internally by functions
    }
    
    // PDF Metadata collection - Enhanced security
    match /pdfMetadata/{fileId} {
      function canAccessPdf(studentId) {
        return isAuthenticated() && 
               hasValidRole() && 
               (isAdmin() || 
                (isCaseManager() && resource.data.studentId == studentId) ||
                (isTeacher() && exists(/databases/$(database)/documents/students/$(studentId))));
      }
      
      allow read: if isAuthenticated() && hasValidRole();
      allow create: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow update: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // PDF Access Logs collection - Admin and case manager only
    match /pdfAccessLogs/{logId} {
      allow read: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow create: if isAuthenticated() && hasValidRole();
      allow update, delete: if false; // Immutable logs
    }
    
    // IEP Access Logs - Immutable audit trail
    match /iepAccessLogs/{logId} {
      allow read: if isAuthenticated() && (isAdmin() || isCaseManager());
      allow create: if isAuthenticated() && hasValidRole();
      allow update, delete: if false; // Logs are immutable
    }
    
    // Default deny-all rule
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Conclusion

**NO CHANGES NEEDED** - The current system already provides full admin access to:
- `administrator`
- `administrator_504_CM` 
- `sped_chair`

These roles have the same access level as `admin` for student data and all other collections. 

---

## **NEW BACKUP ENTRY**
**Timestamp:** December 17, 2024 - 9:20 AM PST  
**Change:** Adding Paraeducator Support to Firebase Rules and Queries

### Rules State BEFORE Paraeducator Changes:

The rules below are what existed before adding paraeducator support:

#### Helper Functions (BEFORE):
```javascript
function isServiceProvider() {
  return getUserRole() == "service_provider";
}

function hasValidRole() {
  return getUserRole() in [
    "admin", "administrator", "administrator_504_CM", "sped_chair",
    "case_manager", "teacher", "service_provider", "paraeducator"
  ];
}
```

#### Student Access Rules (BEFORE):
```javascript
// Single document access (get)
allow get: if isAuthenticated() && (
  isAdmin() ||
  (isCaseManager() && resource.data.app.studentData.caseManagerId == request.auth.uid) ||
  (isTeacher() && (
    resource.data.app.schedule != null && 
    resource.data.app.schedule.periods != null &&
    request.auth.uid in resource.data.app.schedule.periods
  )) ||
  (isServiceProvider() && (
    (resource.data.app.providers != null && request.auth.uid in resource.data.app.providers) ||
    (resource.data.app.schedule != null && 
     resource.data.app.schedule.periods != null &&
     request.auth.uid in resource.data.app.schedule.periods)
  ))
);
```

#### Aide Schedules Access (BEFORE):
```javascript
// Aide Schedules collection - Admin only
match /aideSchedules/{aideId} {
  allow read, write: if isAuthenticated() && isAdmin();
}
```

#### Student Queries (BEFORE):
```javascript
const getParaeducatorStudents = async (userId) => {
  console.log('🔒 Security: Loading students for paraeducator:', userId)
  
  // Paraeducators have very limited access - only students explicitly assigned
  // This would require aide assignment data integration
  // For now, return empty array (most secure approach)
  console.log('🔒 Security: Paraeducator access not yet implemented - returning empty array')
  return []
}
```

### Changes Made:
1. **Added `isParaeducator()` function**
2. **Updated student access rules** to allow paraeducators to read individual students
3. **Updated aide schedules access** to allow paraeducators to read their own schedule
4. **Implemented `getParaeducatorStudents()`** with proper aide assignment logic
5. **Updated paraeducator view** to use database-level filtering

--- 