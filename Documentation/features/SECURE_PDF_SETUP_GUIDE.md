# Secure PDF System Setup Guide

## Overview

The CaseManageVue application includes a comprehensive secure PDF system that encrypts PDF files before storing them in Firebase Storage and provides secure, authenticated access to these files. This system ensures FERPA compliance and protects sensitive student documents.

## Features

- **Client-side encryption** using AES encryption
- **Secure storage** in Firebase Storage with encrypted content
- **Access control** based on user roles and student relationships
- **Audit logging** of all file access attempts
- **Time-limited access** via signed URLs
- **Automatic cleanup** of old files and metadata

## Architecture

### Components

1. **`SecurePdfHandler`** (`src/utils/pdfSecurity.js`)
   - Core encryption/decryption logic
   - File upload and download operations
   - Access verification

2. **`usePdfHandler`** (`src/composables/usePdfHandler.js`)
   - Vue composable for PDF operations
   - Loading states and error handling
   - User-friendly interface

3. **`StudentDocuments.vue`** (`src/components/students/form/StudentDocuments.vue`)
   - UI component for PDF upload/download
   - Integration with student forms

4. **Cloud Functions** (`functions/index.js`)
   - `getStudentFileUrl` - Generates secure signed URLs
   - `downloadStudentFile` - Secure file proxy

## Setup Instructions

### 1. Environment Configuration

Create or update your environment files:

#### `.env.development`
```bash
# PDF Encryption Key (generate a strong key for production)
VITE_PDF_ENCRYPTION_KEY=your-secure-pdf-encryption-key-2024

# Enable PDF encryption
VITE_ENABLE_ENCRYPTION=true
```

#### `.env.production`
```bash
# Use a strong, randomly generated key in production
VITE_PDF_ENCRYPTION_KEY=your-production-encryption-key-here

# Enable PDF encryption
VITE_ENABLE_ENCRYPTION=true
```

### 2. Generate Encryption Key

For production, generate a strong encryption key:

```bash
# Generate a 32-byte (256-bit) key
openssl rand -base64 32
```

### 3. Firebase Storage Rules

Ensure your Firebase Storage rules allow the secure PDF system:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow access to encrypted PDFs only through Cloud Functions
    match /encrypted-pdfs/{studentId}/{fileName} {
      allow read, write: if false; // Only accessible via Cloud Functions
    }
    
    // Allow access to student files only through Cloud Functions
    match /students/{studentId}/{fileName} {
      allow read, write: if false; // Only accessible via Cloud Functions
    }
  }
}
```

### 4. Firestore Collections

The system uses these Firestore collections:

- **`pdfMetadata`** - Stores file metadata and access information
- **`pdfAccessLogs`** - Audit trail of file access

## Usage

### Uploading PDFs

```javascript
import usePdfHandler from '@/composables/usePdfHandler'

const { uploadPdf, isUploading, error } = usePdfHandler()

const handleFileUpload = async (file, studentId) => {
  try {
    const secureFileName = await uploadPdf(file, studentId)
    console.log('PDF uploaded securely:', secureFileName)
  } catch (error) {
    console.error('Upload failed:', error.message)
  }
}
```

### Downloading PDFs

```javascript
const { downloadPdf, isDownloading } = usePdfHandler()

const handleFileDownload = async (secureFileName, studentId, originalFileName) => {
  try {
    await downloadPdf(secureFileName, studentId, originalFileName)
    console.log('PDF downloaded successfully')
  } catch (error) {
    console.error('Download failed:', error.message)
  }
}
```

### In Student Forms

The `StudentDocuments.vue` component automatically handles secure PDF operations:

1. **Upload**: Select a PDF file → automatically encrypted and uploaded
2. **View**: Click "View" link → secure download with authentication
3. **Remove**: Click "Remove" → file deleted from secure storage

## Security Features

### Access Control

The system enforces role-based access:

- **Admins/SPED Chairs**: Access all files
- **Case Managers**: Access only their assigned students' files
- **Teachers**: Access only files for students in their classes
- **Service Providers**: Access only files for students they serve

### Encryption

- **AES-256 encryption** for all PDF content
- **Client-side encryption** before upload
- **Secure key management** via environment variables
- **No plaintext storage** of sensitive documents

### Audit Logging

All file access is logged with:
- User ID and email
- File ID and student ID
- Access timestamp
- User agent information
- Access type (download, view, etc.)

## Testing

### Test Component

Use the `SecurePdfTest` component in the Testing view:

1. Navigate to `/testing`
2. Scroll to "🔒 Secure PDF System Test"
3. Upload a test PDF
4. Download the PDF to verify functionality

### Manual Testing

```javascript
// Test encryption key
console.log('Encryption key configured:', !!import.meta.env.VITE_PDF_ENCRYPTION_KEY)

// Test upload
const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
const secureFileName = await uploadPdf(testFile, 'test-student-123')

// Test download
await downloadPdf(secureFileName, 'test-student-123', 'test.pdf')
```

## Troubleshooting

### Common Issues

1. **"Encryption key not configured"**
   - Check environment variables
   - Ensure `VITE_PDF_ENCRYPTION_KEY` is set

2. **"Access denied"**
   - Verify user has proper role
   - Check student assignment
   - Review Firebase Security Rules

3. **"File not found"**
   - Check if file was uploaded successfully
   - Verify student ID matches
   - Check Firestore metadata

4. **"Upload failed"**
   - Check file size (10MB limit)
   - Verify file type (PDF only)
   - Check Firebase Storage permissions

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug-pdf', 'true')

// Check logs for detailed error information
```

## Production Deployment

### Security Checklist

- [ ] Strong encryption key generated
- [ ] Environment variables configured
- [ ] Firebase Security Rules updated
- [ ] Cloud Functions deployed
- [ ] Access logging enabled
- [ ] Regular key rotation planned

### Monitoring

Monitor these metrics:
- File upload/download success rates
- Access log entries
- Storage usage
- Cloud Function performance

## API Reference

### SecurePdfHandler Methods

- `encryptAndUploadPdf(file, studentId)` - Upload and encrypt PDF
- `downloadAndDecryptPdf(secureFileName, studentId)` - Download and decrypt PDF
- `verifyAccess(studentId)` - Check user access permissions
- `logAccess(fileId, studentId)` - Log file access
- `getFileAccessHistory(fileId)` - Get access history

### usePdfHandler Composable

- `uploadPdf(file, studentId)` - Upload PDF
- `downloadPdf(secureFileName, studentId, originalFileName)` - Download PDF
- `getAccessHistory(fileId)` - Get access history
- `isUploading` - Upload loading state
- `isDownloading` - Download loading state
- `error` - Error state

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase console logs
3. Test with the SecurePdfTest component
4. Check environment configuration 