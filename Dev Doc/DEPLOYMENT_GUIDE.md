# Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Firebase CLI installed and authenticated
- Node.js 18+ installed
- Access to Firebase project console
- Production environment configured

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables updated
- [ ] Firebase rules tested
- [ ] Database migrations completed
- [ ] Backup created

---

## 📋 Deployment Steps

### 1. Environment Preparation
```bash
# Switch to production project
firebase use production

# Verify current project
firebase projects:list
```

### 2. Build Application
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 3. Deploy Functions First
```bash
# Deploy only cloud functions
npm run deploy:functions:prod

# Verify functions are working
firebase functions:log --limit 10
```

### 4. Deploy Hosting
```bash
# Deploy hosting (includes Firestore rules and indexes)
npm run deploy:hosting:prod

# Full deployment (functions + hosting + rules)
npm run deploy:prod
```

### 5. Post-Deployment Verification
```bash
# Check deployment status
firebase deploy:status

# Test critical endpoints
curl -I https://casemangervue.web.app

# Monitor for errors
firebase functions:log --follow
```

---

## 🔧 Configuration Management

### Environment Variables
Production environment uses:
```env
VITE_FIREBASE_API_KEY=AIzaSyDx1jbQT-FzgzjASFqVA2kbAHWJ_TeUzdY
VITE_FIREBASE_AUTH_DOMAIN=casemangervue.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=casemangervue
VITE_FIREBASE_STORAGE_BUCKET=casemangervue.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=756483333257
VITE_FIREBASE_APP_ID=1:756483333257:web:694e2ad2415b7886563a58
VITE_FIREBASE_MEASUREMENT_ID=G-YBRDQX9NFR
```

### Firebase Projects
- **Development**: `casemanagevue-dev`
- **Production**: `casemangervue`

---

## 🛡️ Security Considerations

### Pre-Deployment Security Check
1. **Firestore Rules**: Ensure rules are restrictive
2. **Storage Rules**: Verify file access permissions
3. **Function Auth**: Check authentication requirements
4. **API Keys**: Verify domain restrictions

### Security Rules Deployment
```bash
# Deploy only security rules (test first)
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 📊 Monitoring & Rollback

### Post-Deployment Monitoring
- **Firebase Console**: Monitor usage and errors
- **Google Analytics**: Track user behavior
- **Function Logs**: Check for runtime errors
- **Performance**: Monitor load times

### Rollback Procedure
```bash
# List previous releases
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:releases:rollback <release-id>

# Rollback functions (redeploy previous version)
git checkout <previous-commit>
npm run deploy:functions:prod
```

---

## 🔄 Database Migrations

### Running Migrations
```bash
# Execute migration scripts
node scripts/migrate_data.js --production

# Verify migration results
firebase firestore:query students --limit 5
```

### Migration Safety
- Always backup before migrations
- Test migrations in development first
- Run migrations during low-usage periods
- Monitor for data integrity issues

---

## 📈 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for unused dependencies
npx depcheck
```

### Firebase Optimization
- **Firestore Indexes**: Ensure optimal query performance
- **Storage Rules**: Minimize unnecessary reads
- **Function Cold Starts**: Keep functions warm if needed

---

## 🚨 Emergency Procedures

### Critical Issue Response
1. **Immediate Rollback**: Use Firebase console or CLI
2. **Disable Features**: Use feature flags if available
3. **Scale Down**: Reduce resource usage if needed
4. **Communication**: Notify stakeholders

### Maintenance Mode
```html
<!-- Add to index.html for maintenance -->
<div id="maintenance-banner" style="background: red; color: white; text-align: center; padding: 10px;">
  System under maintenance. Please check back later.
</div>
```

---

## 📝 Deployment Log Template

```markdown
## Deployment - [Date]

**Version**: 1.1.6
**Deployed by**: [Name]
**Environment**: Production

### Changes
- [ ] Feature updates
- [ ] Bug fixes
- [ ] Security patches
- [ ] Database changes

### Verification
- [ ] Homepage loads
- [ ] User authentication works
- [ ] Student data accessible
- [ ] Admin functions working
- [ ] No console errors

### Issues
- None / [List any issues]

### Rollback Plan
- Previous version: [commit hash]
- Rollback command: `firebase hosting:releases:rollback [id]`
```

---

## 🔗 Useful Commands

```bash
# Quick deployment status
firebase deploy:status

# View recent deployments
firebase hosting:releases:list --limit 5

# Check current project
firebase use

# View logs in real-time
firebase functions:log --follow

# Test locally before deploy
npm run preview
```

---

*Last Updated: January 2025*
*Deployment URL: https://casemangervue.web.app*