# Firebase Storage Permissions Matrix

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Related Files:** `storage.rules`, `firestore.rules`, `src/utils/pdfSecurity.js`

## Overview

This document maps out the complete storage permissions for all user roles in the CaseManageVue application. The storage rules implement FERPA-compliant access controls with cross-service validation against Firestore data and AES-256 PDF encryption.

---

## Role-Based Storage Access Matrix

### 🔴 **Super Administrators** (`admin`, `sped_chair`)
**Full System Access - No Restrictions**

| File Location | Read Access | Write Access | Notes |
|---------------|-------------|--------------|--------|
| `students/{studentId}/sensitive/` | ✅ **ALL FILES** | ✅ **ALL FILES** | Can access any student's sensitive documents |
| `students/{studentId}/general/` | ✅ **ALL FILES** | ✅ **ALL FILES** | Can access any student's general files |
| `students/{studentId}/` (fallback) | ✅ **ALL FILES** | ✅ **ALL FILES** | Can access any existing student files |
| `encrypted-pdfs/{studentId}/` | ✅ **ALL FILES** | ✅ **ALL FILES** | Can access encrypted PDF files |
| `admin/` | ✅ **ALL FILES** | ✅ **ALL FILES** | Administrative files only accessible to super admins |
| `public/` | ✅ **ALL FILES** | ✅ **ALL FILES** | Can read and manage public assets |

---

### 🟡 **504 Coordinators** (`administrator_504_CM`)
**Full Read Access + Selective Write Access**

| File Location | Read Access | Write Access | Notes |
|---------------|-------------|--------------|--------|
| `students/{studentId}/sensitive/` | ✅ **ALL FILES** | ✅ **504 Students Only** | Can read all sensitive files; can write only to 504-plan students |
| `students/{studentId}/general/` | ✅ **ALL FILES** | ✅ **504 Students Only** | Can read all general files; can write only to 504-plan students |
| `students/{studentId}/` (fallback) | ✅ **ALL FILES** | ✅ **504 Students Only** | Can read all existing files; can write only to 504-plan students |
| `encrypted-pdfs/{studentId}/` | ✅ **ALL FILES** | ✅ **504 Students Only** | Can access encrypted PDFs for 504 students |
| `admin/` | ❌ **NO ACCESS** | ❌ **NO ACCESS** | Cannot access administrative files |
| `public/` | ✅ **ALL FILES** | ❌ **NO ACCESS** | Read-only access to public assets |

**Write Permission Logic:**
- Can upload/delete files ONLY for students where `studentData.plan == '504'`
- Cross-service validation checks Firestore student document to verify plan type

---

### 🟢 **Case Managers** (`case_manager`)
**Assigned Students Only**

| File Location | Read Access | Write Access | Notes |
|---------------|-------------|--------------|--------|
| `students/{studentId}/sensitive/` | ✅ **Assigned Students** | ✅ **Assigned Students** | Only for students where they are the case manager |
| `students/{studentId}/general/` | ✅ **Assigned Students** | ✅ **Assigned Students** | Only for students where they are the case manager |
| `students/{studentId}/` (fallback) | ✅ **Assigned Students** | ✅ **Assigned Students** | Only for students where they are the case manager |
| `encrypted-pdfs/{studentId}/` | ✅ **Assigned Students** | ✅ **Assigned Students** | Can access encrypted PDFs for assigned students |
| `admin/` | ❌ **NO ACCESS** | ❌ **NO ACCESS** | Cannot access administrative files |
| `public/` | ✅ **ALL FILES** | ❌ **NO ACCESS** | Read-only access to public assets |

**Access Permission Logic:**
- Read: Can access files if `request.auth.uid` is in the student's `staffIds` array OR if they are the primary case manager
- Write: Can upload/delete files ONLY for students where `request.auth.uid == studentData.caseManagerId`

---

### 🔵 **Teachers** (`teacher`)
**Staff Assignment Based Access**

