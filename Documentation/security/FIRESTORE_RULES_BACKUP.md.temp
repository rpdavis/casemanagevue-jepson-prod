# Firestore Rules Backup

**Latest Update:** January 20, 2025 - PERMISSIONS AUDIT & TEACHER FEEDBACK SECURITY UPDATE

## Latest Update: Permissions Audit & Teacher Feedback Security

### Overview:
Completed comprehensive permissions audit and updated teacher feedback security rules. Fixed SPED Chair permissions mismatch between roles.js and Firebase rules. Updated teacher feedback permissions to properly include all admin roles (admin, school_admin, sped_chair, admin_504) plus case managers.

### Key Changes:

#### 1. **SPED Chair Permissions Fixed**
- **Added missing permissions:** `EDIT_USER`, `DELETE_USER` to match Firebase rules
- **Firebase rules:** SPED Chair included in `isAnyAdmin()` function
- **Business logic:** SPED Chair manages special education programs and needs user management access

#### 2. **Teacher Feedback Permissions Corrected**
- **Read/Write Access:** Admin, School Admin, SPED Chair, 504 Coordinator, Case Manager
- **Delete Access:** Admin, School Admin, SPED Chair, 504 Coordinator
- **Business justification:** 
  - 504 Coordinators run meetings and act as case managers
  - School Admins manage workspace accounts and need operational access
  - Teacher feedback forms are operational documents, not confidential

#### 3. **Case Manager Permissions Updated**
- **Added:** `MANAGE_TEACHER_FEEDBACK` permission
- **Justification:** Case managers work directly with teachers and need feedback form access

#### 4. **Permissions Overview Accuracy**
- Updated `PermissionsOverview.vue` to reflect actual Firebase rules
- Fixed discrepancies between displayed permissions and actual rules
- Ensured single source of truth between `roles.js` and Firebase rules

## Previous Update: Automatic Sheet Creation System

### Overview:
Implemented a comprehensive automatic Google Sheet creation system for feedback forms. This system creates organized sheets with multiple tabs (Summary, Template, and individual student tabs) when forms are created and used. Also includes enhanced student tab creation when feedback forms are sent.

### Key Changes:

#### 1. **New Cloud Function: `createFeedbackFormSheet`**
**Purpose:** Automatically creates Google Sheets for feedback forms with organized tab structure
**Functionality:**
- Creates new Google Sheet with Summary and Template tabs
- Includes form information and student tracking in Summary tab
- Provides standard response format in Template tab
- Returns spreadsheet ID and URL for linking

**Sheet Structure Created:**
```
📊 "Feedback Responses - [Title]"
├── 📋 Summary Tab
│   ├── Form Information (A1-A4)
│   └── Student Tracking Table (A6:E)
├── 📋 Template Tab
│   └── Standard Headers (A1:G1)
```

#### 2. **Enhanced `sendTeacherFeedbackForm` Function**
**New Functionality:**
- Automatically creates student-specific tabs when forms are sent
- Updates Summary tab with student tracking information
- Sanitizes student names for Google Sheets compatibility
- Handles tab creation errors gracefully

**Student Tab Creation Process:**
- Creates new tab named after the student (sanitized)
- Copies template structure from Template tab
- Adds student information header
- Updates Summary tab with student tracking row

#### 3. **New Helper Functions**
**`createStudentTab()`:**
- Creates individual student tabs with proper structure
- Adds headers and student information
- Updates Summary tab with tracking data

**`sanitizeTabName()`:**
- Removes invalid characters for Google Sheets
- Limits tab name length to 25 characters
- Normalizes spaces and formatting

#### 4. **Updated Google Auth Scopes**
**Enhanced Permissions:**
```javascript
scopes: [
  "https://www.googleapis.com/auth/spreadsheets", // Full access (was readonly)
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "https://www.googleapis.com/auth/gmail.send"
]
```

#### 5. **Frontend Integration Updates**
**`useTeacherFeedback.js`:**
- Added `createFeedbackFormSheet` function call
- Enhanced `createFeedbackForm` to automatically create sheets
- Updated return data to include sheet information

**`AdminTeacherFeedback.vue`:**
- Updated UI to show sheet URLs when available
- Added status indicators for sheet creation
- Enhanced setup instructions for automatic workflow

## Previous Update: Feedback Documents Permission Fix

### Overview:
Fixed permission issues with the `feedbackDocuments` collection that were preventing SPED Chair and 504 Administrator roles from accessing feedback documents. Also added missing function definitions and improved error handling.

