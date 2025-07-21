# Deployment Guide - IEP Data Security

## Encryption Key Setup

### 1. Generate Secure Keys
For each environment (development, staging, production), generate a unique 256-bit encryption key:

```bash
# Run this command for each environment
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Environment Setup

#### Development
Create `.env.development`:
```
VUE_APP_PDF_ENCRYPTION_KEY="your-dev-key-here"
```

#### Production
Create `.env.production`:
```
VUE_APP_PDF_ENCRYPTION_KEY="your-production-key-here"
```

IMPORTANT: Never commit these files to git. They should be in .gitignore.

### 3. Firebase Configuration

Set up environment variables in Firebase:

```bash
# Development
firebase functions:config:set encryption.key="your-dev-key-here" --project your-dev-project

# Production
firebase functions:config:set encryption.key="your-production-key-here" --project your-prod-project
```

## Security System Overview

The IEP data security system provides:

### 1. Field-Level Encryption
- Encrypts sensitive IEP data fields like:
  - Accommodations (assessment & instruction)
  - Class services
  - Plan details
- Uses AES-256 encryption
- Encryption/decryption happens client-side

### 2. Access Control
- Role-based permissions:
  - Admins: Full access
  - Case Managers: Access to assigned students
  - Teachers: Read-only access to their students
- Granular student-level permissions
- Automatic data masking for unauthorized users

### 3. Audit Logging
- Tracks all access to IEP data
- Logs include:
  - Who accessed the data
  - When it was accessed
  - What fields were viewed/modified
  - Access success/failure

### 4. Data Protection
- Sensitive data never stored in plain text
- Encrypted in transit and at rest
- Automatic masking of sensitive fields
- Protection against unauthorized access

## Deployment Checklist

Before deploying to production:

1. [ ] Generate new encryption keys
2. [ ] Set up environment variables
3. [ ] Update Firebase security rules
4. [ ] Test encryption with sample data
5. [ ] Verify audit logging
6. [ ] Check access controls
7. [ ] Test data masking

## Security Best Practices

1. Key Management:
   - Rotate encryption keys periodically
   - Store keys securely
   - Use different keys for each environment

2. Access Control:
   - Regularly audit user roles
   - Remove unused accounts
   - Review access logs

3. Monitoring:
   - Set up alerts for suspicious activity
   - Monitor failed access attempts
   - Review audit logs regularly

## Troubleshooting

### Common Issues

1. Encryption Errors:
   ```
   Error: Failed to decrypt field
   ```
   - Check encryption key is set correctly
   - Verify data format

2. Access Denied:
   ```
   Error: You do not have permission to access this data
   ```
   - Verify user role
   - Check student assignment
   - Review access logs

### Emergency Procedures

If you suspect a security breach:

1. Rotate encryption keys immediately
2. Review access logs
3. Notify appropriate authorities
4. Document the incident

## Maintenance

Regular security maintenance tasks:

1. Monthly:
   - Review access logs
   - Check for unauthorized access attempts
   - Update user roles as needed

2. Quarterly:
   - Rotate encryption keys
   - Audit user permissions
   - Review security rules

3. Annually:
   - Full security audit
   - Update security documentation
   - Review compliance requirements 