| File Location | Read Access | Write Access | Notes |
|---------------|-------------|--------------|--------|
| `students/{studentId}/sensitive/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `students/{studentId}/general/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `students/{studentId}/` (fallback) | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `encrypted-pdfs/{studentId}/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to encrypted PDFs |
| `admin/` | ❌ **NO ACCESS** | ❌ **NO ACCESS** | Cannot access administrative files |
| `public/` | ✅ **ALL FILES** | ❌ **NO ACCESS** | Read-only access to public assets |

**Access Permission Logic:**
- Can read files only if `request.auth.uid` is in the student's `staffIds` array
- Cannot upload or delete any student files

---

### 🟣 **Service Providers** (`service_provider`)
**Staff Assignment Based Access**

| File Location | Read Access | Write Access | Notes |
|---------------|-------------|--------------|--------|
| `students/{studentId}/sensitive/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `students/{studentId}/general/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `students/{studentId}/` (fallback) | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `encrypted-pdfs/{studentId}/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to encrypted PDFs |
| `admin/` | ❌ **NO ACCESS** | ❌ **NO ACCESS** | Cannot access administrative files |
| `public/` | ✅ **ALL FILES** | ❌ **NO ACCESS** | Read-only access to public assets |

**Access Permission Logic:**
- Can read files only if `request.auth.uid` is in the student's `staffIds` array
- Cannot upload or delete any student files

---

### 🟠 **Paraeducators** (`paraeducator`)
**Staff Assignment Based Access**

| File Location | Read Access | Write Access | Notes |
|---------------|-------------|--------------|--------|
| `students/{studentId}/sensitive/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `students/{studentId}/general/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `students/{studentId}/` (fallback) | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to assigned students' files |
| `encrypted-pdfs/{studentId}/` | ✅ **Assigned Students** | ❌ **NO ACCESS** | Read-only access to encrypted PDFs |
| `admin/` | ❌ **NO ACCESS** | ❌ **NO ACCESS** | Cannot access administrative files |
| `public/` | ✅ **ALL FILES** | ❌ **NO ACCESS** | Read-only access to public assets |

**Access Permission Logic:**
- Can read files only if `request.auth.uid` is in the student's `staffIds` array
- Cannot upload or delete any student files

---

## Cross-Service Security Validation

### Firestore Integration
The storage rules perform real-time validation against Firestore documents:

```javascript
// Helper functions that query Firestore
function getStudentDoc(studentId) {
  return firestore.get(/databases/(default)/documents/students/$(studentId));
}
function studentStaffIds(studentId) {
  return getStudentDoc(studentId).data.app.staffIds;
}
function studentPlan(studentId) {
  return getStudentDoc(studentId).data.app.studentData.plan;
}
function studentCaseManagerId(studentId) {
  return getStudentDoc(studentId).data.app.studentData.caseManagerId;
}
```

### Security Checks Performed
1. **Authentication Required**: All file access requires valid Firebase Auth token
2. **Role Verification**: User's role is checked via JWT token claims
3. **Staff Assignment**: User's UID must be in student's `staffIds` array for staff-level access
4. **Plan Type Validation**: 504 coordinators' write access verified against student's plan type
5. **Case Manager Verification**: Case manager write access verified against student's `caseManagerId`

---

## PDF Encryption System

### AES-256 Encryption Implementation
All PDF files are encrypted using AES-256 encryption before storage:

```javascript
// PDF Encryption Process
const encrypted = CryptoJS.AES.encrypt(base64, encryptionKey).toString();
const secureFileName = `${uuidv4()}.enc`;

// PDF Decryption Process
const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(CryptoJS.enc.Utf8);
const pdfContent = atob(decrypted);
```

### Security Features
- **AES-256 Encryption**: Military-grade encryption for all PDF files
- **Unique File Names**: UUID-based naming prevents file enumeration
- **Access Logging**: Every PDF access logged with user details and timestamp
- **Metadata Tracking**: File metadata stored separately in Firestore
- **Client-Side Decryption**: Secure decryption only after access validation

### File Organization Structure

```
📁 Storage Bucket Root
├── 📁 students/
│   └── 📁 {studentId}/
│       ├── 📁 sensitive/          # IEPs, BIPs, At-A-Glance documents
│       │   ├── iep-2024.pdf
│       │   ├── bip-current.pdf
│       │   └── at-a-glance.pdf
│       ├── 📁 general/            # Less sensitive documents
│       │   ├── progress-report.pdf
│       │   └── assessment-results.pdf
│       └── 📄 legacy-files...     # Existing files (fallback rules)
├── 📁 encrypted-pdfs/             # AES-256 encrypted PDF files
│   └── 📁 {studentId}/
│       ├── uuid1.enc
│       ├── uuid2.enc
│       └── uuid3.enc
├── 📁 admin/                      # Super admin only
│   ├── system-reports.pdf
│   └── compliance-docs.pdf
└── 📁 public/                     # Public assets
    ├── templates/
    └── resources/
```

