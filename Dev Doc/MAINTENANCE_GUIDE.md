# Maintenance Guide

## 🔧 Regular Maintenance Tasks

### Daily Tasks (Automated)
- [ ] **Database Backups**: Automated Firestore exports
- [ ] **Function Monitoring**: Check cloud function logs
- [ ] **Error Monitoring**: Review application errors
- [ ] **Performance Metrics**: Monitor response times

### Weekly Tasks
- [ ] **User Account Review**: Check for inactive accounts
- [ ] **Storage Cleanup**: Remove orphaned files
- [ ] **Audit Log Review**: Check for suspicious activity
- [ ] **Performance Analysis**: Review slow queries

### Monthly Tasks
- [ ] **Security Review**: Check access permissions
- [ ] **Data Retention**: Archive old records
- [ ] **Dependency Updates**: Update npm packages
- [ ] **Backup Verification**: Test restore procedures

---

## 🗄️ Database Maintenance

### Firestore Collections

#### Students Collection
```javascript
// Clean up test students
db.collection('students')
  .where('firstName', '==', 'Test')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => doc.ref.delete())
  })
```

#### Users Collection
```javascript
// Find inactive users (no login in 90 days)
const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - 90)

db.collection('users')
  .where('lastLogin', '<', cutoffDate)
  .get()
```

#### Audit Logs
```javascript
// Archive logs older than 1 year
const archiveDate = new Date()
archiveDate.setFullYear(archiveDate.getFullYear() - 1)

db.collection('auditLogs')
  .where('timestamp', '<', archiveDate)
  .limit(500)
  .get()
```

### Index Maintenance
```bash
# Deploy new indexes
firebase deploy --only firestore:indexes

# Check index status
firebase firestore:indexes
```

---

## 👥 User Management

### Role Synchronization
```javascript
// Sync user roles with Firebase Auth custom claims
const syncUserRoles = async () => {
  const users = await db.collection('users').get()
  
  for (const userDoc of users.docs) {
    const userData = userDoc.data()
    await admin.auth().setCustomUserClaims(userDoc.id, {
      role: userData.role,
      email: userData.email
    })
  }
}
```

### Inactive Account Management
```javascript
// Disable accounts inactive for 6 months
const disableInactiveUsers = async () => {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const inactiveUsers = await db.collection('users')
    .where('lastLogin', '<', sixMonthsAgo)
    .where('status', '==', 'active')
    .get()
    
  for (const doc of inactiveUsers.docs) {
    await doc.ref.update({ status: 'inactive' })
    await admin.auth().updateUser(doc.id, { disabled: true })
  }
}
```

---

## 📁 File Storage Management

### Storage Cleanup
```javascript
// Remove orphaned files
const cleanupOrphanedFiles = async () => {
  const bucket = admin.storage().bucket()
  const [files] = await bucket.getFiles({ prefix: 'student-documents/' })
  
  for (const file of files) {
    const studentId = file.name.split('/')[1]
    const studentDoc = await db.collection('students').doc(studentId).get()
    
    if (!studentDoc.exists) {
      await file.delete()
      console.log(`Deleted orphaned file: ${file.name}`)
    }
  }
}
```

### Storage Usage Monitoring
```bash
# Check storage usage
gsutil du -sh gs://casemangervue.firebasestorage.app

# List largest files
gsutil ls -lh gs://casemangervue.firebasestorage.app/** | sort -k1 -hr | head -20
```

---

## 🔍 Performance Monitoring

### Query Performance
```javascript
// Monitor slow queries
const monitorQueries = () => {
  const startTime = Date.now()
  
  return db.collection('students')
    .where('active', '==', true)
    .get()
    .then(snapshot => {
      const duration = Date.now() - startTime
      if (duration > 5000) {
        console.warn(`Slow query detected: ${duration}ms`)
      }
      return snapshot
    })
}
```

### Function Performance
```bash
# Monitor function execution times
firebase functions:log --filter="execution took"

# Check function errors
firebase functions:log --filter="ERROR"
```

---

## 🛡️ Security Maintenance

### Security Rules Audit
```bash
# Test security rules
firebase emulators:start --only firestore
npm run test:security-rules
```

### Access Review
```javascript
// Audit admin access
const auditAdminAccess = async () => {
  const admins = await db.collection('users')
    .where('role', 'in', ['admin', 'school_admin'])
    .get()
    
  admins.forEach(doc => {
    const user = doc.data()
    console.log(`Admin: ${user.email} - Last Login: ${user.lastLogin}`)
  })
}
```

