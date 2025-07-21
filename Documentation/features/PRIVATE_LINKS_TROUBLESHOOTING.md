# Private Links Troubleshooting Guide

## Problem: Firebase Storage Links Are Public Instead of Private

If you've been working on making Firebase Storage links private for 8+ hours, this guide will help you identify and fix the issue.

## 🔍 **Quick Diagnosis**

### **1. Check Your Current Setup**

**Storage Rules** (Check `storage.rules`):
```javascript
// Should have rules like this:
match /encrypted-pdfs/{studentId}/{fileName} {
  allow read: if request.auth != null && (
    // Your access control logic
  );
  allow write: if request.auth != null && (
    // Your write permissions
  );
}
```

**Cloud Function** (Check `functions/index.js`):
```javascript
// Should generate signed URLs like this:
const [signedUrl] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 5 * 60 * 1000,  // 5 minutes
  version: 'v4'  // Important for security
});
```

### **2. Test Your Current Setup**

Use the **Secure PDF Test** component in `/testing` to verify:

1. **System Status**: Check if encryption key is configured
2. **Cloud Function Test**: Test if `getStudentFileUrl` function works
3. **Direct Upload Test**: Verify storage permissions
4. **Find Existing Student**: Get a real student ID to test with

## 🚨 **Common Issues & Solutions**

### **Issue 1: Cloud Function Not Finding Files**

**Symptoms:**
- "File not found" errors
- Cloud function returns 404

**Solution:**
```javascript
// Check both file paths in your cloud function:
let filePath = `encrypted-pdfs/${studentId}/${fileName}`;
let file = bucket.file(filePath);
let [exists] = await file.exists();

// If not found, check students path (backward compatibility)
if (!exists) {
  filePath = `students/${studentId}/${fileName}`;
  file = bucket.file(filePath);
  [exists] = await file.exists();
}
```

### **Issue 2: URLs Still Have Download Tokens**

**Symptoms:**
- URLs contain `token=` parameter
- Links work without authentication

**Solution:**
```javascript
// Make sure you're using signed URLs, not download URLs
const [signedUrl] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 5 * 60 * 1000,
  version: 'v4'  // Use v4 for better security
});

// NOT this (creates public download tokens):
// const downloadUrl = await file.getDownloadURL();
```

### **Issue 3: Storage Rules Too Permissive**

**Symptoms:**
- Files accessible without authentication
- Direct Firebase Storage URLs work

**Solution:**
```javascript
// Update storage.rules to deny direct access:
match /encrypted-pdfs/{studentId}/{fileName} {
  allow read, write: if false; // Only accessible via Cloud Functions
}

match /students/{studentId}/{fileName} {
  allow read, write: if false; // Only accessible via Cloud Functions
}
```

### **Issue 4: Cloud Function Not Deployed**

**Symptoms:**
- "Function not found" errors
- Cloud function calls fail

**Solution:**
```bash
# Deploy cloud functions
firebase deploy --only functions

# Check deployment status
firebase functions:list
```

### **Issue 5: Authentication Issues**

**Symptoms:**
- "Permission denied" errors
- User role not recognized

**Solution:**
```javascript
// Check user authentication in cloud function:
console.log('User:', request.auth.uid);
console.log('Role:', request.auth.token.role);

// Verify user has proper role and access
const hasAccess = (
  userRole === 'admin' || 
  userRole === 'sped_chair' ||
  staffIds.includes(userId)
);
```

## 🔧 **Step-by-Step Fix**

### **Step 1: Verify Storage Rules**
```bash
# Deploy updated storage rules
firebase deploy --only storage
```

### **Step 2: Update Cloud Function**
```javascript
// In functions/index.js, ensure getStudentFileUrl function:
// 1. Checks both file paths
// 2. Uses v4 signed URLs
// 3. Has proper access control
```

### **Step 3: Deploy Cloud Functions**
```bash
firebase deploy --only functions
```

### **Step 4: Test the System**
1. Go to `/testing` in your app
2. Use "Find Existing Student" to get a real student ID
3. Click "Test Cloud Function" 
4. Check console for detailed logs

### **Step 5: Verify Private URLs**
```javascript
// A private URL should look like:
// https://storage.googleapis.com/bucket/o/path%2Ffile.pdf?X-Goog-Algorithm=...&X-Goog-Credential=...&X-Goog-Date=...&X-Goog-Expires=300&X-Goog-SignedHeaders=host&X-Goog-Signature=...

// NOT like this (public with token):
// https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Ffile.pdf?alt=media&token=abc123
```

## 🧪 **Testing Checklist**

### **✅ Storage Rules**
- [ ] Direct access to files is denied
- [ ] Only Cloud Functions can access files
- [ ] Rules deployed successfully

### **✅ Cloud Function**
- [ ] Function deployed successfully
- [ ] Function finds files in correct paths
- [ ] Function generates v4 signed URLs
- [ ] Function enforces access control

### **✅ Client Code**
- [ ] Uses Cloud Function to get URLs
- [ ] Doesn't use `getDownloadURL()` directly
- [ ] Handles authentication properly

### **✅ URLs Generated**
- [ ] No `token=` parameter
- [ ] Contains `X-Goog-` parameters
- [ ] Expires after 5 minutes
- [ ] Requires authentication

## 🐛 **Debug Commands**

### **Check Cloud Function Logs**
```bash
firebase functions:log --only getStudentFileUrl
```

### **Test Cloud Function Directly**
```bash
# In Firebase Console > Functions > getStudentFileUrl
# Test with sample data:
{
  "studentId": "test-student-123",
  "fileName": "test.pdf"
}
```

### **Check Storage Rules**
```bash
# In Firebase Console > Storage > Rules
# Test rules with sample request
```

## 🎯 **Success Indicators**

When your private links are working correctly:

1. **URLs are time-limited** (expire in 5 minutes)
2. **URLs require authentication** (no public access)
3. **No download tokens** in URLs
4. **Access is logged** for audit purposes
5. **Files are encrypted** in storage

## 🆘 **Still Having Issues?**

If you're still struggling after following this guide:

1. **Check the console logs** in your browser
2. **Test the cloud function directly** in Firebase Console
3. **Verify your user role** and permissions
4. **Check if files exist** in the expected storage paths
5. **Ensure all deployments** completed successfully

The most common issue is **mismatched file paths** between where files are stored and where the cloud function looks for them. The updated cloud function should handle both `encrypted-pdfs/` and `students/` paths automatically. 