---

## Audit Logging Integration

### PDF Access Logging
Every PDF access is logged with comprehensive details:

```javascript
// PDF Access Log Entry
{
  type: 'pdf_access',
  studentId: 'student123',
  userId: 'user456',
  userEmail: 'teacher@school.edu',
  action: 'download', // 'upload', 'download', 'view'
  fileName: 'iep-2024.pdf',
  secureFileName: 'uuid1.enc',
  timestamp: serverTimestamp(),
  sessionId: 'session_abc123',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
}
```

### Storage Access Monitoring
- **Real-time Logging**: All file access attempts logged immediately
- **User Tracking**: Complete audit trail of who accessed what files when
- **Session Correlation**: File access linked to user sessions
- **IP Address Tracking**: Geographic and network information recorded
- **Access Pattern Analysis**: Suspicious access patterns can be identified

---

## Security Features

### ✅ **FERPA Compliance**
- **Minimum Necessary Access**: Users can only access files for students they work with
- **Role-Based Restrictions**: Different access levels based on job function
- **Audit Trail**: All file access is logged by Firebase with detailed metadata
- **Cross-Service Validation**: Storage permissions validated against current database state
- **PDF Encryption**: All sensitive documents encrypted with AES-256

### ✅ **Data Protection**
- **Authentication Required**: No anonymous file access
- **Real-Time Validation**: Permissions checked against current staff assignments
- **Granular Controls**: Separate read/write permissions
- **Administrative Oversight**: Super admins maintain full access for compliance
- **Encrypted Storage**: All PDFs encrypted before storage

### ✅ **Operational Security**
- **Dynamic Updates**: Permissions automatically update when staff assignments change
- **Plan-Type Enforcement**: 504 coordinators restricted to 504-plan students for write operations
- **Case Manager Validation**: Write access verified against current case manager assignments
- **Session Management**: File access correlated with user sessions
- **Threat Detection**: Suspicious access patterns can be identified and flagged

---

## Deployment Commands

```bash
# Deploy storage rules
firebase deploy --only storage

# Deploy all rules (storage + firestore)
firebase deploy --only storage,firestore

# Test storage rules (if using Firebase emulator)
firebase emulators:start --only storage,firestore
```

---

## Troubleshooting

### Common Permission Issues

1. **"Permission Denied" for Staff Member**
   - Check if user's UID is in student's `staffIds` array
   - Verify user's role in Firebase Auth custom claims
   - Confirm student document exists in Firestore

2. **504 Coordinator Cannot Write to Student File**
   - Verify student's `plan` field is set to '504'
   - Check that user's role is exactly 'administrator_504_CM'

3. **Case Manager Cannot Access Student Files**
   - Confirm user's UID matches student's `caseManagerId`
   - Verify user is also in student's `staffIds` array for read access

4. **PDF Decryption Fails**
   - Verify encryption key is properly configured
   - Check that file was encrypted correctly during upload
   - Confirm user has proper access permissions

### IAM Requirements
- **Cross-Service Rules**: Requires Firebase Storage to have IAM permissions to read Firestore
- **Automatic Grant**: Firebase CLI will prompt to grant required roles during deployment

---

## Implementation Status

### ✅ **Completed Features**
- **Cross-Service Storage Rules**: Implemented with Firestore validation
- **PDF Encryption System**: AES-256 encryption with secure decryption
- **Audit Logging**: Comprehensive access logging for all file operations
- **Role-Based Access**: Granular permissions for all user roles
- **Session Management**: File access correlated with user sessions

### 🔄 **Ongoing Improvements**
- **Performance Optimization**: Continuous monitoring of cross-service rule performance
- **Audit Report Generation**: Enhanced reporting capabilities for compliance
- **Threat Detection**: Advanced pattern recognition for suspicious access

---

**Document Maintained By:** Development Team  
**Security Review:** Monthly  
**Compliance Verification:** Quarterly  
**Next Update:** As needed for role or permission changes 