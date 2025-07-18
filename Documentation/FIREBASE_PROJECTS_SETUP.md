# Firebase Projects Setup Guide

This guide walks you through setting up separate Firebase projects for development and production environments.

## Current State

- **Single Project**: `casemangervue` (used for both dev and production)
- **Mixed Data**: Development and production data in same database
- **Security Risk**: Testing with real user data

## Recommended Setup

### Project Structure
- **Development**: `casemangervue-dev` 
- **Production**: `casemangervue-prod`

## Step 1: Create Firebase Projects

### 1.1 Create Development Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `CaseManageVue Development`
4. Project ID: `casemangervue-dev` (or similar available ID)
5. **Disable Google Analytics** (not needed for development)
6. Click "Create project"

### 1.2 Create Production Project

1. Click "Add project" again
2. Project name: `CaseManageVue Production`
3. Project ID: `casemangervue-prod` (or similar available ID)
4. **Enable Google Analytics** (recommended for production)
5. Click "Create project"

## Step 2: Configure Each Project

### 2.1 Development Project Setup

**Enable Services:**
1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google sign-in
   - Add your development domains (localhost:5173, localhost:5174, etc.)

2. **Firestore Database**:
   - Go to Firestore Database
   - Create database in test mode (for development)
   - Choose a location (us-central1 recommended)

3. **Storage**:
   - Go to Storage
   - Get started with default rules

4. **Functions**:
   - Go to Functions
   - Get started (will be set up via CLI)

**Security Rules (Development - More Permissive):**
```javascript
// Firestore Rules (Development)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users (for development)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2.2 Production Project Setup

**Enable Services:**
1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google sign-in
   - Add your production domain only

2. **Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Choose same location as development

3. **Storage**:
   - Go to Storage
   - Get started with production rules

4. **Functions**:
   - Go to Functions
   - Get started

**Security Rules (Production - Strict):**
```javascript
// Firestore Rules (Production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Use your existing strict security rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /students/{studentId} {
      allow read: if isAuthenticated() && hasValidRole();
      allow write: if isAuthenticated() && (isAdmin() || isCaseManager());
    }
    
    // ... rest of your existing rules
  }
}
```

## Step 3: Get Configuration for Each Project

### 3.1 Development Project Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web app" (</> icon)
4. App nickname: "CaseManageVue Dev"
5. **Don't enable Firebase Hosting** (we'll use Vite dev server)
6. Copy the configuration object

### 3.2 Production Project Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web app" (</> icon)
4. App nickname: "CaseManageVue Prod"
5. **Enable Firebase Hosting** (for production deployment)
6. Copy the configuration object

## Step 4: Update Environment Files

### 4.1 Update .env.development

```env
# Development Environment Configuration
VITE_APP_ENV=development

# Firebase Configuration (Development Project)
VITE_FIREBASE_API_KEY=your_dev_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=casemangervue-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=casemangervue-dev
VITE_FIREBASE_STORAGE_BUCKET=casemangervue-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
VITE_FIREBASE_APP_ID=your_dev_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_dev_measurement_id

# Google API Configuration (Development)
VITE_GOOGLE_CLIENT_ID=your_dev_client_id_here
VITE_GOOGLE_API_KEY=your_dev_api_key_here

# Development Features
VITE_ENABLE_DEBUG_MENU=true
VITE_ENABLE_CONSOLE_LOGS=true
VITE_USE_FIREBASE_EMULATORS=true

# API Configuration
VITE_API_BASE_URL=http://localhost:5002
VITE_FUNCTIONS_EMULATOR_URL=http://localhost:5002
```

### 4.2 Update .env.production

```env
# Production Environment Configuration
VITE_APP_ENV=production

# Firebase Configuration (Production Project)
VITE_FIREBASE_API_KEY=your_prod_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=casemangervue-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=casemangervue-prod
VITE_FIREBASE_STORAGE_BUCKET=casemangervue-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
VITE_FIREBASE_APP_ID=your_prod_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_prod_measurement_id

# Google API Configuration (Production)
VITE_GOOGLE_CLIENT_ID=your_prod_client_id_here
VITE_GOOGLE_API_KEY=your_prod_api_key_here