### Key Changes:

#### 1. **Fixed feedbackDocuments Collection Permissions**
**Before (Too Restrictive):**
```javascript
// Feedback documents - Each case manager can only access their own documents
match /feedbackDocuments/{documentId} {
  allow read: if isAuth() && (
    isAnyAdmin() || 
    (isCaseManager() && resource.data.caseManagerId == request.auth.uid) ||
    (isSpedChair() && resource.data.caseManagerId == request.auth.uid)
  );
  // ... similar restrictions for create/update
}
```

**After (More Permissive for Admin Roles):**
```javascript
// Feedback documents - Admin roles and case managers can access documents
match /feedbackDocuments/{documentId} {
  allow read: if isAuth() && (
    isAnyAdmin() || 
    isCaseManager() || 
    isSpedChair() || 
    isAdministrator504()
  );
  allow create: if isAuth() && (
    isAnyAdmin() || 
    isCaseManager() || 
    isSpedChair() || 
    isAdministrator504()
  );
  allow update: if isAuth() && (
    isAnyAdmin() || 
    isCaseManager() || 
    isSpedChair() || 
    isAdministrator504()
  );
  allow delete: if isAuth() && isAnyAdmin();
}
```

#### 2. **Added Missing Function Definitions**
Added the missing `isSpedChair()` and `isAdministrator504()` functions that were referenced but not defined:

```javascript
function isSpedChair() {
  return role() == 'sped_chair';
}

function isAdministrator504() {
  return role() == 'administrator_504_CM';
}
```

#### 3. **Enhanced Feedback Form Copy Functionality**
Fixed JavaScript errors in `TeacherFeedbackDialog.vue`:
- **Fixed users array handling** - `users.value` is an object, not an array
- **Added better error handling** for clipboard operations
- **Added fallback copy methods** for older browsers
- **Added visual feedback** when copy operations fail

**Before (Causing TypeError):**
```javascript
.map(id => users.value.find(u => u.id === id))
```

**After (Proper Array Handling):**
```javascript
const userArray = Object.values(users.value)
.map(id => userArray.find(u => u.id === id))
```

#### 4. **Improved Copy Button User Experience**
- **Modern Clipboard API** with fallback for older browsers
- **Try/catch error handling** around clipboard operations
- **Visual URL display** if automatic copy fails
- **Manual copy button** as backup option
- **Debug logging** to track copy operations

### Issues Resolved:
1. ✅ **Firebase Permission Error** - "Missing or insufficient permissions" for feedback documents
2. ✅ **TypeError: a.value.find** - Fixed users array handling in TeacherFeedbackDialog
3. ✅ **Copy Button Not Working** - Enhanced with better error handling and fallbacks
4. ✅ **Missing Function Definitions** - Added isSpedChair() and isAdministrator504()

### Impact:
- **SPED Chair and 504 Administrator roles** can now access feedback documents
- **Feedback form copy functionality** works reliably across different browsers
- **Better error handling** provides clear feedback when operations fail
- **Improved user experience** with fallback options for copy operations

---

### Deployment Results (January 20, 2025):
**✅ Successful Deployment:**
- New function `createFeedbackFormSheet` created successfully
- All existing functions updated successfully
- Total functions deployed: 16 active functions
- No deployment errors or warnings

**New Function Details:**
- **Function Name:** `createFeedbackFormSheet`
- **Region:** us-central1
- **Authentication:** Admin roles only
- **Purpose:** Automatic Google Sheet creation for feedback forms

**System Status:**
- ✅ Automatic sheet creation is now live
- ✅ Student tab creation is now live
- ✅ Enhanced feedback form workflow is active
- ✅ All documentation updated

### Impact of New System:
- **🔄 Fully Automated:** No manual sheet creation needed
- **📊 Better Organization:** One sheet per form with multiple student tabs
- **🎯 Student-Specific:** Each student gets their own tab automatically
- **📈 Easy Analysis:** Summary tab provides overview of all students
- **📱 Mobile Friendly:** One sheet to manage vs. many individual sheets

---

## Previous Update: Dynamic Document Generation Rules

### Overview:
Added support for the new dynamic document generation system with the `feedbackDocuments` collection. This enables case managers to generate and manage their own Google Docs from feedback form responses.

### Key Changes:

