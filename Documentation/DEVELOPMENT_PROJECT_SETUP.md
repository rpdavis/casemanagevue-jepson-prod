# Development Project Setup Guide

## 🎯 **Current Status**
You've created the `casemanagevue-dev` project and set up Firestore. Now we need to complete the setup to connect your development environment.

## ✅ **Completed Steps**
1. ✅ Created Firebase project: `casemanagevue-dev`
2. ✅ Set up Firestore database
3. ✅ Deployed Firestore security rules
4. ✅ Created web app configuration

## 🚧 **Next Steps Required**

### **1. Firebase Functions Setup (In Progress)**
The Functions deployment was interrupted because it's the first time using 2nd gen functions. This is normal.

**Wait 5-10 minutes, then retry:**
```bash
firebase use development
firebase deploy --only functions
```

**What's happening:**
- Firebase is setting up service accounts and permissions
- Multiple APIs are being enabled automatically
- This only happens once per project

### **2. Required Services to Enable**
Go to [Firebase Console - casemanagevue-dev](https://console.firebase.google.com/project/casemanagevue-dev) and ensure these are enabled:

#### **Authentication**
- Go to Authentication → Sign-in method
- Enable Google sign-in provider
- Add your domain to authorized domains

#### **Storage**
- Go to Storage → Get started
- Set up in production mode
- Use default rules for now

#### **Functions (Auto-enabled)**
- Already being set up by the deployment

### **3. Environment Variables (If Needed)**
If using environment variables in functions:
```bash
firebase functions:config:set somekey="somevalue"
```

## 🔧 **Development Environment Connection**

### **Current Configuration**
Your `src/firebase.js` is already configured to automatically connect to:
- **Development ports (5173-5179)**: `casemanagevue-dev` project
- **Production port (4173)**: `casemangervue` project

### **Testing the Connection**
1. **Start development server:**
   ```bash
   firebase use development
   npm run dev
   ```

2. **Check browser console for:**
   ```
   🔥 Firebase Environment: DEVELOPMENT
   🔥 Firebase Project: casemanagevue-dev
   ```

3. **Verify services work:**
   - Authentication (Google sign-in)
   - Firestore (data read/write)
   - Functions (when deployment completes)

## 🔍 **Troubleshooting**

### **Functions Deployment Issues**
If functions deployment fails:

1. **Wait 10 minutes** for permissions to propagate
2. **Retry deployment:**
   ```bash
   firebase deploy --only functions
   ```
3. **Check Firebase Console** for any missing APIs

### **Authentication Issues**
If Google sign-in doesn't work:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add your localhost domains to authorized domains

### **Firestore Permission Issues**
If you get permission errors:
1. Check Firestore security rules are deployed
2. Ensure user is authenticated
3. Verify rules allow the operation

## 📋 **Verification Checklist**

### **Development Environment Working When:**
- [ ] Browser console shows: `🔥 Firebase Project: casemanagevue-dev`
- [ ] Google authentication works
- [ ] Can read/write to Firestore
- [ ] Functions are accessible (after deployment)
- [ ] No "Missing or insufficient permissions" errors

### **Services Status:**
- [ ] Firestore: ✅ Set up and rules deployed
- [ ] Authentication: ⏳ Needs Google provider enabled
- [ ] Storage: ⏳ Needs setup
- [ ] Functions: ⏳ Deployment in progress
- [ ] Web App: ✅ Created and configured

## 🚀 **Quick Setup Commands**

```bash
# Switch to development
firebase use development

# Deploy everything (after functions are ready)
firebase deploy

# Start development server
npm run dev

# Access at: http://localhost:5173-5179
```

## 🔗 **Useful Links**
- [Development Project Console](https://console.firebase.google.com/project/casemanagevue-dev/overview)
- [Authentication Setup](https://console.firebase.google.com/project/casemanagevue-dev/authentication/users)
- [Firestore Database](https://console.firebase.google.com/project/casemanagevue-dev/firestore/data)
- [Functions Console](https://console.firebase.google.com/project/casemanagevue-dev/functions/list)

## 💡 **Next Action**
**Wait 5-10 minutes, then run:**
```bash
firebase deploy --only functions
```

The development environment will be fully functional once Functions deployment completes! 