### Encryption Key Rotation
```javascript
// Update encryption keys (quarterly)
const rotateEncryptionKeys = async () => {
  // Generate new encryption key
  const newKey = crypto.randomBytes(32).toString('hex')
  
  // Update key in secure storage
  await db.collection('systemConfig').doc('encryption').update({
    currentKey: newKey,
    previousKey: process.env.CURRENT_ENCRYPTION_KEY,
    rotatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
}
```

---

## 📊 Backup & Recovery

### Automated Backups
```bash
# Schedule daily backups (cron job)
0 2 * * * gcloud firestore export gs://casemangervue-backups/$(date +\%Y-\%m-\%d)
```

### Backup Verification
```javascript
// Verify backup integrity
const verifyBackup = async (backupPath) => {
  const backup = await admin.firestore().restore({
    source: backupPath,
    targetDatabase: 'test-restore'
  })
  
  // Verify critical collections exist
  const collections = ['users', 'students', 'auditLogs']
  for (const collection of collections) {
    const docs = await admin.firestore().collection(collection).limit(1).get()
    if (docs.empty) {
      throw new Error(`Backup verification failed: ${collection} is empty`)
    }
  }
}
```

### Recovery Procedures
```bash
# Restore from backup (EMERGENCY USE ONLY)
gcloud firestore import gs://casemangervue-backups/2025-01-15

# Partial restore (specific collection)
gcloud firestore import gs://casemangervue-backups/2025-01-15 --collection-ids=students
```

---

## 🔄 Update Procedures

### Dependency Updates
```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update major versions (carefully)
npm install package@latest
```

### Firebase SDK Updates
```bash
# Update Firebase SDK
npm install firebase@latest

# Update Firebase Admin SDK
npm install firebase-admin@latest

# Update Firebase CLI
npm install -g firebase-tools@latest
```

### Security Patches
```bash
# Check for security vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Manual review for high-severity issues
npm audit fix --force
```

---

## 📈 Monitoring & Alerts

### Key Metrics to Monitor
- **Response Times**: < 2 seconds for page loads
- **Error Rates**: < 1% of requests
- **Database Reads**: Monitor for quota limits
- **Storage Usage**: Track file uploads
- **Function Invocations**: Monitor for spikes

### Alert Thresholds
```javascript
// Set up monitoring alerts
const monitoringConfig = {
  responseTime: { threshold: 5000, alert: 'email' },
  errorRate: { threshold: 0.05, alert: 'sms' },
  databaseReads: { threshold: 50000, alert: 'email' },
  storageUsage: { threshold: 0.8, alert: 'email' }
}
```

---

## 🆘 Troubleshooting Common Issues

### Authentication Issues
```javascript
// Fix user authentication problems
const fixUserAuth = async (userId) => {
  const userDoc = await db.collection('users').doc(userId).get()
  const userData = userDoc.data()
  
  // Refresh custom claims
  await admin.auth().setCustomUserClaims(userId, {
    role: userData.role,
    email: userData.email
  })
  
  // Force token refresh on client side
  console.log('User should refresh page to get new token')
}
```

### Permission Errors
```javascript
// Debug permission issues
const debugPermissions = async (userId, studentId) => {
  const user = await db.collection('users').doc(userId).get()
  const student = await db.collection('students').doc(studentId).get()
  
  console.log('User role:', user.data().role)
  console.log('Student staffIds:', student.data().app?.staffIds)
  console.log('User in staffIds:', student.data().app?.staffIds?.includes(userId))
}
```

### Performance Issues
```bash
# Identify slow queries
firebase firestore:query --explain students --where active==true

# Check index usage
firebase firestore:indexes
```

---

## 📋 Maintenance Checklist Template

```markdown
## Monthly Maintenance - [Date]

### Database
- [ ] Backup verification completed
- [ ] Audit logs archived (>90 days)
- [ ] Inactive users reviewed
- [ ] Index performance checked

### Security
- [ ] Access permissions reviewed
- [ ] Security rules tested
- [ ] Encryption keys rotated (quarterly)
- [ ] Vulnerability scan completed

### Performance
- [ ] Slow queries identified and optimized
- [ ] Storage usage reviewed
- [ ] Function performance monitored
- [ ] Error rates within acceptable limits

### Updates
- [ ] Dependencies updated
- [ ] Security patches applied
- [ ] Firebase SDK updated
- [ ] Documentation updated

### Issues Found
- [ ] None / [List issues and resolutions]

**Completed by**: [Name]
**Next maintenance**: [Date]
```

---

*Last Updated: January 2025*
*For emergency issues, contact system administrator immediately*