#### 1. **New feedbackDocuments Collection**
```javascript
// Feedback documents - Each case manager can only access their own documents
match /feedbackDocuments/{documentId} {
  allow read: if isAuth() && (
    isAnyAdmin() || 
    (isCaseManager() && resource.data.caseManagerId == request.auth.uid) ||
    (isSpedChair() && resource.data.caseManagerId == request.auth.uid)
  );
  allow create: if isAuth() && (
    isAnyAdmin() || 
    (isCaseManager() && request.resource.data.caseManagerId == request.auth.uid) ||
    (isSpedChair() && request.resource.data.caseManagerId == request.auth.uid)
  );
  allow update: if isAuth() && (
    isAnyAdmin() || 
    (isCaseManager() && resource.data.caseManagerId == request.auth.uid) ||
    (isSpedChair() && resource.data.caseManagerId == request.auth.uid)
  );
  allow delete: if isAuth() && isAnyAdmin();
}
```

#### 2. **Enhanced Data Validation**
Updated `validEncryptedFields()` function to handle the new nested structure:
```javascript
    function validEncryptedFields() {
      let d = request.resource.data.app;
  return (d.accommodations == null || 
          (d.accommodations is map &&
           (d.accommodations.instruction == null || d.accommodations.instruction is string) &&
           (d.accommodations.assessment == null || d.accommodations.assessment is string))) &&
         (d.schedule == null || 
          (d.schedule.classServices == null || d.schedule.classServices is list)) &&
         (d.studentData == null || 
          (d.studentData.plan == null || d.studentData.plan is string));
}
```

#### 3. **Fixed Circular get() Issue**
Updated access control functions to use `resource.data` instead of `get()` calls:
```javascript
    function canReadStudent(studentId) {
  let doc = resource.data; // ✅ Use the document being evaluated
      
      return isAnyAdmin() ||
         // Primary array check
         (isStaffRole() && doc.app.staffIds != null && uid() in doc.app.staffIds) ||
         // Fallback for case managers  
         (isCaseManager() && doc.app.studentData.caseManagerId == uid()) ||
         // Paraeducator fallback (still needs get() on aideSchedules)
             (isParaeducator() && hasParaFallback(studentId));
    }
```

#### 4. **Enhanced Query Validation**
Improved `hasStaffIdsFilter()` to search all WHERE clauses:
```javascript
    function hasStaffIdsFilter() {
      return request.query.where != null &&
             request.query.where.size() > 0 &&
         (
           // Check each possible position for the staffIds filter
           (request.query.where.size() >= 1 &&
            request.query.where[0][0] == 'app.staffIds' && 
            request.query.where[0][1] == 'array-contains' && 
               request.query.where[0][2] == uid()) ||
           (request.query.where.size() >= 2 &&
            request.query.where[1][0] == 'app.staffIds' && 
            request.query.where[1][1] == 'array-contains' && 
            request.query.where[1][2] == uid()) ||
           (request.query.where.size() >= 3 &&
            request.query.where[2][0] == 'app.staffIds' && 
            request.query.where[2][1] == 'array-contains' && 
            request.query.where[2][2] == uid()) ||
           (request.query.where.size() >= 4 &&
            request.query.where[3][0] == 'app.staffIds' && 
            request.query.where[3][1] == 'array-contains' && 
            request.query.where[3][2] == uid())
         );
}
```

