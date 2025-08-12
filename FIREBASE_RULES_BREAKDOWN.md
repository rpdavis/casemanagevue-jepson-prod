# 🔒 Firebase Security Rules Breakdown

**CaseManageVue - Jepson Production**  
*Comprehensive analysis of Firestore and Storage security rules*

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Firestore Rules](#firestore-rules)
   - [Authentication & Role Helpers](#authentication--role-helpers)
   - [Data Validation](#data-validation)
   - [Access Control Functions](#access-control-functions)
   - [Collection Rules](#collection-rules)
3. [Storage Rules](#storage-rules)
   - [Helper Functions](#helper-functions)
   - [File Access Rules](#file-access-rules)
4. [Security Architecture](#security-architecture)
5. [Migration Strategy](#migration-strategy)

---

## 🎯 Overview

The Firebase security rules implement a **hybrid database-level security filtering system** that provides:

- **Primary Access Control**: `app.staffIds` array for simplified access management
- **Critical Fallbacks**: Case manager direct assignment checks
- **Paraeducator Support**: `aideSchedules` collection integration
- **FERPA Compliance**: Comprehensive audit logging and role-based access
- **Flexible Queries**: Supports additional filters beyond required ones

---

## 🗄️ Firestore Rules

### 🔐 Authentication & Role Helpers

#### Basic Authentication Functions
```javascript
function isAuth() { return request.auth != null; }
function uid() { return request.auth.uid; }
function role() { return request.auth.token.role; }
```
- **Purpose**: Basic authentication and user identification
- **Usage**: Foundation for all other security checks

#### Administrative Roles
| Function | Role | Permissions |
|----------|------|-------------|
| `isAdmin()` | `admin` | Full system access |
| `isSchoolAdmin()` | `school_admin` | Full system access |
| `isAdmin504()` | `admin_504` | 504 plan student management |
| `isSpedChair()` | `sped_chair` | IEP student management |
| `isStaffView()` | `staff_view` | Read-only access to all students |
| `isStaffEdit()` | `staff_edit` | Full edit access to all students |

#### Staff Roles
| Function | Role | Access Level |
|----------|------|-------------|
| `isCaseManager()` | `case_manager` | Students on caseload |
| `isTeacher()` | `teacher` | Assigned students |
| `isServiceProvider()` | `service_provider` | Students receiving services |
| `isParaeducator()` | `paraeducator` | Assigned students via staffIds or aideSchedules |

#### Combined Role Functions
- **`isAnyAdmin()`**: Admin, School Admin, 504 Admin, or SPED Chair
- **`isSuperAdmin()`**: Admin or School Admin (highest privileges)
- **`hasFullReadAccess()`**: Any admin or staff view/edit roles
- **`hasValidRole()`**: Any recognized role in the system

### ✅ Data Validation

#### `validEncryptedFields()`
**Purpose**: Validates that encrypted student data follows the expected structure
- **Accommodations**: Must be a map with string instruction/assessment fields
- **Schedule**: classServices must be a list
- **Student Data**: plan must be a string
- **Critical**: Prevents data corruption and ensures encryption compatibility

### 🛡️ Access Control Functions

#### Primary Access Control: `hasStaffIdsAccess(doc)`
```javascript
function hasStaffIdsAccess(doc) {
  return doc.app.staffIds != null && uid() in doc.app.staffIds;
}
```
- **Purpose**: Main access control mechanism
- **Logic**: User's UID must be in the student's `app.staffIds` array
- **Benefits**: Simplified access management, supports multiple staff per student

#### Critical Fallback: `hasCaseManagerFallback(doc)`
```javascript
function hasCaseManagerFallback(doc) {
  return isCaseManager() && doc.app.studentData.caseManagerId == uid();
}
```
- **Purpose**: Ensures case managers always have access to their students
- **Critical**: Handles timing gaps during staffIds array updates
- **Security**: Only applies to case_manager role

#### Paraeducator Fallback: `hasParaFallback(studentId)`
```javascript
function hasParaFallback(studentId) {
  let sched = get(/databases/$(database)/documents/aideSchedules/$(uid())).data;
  return sched.studentIds != null && studentId in sched.studentIds;
}
```
- **Purpose**: Legacy support for paraeducators during migration
- **Performance**: Uses Firestore `get()` operation (expensive)
- **Migration**: Will be removed once staffIds is fully implemented

#### Query Validation Functions

##### `validStudentQuery()`
**Ensures proper query filtering for security**
- Admins/staff view: No restrictions
- Case managers: Allowed (filtered by document-level access)
- Other staff: Must have valid filters
- Testing queries: Special validation for testing flags

##### `hasStaffIdsFilter()`
**Validates staffIds array-contains queries**
- Checks positions 0-3 in where clause array
- Ensures `app.staffIds array-contains currentUserId`
- Supports additional filters alongside required ones

##### `hasCaseManagerIdFilter()`
**Validates case manager queries**
- Checks for `app.studentData.caseManagerId == currentUserId`
- Supports positions 0-1 in where clause

### 📚 Collection Rules

#### 👥 Students Collection (`/students/{studentId}`)
```javascript
allow read: if isAuth() && hasValidRole() && canReadStudent(studentId);
allow list: if isAuth() && hasValidRole() && validStudentQuery();
allow create: if isAuth() && isAnyAdmin() && validEncryptedFields();
allow update: if isAuth() && hasValidRole() && canEditStudent(studentId) && validEncryptedFields();
allow delete: if isAuth() && isSuperAdmin();
```

**Read Access**:
- Any admin or staff view/edit: Full access
- Staff roles: Must be in student's staffIds array
- Case managers: Fallback to caseManagerId check
- Paraeducators: Fallback to aideSchedules collection

**Edit Access**:
- Super admins: All students
- staff_edit role: All students
- 504 admins: Only 504 plan students
- SPED chairs: Only IEP students
- Case managers: Only their assigned students

**Security Features**:
- Document-level filtering prevents unauthorized access
- Data validation ensures proper structure
- Audit logging for all operations

#### 👤 Users Collection (`/users/{userId}`)
```javascript
allow read: if isAuth() && hasValidRole();
allow create: if isAuth() && isAnyAdmin();
allow update: if isAuth() && (isAnyAdmin() || isOwner(userId));
allow delete: if isAuth() && isAnyAdmin();
```
- **Read**: All valid roles (needed for user lookups)
- **Create/Delete**: Admin roles only
- **Update**: Admins or self-update

#### ⚙️ App Settings Collections

##### General Settings (`/app_settings/{document}`)
- **Read**: All valid roles
- **Write**: Admin roles only

##### Security Settings (`/app_settings/security`)
- **Read**: All users (session timeout settings)
- **Write**: Admin roles only

##### Theme Settings (`/app_settings/theme`)
- **Read**: All users (theme customization)
- **Write**: Admin roles only

#### 👷 Aide Management

##### Aide Schedules (`/aideSchedules/{aideId}`)
- **Read**: Admins or owner (paraeducator)
- **Write**: Admin roles only

##### Aide Assignments (`/aideAssignments/{assignmentId}`)
- **Read/Write**: Admin roles only

#### 📝 Feedback System

##### Feedback Forms (`/feedbackForms/{formId}`)
- **Read/Create/Update**: Admins or case managers
- **Delete**: Super admins only

##### Feedback Responses (`/feedbackResponses/{responseId}`)
- **Read**: Admins or case managers
- **Write**: Cloud Functions only (security)

##### Feedback Send Log (`/feedbackSendLog/{logId}`)
- **Read**: Admins or case managers
- **Write**: Cloud Functions only (audit trail)

##### Feedback Documents (`/feedbackDocuments/{documentId}`)
- **Read/Create/Update**: Admins, case managers, or SPED chairs
- **Delete**: Admin roles only

#### 📊 Audit & Logging

##### Audit Logs (`/auditLogs/{logId}`)
```javascript
allow read: if isAuth() && isSuperAdmin();
allow create: if isAuth() && hasValidRole();
allow write: if isAuth() && hasValidRole();
allow update, delete: if false; // Immutable
```
- **FERPA Compliance**: Complete audit trail
- **Read**: Super admins only (privacy protection)
- **Create/Write**: All users (session timeouts, access logs)
- **Immutable**: Cannot be modified once created

##### Legacy Logs (`/iepAccessLogs/{logId}`, `/pdfAccessLogs/{logId}`)
- **Backward Compatibility**: Maintained for existing data
- **Read**: Admins or case managers
- **Create**: All valid roles
- **Immutable**: Audit trail integrity

#### 🔧 System Collections

##### Config (`/config/{document}`)
- **Read**: All valid roles (permissions matrix)
- **Write**: Super admins only

##### Testing (`/testing/{testId}`)
- **Read**: All valid roles
- **Write**: Admin roles only

##### PDF Metadata (`/pdfMetadata/{fileId}`)
- **Read/Create/Update**: All valid roles
- **Delete**: Admin roles only

##### Backups (`/backups/{backupId}`)
- **All Operations**: Super admins only

---

## 💾 Storage Rules

### 🔧 Helper Functions

#### Role Checking
```javascript
function userRole(role) { return request.auth.token.role == role; }
function isSuperAdmin() { return userRole('admin') || userRole('sped_chair'); }
```

#### Firestore Integration
```javascript
function getStudentDoc(studentId) {
  return firestore.get(/databases/(default)/documents/students/$(studentId));
}
function studentStaffIds(studentId) {
  return getStudentDoc(studentId).data.app.staffIds;
}
```
- **Cross-Service Security**: Storage rules verify Firestore permissions
- **Performance**: Uses Firestore get() operations (expensive but secure)

### 📁 File Access Rules

#### Sensitive Student Documents (`/students/{studentId}/sensitive/{fileName}`)
**For IEPs, BIPs, At-A-Glance documents**

**Read Access**:
- All admin roles (admin, school_admin, admin_504, sped_chair)
- All staff roles with valid role (staff_view, staff_edit, case_manager, teacher, service_provider, paraeducator)
- Users in student's staffIds array

**Write Access**:
- All admin roles
- staff_edit role
- Case managers (for their assigned students)

#### General Student Files (`/students/{studentId}/general/{fileName}`)
**For less sensitive documents**
- **Similar Rules**: Mirrors sensitive folder
- **Flexibility**: Can be relaxed for certain file types

#### Fallback Student Files (`/students/{studentId}/{filePath=**}`)
**For existing file structure compatibility**

**Read Access**:
- Super admins
- 504 coordinators
- Users in student's staffIds array

**Write Access**:
- Super admins
- SPED chairs
- 504 coordinators
- Case managers
- Users in student's staffIds array

#### Encrypted PDFs (`/encrypted-pdfs/{studentId}/{fileName}`)
**For secure PDF system**
- **Read**: Same as sensitive documents
- **Write**: Broader access including all staff roles
- **Encryption**: Additional security layer

#### Administrative Files (`/admin/{filePath=**}`)
- **Read/Write**: Super admins only

#### Public Assets (`/public/{filePath=**}`)
- **Read**: All authenticated users
- **Write**: Super admins only

---

## 🏗️ Security Architecture

### Multi-Layered Security

1. **Authentication Layer**: Firebase Auth with custom claims
2. **Role-Based Access**: Granular permissions per role
3. **Document-Level Filtering**: Firestore rules prevent unauthorized access
4. **Data Validation**: Structure and content validation
5. **Audit Logging**: Complete FERPA-compliant audit trail
6. **Cross-Service Integration**: Storage rules verify Firestore permissions

### Access Control Hierarchy

```
Super Admins (admin, school_admin)
├── Full system access
├── Can manage all users and students
└── Can access audit logs

Specialized Admins
├── admin_504: 504 plan students only
├── sped_chair: IEP students only
├── staff_view: Read-only access to all students
└── staff_edit: Read-only access to all students

Staff Roles
├── case_manager: Assigned students (caseload)
├── teacher: Students in staffIds array
├── service_provider: Students receiving services
└── paraeducator: Assigned students via staffIds or aideSchedules
```

### Data Flow Security

1. **Query Validation**: Ensures proper filtering at query level
2. **Document Access**: Individual document permission checks
3. **Field Validation**: Data structure and content validation
4. **Audit Creation**: Automatic logging of all operations
5. **Cross-Reference**: Storage rules verify Firestore permissions

---

## 🔄 Migration Strategy

### Current Phase: Hybrid Implementation

**Primary Method**: `app.staffIds` array
- Simplified access management
- Supports multiple staff per student
- Efficient query filtering

**Critical Fallbacks**: 
- Case manager direct assignment (prevents access gaps)
- Paraeducator aideSchedules collection (legacy support)

### Migration Path

#### Phase 1: Deploy Hybrid Rules ✅ **(Current)**
- Primary staffIds access with fallbacks
- Monitor fallback usage in logs
- Ensure no access disruption

#### Phase 2: Monitor and Validate
- Track fallback usage frequency
- Verify staffIds array completeness
- Identify any remaining gaps

#### Phase 3: Remove Fallbacks
- Eliminate case manager fallback
- Remove paraeducator aideSchedules dependency
- Pure staffIds-based access control

### Benefits After Migration

- **Performance**: Eliminated expensive Firestore get() calls
- **Simplicity**: Single access control mechanism
- **Scalability**: Efficient query patterns
- **Maintainability**: Simplified rule logic

---

## 🛡️ Security Best Practices Implemented

### FERPA Compliance
- **Audit Logging**: All student data access logged
- **Role-Based Access**: Minimum necessary access principle
- **Immutable Logs**: Audit trails cannot be modified
- **Access Monitoring**: Super admin oversight of all access

### Data Protection
- **Encryption**: Sensitive fields encrypted at application level
- **Structure Validation**: Prevents data corruption
- **Cross-Service Security**: Storage rules verify Firestore permissions
- **Fallback Mechanisms**: Ensures continuous access during updates

### Performance Optimization
- **Query-Level Filtering**: Reduces data transfer
- **Document-Level Security**: Prevents unauthorized access
- **Efficient Indexing**: Optimized for staffIds array queries
- **Minimal Firestore Reads**: Reduced expensive operations

### Operational Security
- **Default Deny**: All undefined paths denied by default
- **Principle of Least Privilege**: Minimum required access
- **Role Separation**: Clear boundaries between roles
- **Administrative Oversight**: Super admin controls for sensitive operations

---

*Last Updated: January 2025*  
*Version: 1.0.8*  
*Security Rules Version: 2*

---

## 🔄 Recent Updates (v1.0.8)

### ✅ **Fixed Issues:**
- **PDF Document Access**: Fixed `staff_view` and `staff_edit` roles unable to open At-A-Glance and other PDF documents
- **Storage Rules**: Updated to allow all valid roles to read student documents
- **PDF Security**: Updated `verifyAccess` method to include all admin and staff roles
- **Role Permissions**: Clarified that `staff_edit` has full edit access, not read-only

### 🔧 **Technical Changes:**
- Updated `pdfSecurity.js` `verifyAccess()` method to include `staff_view`, `staff_edit`, `school_admin`, `admin_504`
- Modified Storage Rules to use `hasValidRole()` for document read access
- Enhanced documentation to reflect actual permissions vs. intended permissions