# Production Features
VITE_ENABLE_DEBUG_MENU=false
VITE_ENABLE_CONSOLE_LOGS=false
VITE_USE_FIREBASE_EMULATORS=false

# API Configuration
VITE_API_BASE_URL=https://us-central1-casemangervue-prod.cloudfunctions.net
VITE_FUNCTIONS_URL=https://us-central1-casemangervue-prod.cloudfunctions.net
```

## Step 5: Update Firebase CLI Configuration

### 5.1 Update .firebaserc

```json
{
  "projects": {
    "development": "casemangervue-dev",
    "production": "casemangervue-prod",
    "default": "casemangervue-dev"
  }
}
```

### 5.2 Update firebase.json (if needed)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ]
    }
  ]
}
```

## Step 6: Deploy to Each Environment

### 6.1 Development Deployment

```bash
# Switch to development project
firebase use development

# Deploy functions only (use local dev server for hosting)
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 6.2 Production Deployment

```bash
# Build production version
npm run build

# Switch to production project
firebase use production

# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting,functions,firestore:rules
```

## Step 7: Google API Configuration

### 7.1 Development API Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your development project
3. Enable APIs: Sheets API, Forms API, Gmail API
4. Create credentials:
   - **API Key**: Restrict to development domains (localhost:*)
   - **OAuth 2.0 Client**: Add localhost origins

### 7.2 Production API Keys

1. Select your production project
2. Enable same APIs
3. Create credentials:
   - **API Key**: Restrict to production domain only
   - **OAuth 2.0 Client**: Add production domain only

## Step 8: Data Migration Strategy

### 8.1 Development Data

**Option A: Fresh Start (Recommended)**
- Start with empty database
- Use seed data from your `seed/` folder
- Import test users and students

**Option B: Copy from Current**
```bash
# Export current data
firebase use casemangervue
firebase firestore:export gs://casemangervue.appspot.com/exports/

# Import to development
firebase use development
firebase firestore:import gs://casemangervue-dev.appspot.com/exports/
```

### 8.2 Production Data

**Option A: Migrate Current Project**
- Rename current project to production
- Update environment variables

**Option B: Clean Migration**
- Export critical data only
- Clean and sanitize before import
- Test thoroughly before switching

## Step 9: Testing & Validation

### 9.1 Development Testing

```bash
# Start development
npm run dev

# Verify:
# - Connects to dev Firebase project
# - Debug menu is visible
# - Console logs are enabled
# - Uses emulators if configured
```

### 9.2 Production Testing

```bash
# Build and preview production
npm run build
npm run preview

# Verify:
# - Connects to prod Firebase project
# - Debug menu is hidden
# - Console logs are disabled
# - Uses production URLs
```

## Step 10: Team Workflow

### Development Workflow
```bash
# Daily development
firebase use development
npm run dev

# Deploy functions for testing
firebase deploy --only functions
```

### Production Workflow
```bash
# Production deployment
firebase use production
npm run build
firebase deploy

# Hotfix deployment
firebase deploy --only functions
```

## Benefits Achieved

✅ **Data Isolation**: Development and production data completely separate
✅ **Security**: No risk of corrupting production data during development
✅ **Performance**: Independent scaling and monitoring
✅ **Testing Freedom**: Safe to experiment with new features
✅ **Proper CI/CD**: Clear deployment pipeline
✅ **Environment Parity**: Consistent configuration across environments

## Troubleshooting

### Common Issues

**Wrong Project Selected:**
```bash
firebase projects:list
firebase use development  # or production
```

**Environment Variables Not Loading:**
- Check `.env.development` and `.env.production` files
- Verify VITE_ prefix on all variables
- Restart dev server after changes

**API Key Restrictions:**
- Ensure development keys allow localhost
- Ensure production keys allow only production domain
- Check Google Cloud Console for API quotas

**Functions Deployment:**
```bash
# Check which project you're deploying to
firebase use

# Deploy to specific project
firebase use development
firebase deploy --only functions
```

This setup provides a robust foundation for managing multiple environments safely and efficiently. 