### Current Rules (340 lines):
```firestore
rules_version = '2';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    HYBRID DATABASE-LEVEL SECURITY FILTERING                ║
// ║ This ruleset implements a hybrid approach using app.staffIds as primary   ║
// ║ access control with essential fallbacks for migration safety.             ║
// ║                                                                           ║
// ║ KEY FEATURES:                                                             ║
// ║ 1. PRIMARY ACCESS: app.staffIds array for simplified access control       ║
// ║ 2. CRITICAL FALLBACK: Case manager direct assignment check                ║
// ║ 3. PARA FALLBACK: aideSchedules collection until staffIds complete        ║
// ║ 4. FLEXIBLE QUERIES: Allows additional filters beyond required ones       ║
// ║                                                                           ║
// ║ MIGRATION PATH:                                                           ║
// ║ Phase 1: Deploy these hybrid rules (current)                             ║
// ║ Phase 2: Monitor fallback usage in logs                                  ║
// ║ Phase 3: Remove fallbacks once staffIds proven 100% reliable             ║
// ║                                                                           ║
// ║ See Documentation/SECURITY_DATABASE_FILTERING.md for details             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ─── AUTH & ROLE HELPERS ─────────────────────────────────────────────────
    function isAuth() { 
      return request.auth != null; 
    }
    
    function uid() { 
      return request.auth.uid; 
    }
    
    function role() { 
      return request.auth.token.role; 
    }
    
    // Admin role checks
    function isAdmin() { 
      return role() == 'admin'; 
    }
    
    function isSchoolAdmin() { 
      return role() == 'school_admin'; 
    }
    
    function isAdmin504() { 
      return role() == 'admin_504'; 
    }
    
    function isSpedChair() {
      return role() == 'sped_chair';
    }
    
    function isStaffView() {
      return role() == 'staff_view';
    }
    
    function isStaffEdit() {
      return role() == 'staff_edit';
    }
    
    function isAnyAdmin() { 
      return isAdmin() || isSchoolAdmin() || isAdmin504() || isSpedChair(); 
    }
    
    // Staff role checks
    function isCaseManager() {
      return role() == 'case_manager';
    }
    
    function isTeacher() {
      return role() == 'teacher';
    }
    
    function isServiceProvider() {
      return role() == 'service_provider';
    }
    
    function isParaeducator() {
      return role() == 'paraeducator';
    }
    
    function isStaffRole() {
      return role() in ['case_manager', 'teacher', 'service_provider', 'paraeducator'];
    }
    
    function hasValidRole() {
      return role() in ['admin', 'administrator', 'administrator_504_CM', 'sped_chair', 
                       'case_manager', 'teacher', 'service_provider', 'paraeducator'];
    }
    
    function isOwner(userId) {
      return uid() == userId;
    }
    
    // ─── DATA VALIDATION ──────────────────────────────────────────────────────
    // Validate data structure matches expected format
    function validEncryptedFields() {
      let d = request.resource.data.app;
      return (d.accommodations == null || 
              (d.accommodations is map &&
               (d.accommodations.instruction == null || d.accommodations.instruction is string) &&
               (d.accommodations.assessment == null || d.accommodations.assessment is string))) &&
             (d.schedule == null || 
              (d.schedule.classServices == null || d.schedule.classServices is list)) &&
             (d.studentData == null || 
              (d.studentData.plan == null || d.studentData.plan is string));
    }
    
    // ─── ACCESS CONTROL ────────────────────────────────────────────────────────
    // PRIMARY: Check staffIds array for access
    function hasStaffIdsAccess(doc) {
      return doc.app.staffIds != null && uid() in doc.app.staffIds;
    }
    
    // CRITICAL FALLBACK: Case manager direct assignment (handles timing gaps)
    function hasCaseManagerFallback(doc) {
      return isCaseManager() && 
             doc.app.studentData.caseManagerId == uid();
    }
    
    // PARA FALLBACK: Check aideSchedules collection
    function hasParaFallback(studentId) {
      let sched = get(/databases/$(database)/documents/aideSchedules/$(uid())).data;
      return sched.studentIds != null && studentId in sched.studentIds;
    }
    
    // Combined read access for a student document - use resource.data instead of get()
    function canReadStudent(studentId) {
      let doc = resource.data;
      
      return isAnyAdmin() ||
             // Primary array check
             (isStaffRole() && doc.app.staffIds != null && uid() in doc.app.staffIds) ||
             // Fallback for case managers
             (isCaseManager() && doc.app.studentData.caseManagerId == uid()) ||
             // Paraeducator fallback (still needs get() on aideSchedules)
             (isParaeducator() && hasParaFallback(studentId));
    }
    
    // Edit permissions - use resource.data instead of get()
    function canEditStudent(studentId) {
      let doc = resource.data;
      
      return isSuperAdmin() ||
             (isAdmin504() && 
              doc.app.studentData.plan == '504' &&
              request.resource.data.app.studentData.plan == '504') ||
             // Case managers can edit students on their caseload
             (isCaseManager() && doc.app.studentData.caseManagerId == uid());
    }
    
    // Query validation: ensure proper filtering
    function validStudentQuery() {
      // Admins can query without restrictions
      return isAnyAdmin() ||
             // Case managers can query (will be filtered by access control)
             isCaseManager() ||
             // Other staff with valid filters
             (isStaffRole() && hasValidStaffQuery()) ||
             // Testing queries
             hasValidTestingQuery();
    }
    
    // Check if staff query has required filters
    function hasValidStaffQuery() {
      return request.query.where != null &&
             (hasStaffIdsFilter() || 
              (isCaseManager() && hasCaseManagerIdFilter()));
    }
    
    // Check for staffIds filter - search through all where clauses
    function hasStaffIdsFilter() {
      return request.query.where != null &&
             request.query.where.size() > 0 &&
             (
               // Check each possible position for the staffIds filter
               (request.query.where.size() >= 1 &&
                request.query.where[0][0] == 'app.staffIds' && 
                request.query.where[0][1] == 'array-contains' && 
                request.query.where[0][2] == uid()) ||
               (request.query.where.size() >= 2 &&
                request.query.where[1][0] == 'app.staffIds' && 
                request.query.where[1][1] == 'array-contains' && 
                request.query.where[1][2] == uid()) ||
               (request.query.where.size() >= 3 &&
                request.query.where[2][0] == 'app.staffIds' && 
                request.query.where[2][1] == 'array-contains' && 
                request.query.where[2][2] == uid()) ||
               (request.query.where.size() >= 4 &&
                request.query.where[3][0] == 'app.staffIds' && 
                request.query.where[3][1] == 'array-contains' && 
                request.query.where[3][2] == uid())
             );
    }
    
    // Check for caseManagerId filter
    function hasCaseManagerIdFilter() {
      return request.query.where.size() > 0 &&
             ((request.query.where[0][0] == 'app.studentData.caseManagerId' && 
               request.query.where[0][1] == '==' && 
               request.query.where[0][2] == uid()) ||
              (request.query.where.size() > 1 &&
               request.query.where[1][0] == 'app.studentData.caseManagerId' && 
               request.query.where[1][1] == '==' && 
               request.query.where[1][2] == uid()));
    }
    
    // Check for testing query filters
    function hasValidTestingQuery() {
      return request.query.where != null && 
             request.query.where.size() > 0 &&
             (request.query.where[0][0] == 'app.flags.flag2' || 
              request.query.where[0][0] == 'app.flags.separateSetting') &&
             request.query.where[0][1] == '==' && 
             request.query.where[0][2] == true;
    }
    
    // ─── COLLECTIONS ──────────────────────────────────────────────────────────
    
    // Students collection - Fixed to use resource.data
    match /students/{studentId} {
      allow read: if isAuth() && hasValidRole() && canReadStudent(studentId);
      allow create: if isAuth() && isAnyAdmin() && validEncryptedFields();
      allow update: if isAuth() && hasValidRole() && canEditStudent(studentId) && validEncryptedFields();
      allow delete: if isAuth() && isSuperAdmin();
    }
    
    // Users collection - Admin management, staff read access for names/lookup
    match /users/{userId} {
      allow read: if isAuth() && hasValidRole();
      allow create: if isAuth() && isAnyAdmin();
      allow update: if isAuth() && (isAnyAdmin() || isOwner(userId));
      allow delete: if isAuth() && isAnyAdmin();
    }
    
    // App settings - Admin only write, all valid roles read
    match /app_settings/{document} {
      allow read: if isAuth() && hasValidRole();
      allow write: if isAuth() && isAnyAdmin();
    }
    
    // Security settings - Admin only (includes session timeout settings)
    match /app_settings/security {
      allow read: if isAuth() && hasValidRole(); // All users need to read timeout settings
      allow write: if isAuth() && isAnyAdmin(); // Only admins can change security settings
    }
    
    // Aide schedules - Admin and paraeducator access
    match /aideSchedules/{aideId} {
      allow read: if isAuth() && (isAnyAdmin() || isOwner(aideId));
      allow write: if isAuth() && isAnyAdmin();
    }
    
    // Config collection (permissions matrix and other config)
    match /config/{document} {
      allow read: if isAuth() && hasValidRole();
      allow write: if isAuth() && isSuperAdmin();
    }
    
    // Feedback forms - Case managers and all admin roles
    match /feedbackForms/{formId} {
      allow read: if isAuth() && (isAnyAdmin() || isCaseManager());
      allow create, update: if isAuth() && (isAnyAdmin() || isCaseManager());
      allow delete: if isAuth() && isSuperAdmin();
    }
    
    // Feedback responses - Read-only, write via Cloud Functions
    match /feedbackResponses/{responseId} {
      allow read: if isAuth() && (isAnyAdmin() || isCaseManager());
      allow write: if false; // Only Cloud Functions
    }
    
    // Feedback send log - Read-only, write via Cloud Functions
    match /feedbackSendLog/{logId} {
      allow read: if isAuth() && (isAnyAdmin() || isCaseManager());
      allow write: if false; // Only Cloud Functions
    }
    
    // Feedback documents - Each case manager can only access their own documents
    match /feedbackDocuments/{documentId} {
      allow read: if isAuth() && (
        isAnyAdmin() || 
        (isCaseManager() && resource.data.caseManagerId == request.auth.uid) ||
        (isSpedChair() && resource.data.caseManagerId == request.auth.uid)
      );
      allow create: if isAuth() && (
        isAnyAdmin() || 
        (isCaseManager() && request.resource.data.caseManagerId == request.auth.uid) ||
        (isSpedChair() && request.resource.data.caseManagerId == request.auth.uid)
      );
      allow update: if isAuth() && (
        isAnyAdmin() || 
        (isCaseManager() && resource.data.caseManagerId == request.auth.uid) ||
        (isSpedChair() && resource.data.caseManagerId == request.auth.uid)
      );
      allow delete: if isAuth() && isAnyAdmin();
    }
    
    // Testing collection
    match /testing/{testId} {
      allow read: if isAuth() && hasValidRole();
      allow write: if isAuth() && isAnyAdmin();
    }
    
    // Audit logs - FERPA compliance audit trail
    match /auditLogs/{logId} {
      allow read: if isAuth() && isSuperAdmin(); // Only super admins can read audit logs
      allow create: if isAuth() && hasValidRole(); // All authenticated users can create logs
      allow write: if isAuth() && hasValidRole(); // Allow write for session timeout logging
      allow update, delete: if false; // Audit logs are immutable
    }
    
    // IEP Access logs - Legacy, keeping for backward compatibility
    match /iepAccessLogs/{logId} {
      allow read: if isAuth() && (isAnyAdmin() || isCaseManager());
      allow create: if isAuth() && hasValidRole();
      allow update, delete: if false; // Immutable logs
    }
    
    // PDF Access logs - Legacy, keeping for backward compatibility  
    match /pdfAccessLogs/{logId} {
      allow read: if isAuth() && (isAnyAdmin() || isCaseManager());
      allow create: if isAuth() && hasValidRole();
      allow update, delete: if false; // Immutable logs
    }
    
    // PDF Metadata - For secure PDF system
    match /pdfMetadata/{fileId} {
      allow read: if isAuth() && hasValidRole();
      allow create: if isAuth() && hasValidRole();
      allow update: if isAuth() && hasValidRole();
      allow delete: if isAuth() && isAnyAdmin();
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Deployment Status:
```bash
firebase deploy --only firestore:rules
✔  cloud.firestore: rules file firestore.rules compiled successfully
✔  firestore: released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

### New Features Enabled:

#### ✅ **Dynamic Document Generation**
- Case managers can generate Google Docs from feedback responses
- Documents are automatically linked to case manager accounts
- Secure access control prevents cross-case-manager document access
- Admin roles can access all documents for oversight

#### ✅ **Enhanced Data Validation**
- Proper validation of nested accommodation structures
- Support for both string and map-based accommodation fields
- Maintains encryption requirements for sensitive data

#### ✅ **Improved Query Performance**
- Fixed circular `get()` calls that were causing permission errors
- More robust WHERE clause parsing for complex queries
- Better support for multiple filter conditions

#### ✅ **Security Enhancements**
- Case manager isolation for document access
- Proper role-based permissions for all new collections
- FERPA compliance maintained throughout

### Collections Summary:

#### **Core Collections:**
- **students**: Hybrid security with staffIds + fallbacks
- **users**: All valid roles can read for name lookups
- **app_settings**: All valid roles read, admins write
- **config**: All valid roles read, super admins write

#### **Feedback System:**
- **feedbackForms**: Admin roles and case managers
- **feedbackResponses**: Read-only, Cloud Functions write
- **feedbackSendLog**: Read-only, Cloud Functions write
- **feedbackDocuments**: Case manager isolation, admin oversight

#### **Support Collections:**
- **aideSchedules**: Admin and paraeducator access
- **testing**: All valid roles read, admins write
- **auditLogs**: Super admin read, all roles create
- **pdfMetadata**: All valid roles, admin delete

This update successfully integrates the dynamic document generation system while maintaining the existing hybrid security model and FERPA compliance.

---

**Previous Update:** July 20, 2025 - Current Production Rules Backup