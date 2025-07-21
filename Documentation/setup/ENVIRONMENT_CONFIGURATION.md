# Environment Configuration Guide

This guide explains how to set up proper environment configurations for development and production environments in the CaseManageVue application.

## Current State

The application currently uses:
- **Single Firebase Project**: `casemangervue` for both dev and production
- **Hardcoded Configuration**: Firebase config and API keys are hardcoded in `src/firebase.js`
- **Limited Environment Logic**: Only debug menu uses environment detection

## Recommended Environment Setup

### 1. Environment Files

Create these files in your project root:

#### `.env.development`
```env
# Development Environment Configuration
VITE_APP_ENV=development

# Firebase Configuration (Development)
VITE_FIREBASE_API_KEY=AIzaSyDx1jbQT-FzgzjASFqVA2kbAHWJ_TeUzdY
VITE_FIREBASE_AUTH_DOMAIN=casemangervue.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=casemangervue
VITE_FIREBASE_STORAGE_BUCKET=casemangervue.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=756483333257
VITE_FIREBASE_APP_ID=1:756483333257:web:694e2ad2415b7886563a58
VITE_FIREBASE_MEASUREMENT_ID=G-YBRDQX9NFR

# Google API Configuration (Development)
VITE_GOOGLE_CLIENT_ID=756483333257-kh1cv865e0buv0cv9g0v1h7ghq7s0e70.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyDx1jbQT-FzgzjASFqVA2kbAHWJ_TeUzdY

# Development Features
VITE_ENABLE_DEBUG_MENU=true
VITE_ENABLE_CONSOLE_LOGS=true
VITE_USE_FIREBASE_EMULATORS=true

# API Configuration
VITE_API_BASE_URL=http://localhost:5002
VITE_FUNCTIONS_EMULATOR_URL=http://localhost:5002
```

#### `.env.production`
```env
# Production Environment Configuration
VITE_APP_ENV=production

# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=your_production_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-production-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-production-project
VITE_FIREBASE_STORAGE_BUCKET=your-production-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_production_measurement_id

# Google API Configuration (Production)
VITE_GOOGLE_CLIENT_ID=your_production_client_id_here
VITE_GOOGLE_API_KEY=your_production_api_key_here

# Production Features
VITE_ENABLE_DEBUG_MENU=false
VITE_ENABLE_CONSOLE_LOGS=false
VITE_USE_FIREBASE_EMULATORS=false

# API Configuration
VITE_API_BASE_URL=https://us-central1-your-production-project.cloudfunctions.net
VITE_FUNCTIONS_URL=https://us-central1-your-production-project.cloudfunctions.net
```

### 2. Update Firebase Configuration

Update `src/firebase.js` to use environment variables:

```javascript
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Environment-based configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  // Only connect if not already connected
  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  if (!storage._delegate._host.includes('localhost')) {
    connectStorageEmulator(storage, 'localhost', 9199);
  }
  if (!functions._delegate._url.includes('localhost')) {
    connectFunctionsEmulator(functions, 'localhost', 5002);
  }
}

// Configure Google OAuth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');

export { app, auth, db, storage, functions, googleProvider };
```

### 3. Update Google Sheets Client

Update `src/composables/useGoogleSheetsClient.js`:

```javascript
// Use environment variables for Google API configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
```

### 4. Environment-Aware Utilities

Create `src/utils/environment.js`:

```javascript
export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development'
}

export const isProduction = () => {
  return import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production'
}

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'https://us-central1-casemangervue.cloudfunctions.net'
}

export const shouldEnableDebugMenu = () => {
  return import.meta.env.VITE_ENABLE_DEBUG_MENU === 'true' && isDevelopment()
}

export const shouldEnableConsoleLogs = () => {
  return import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true'
}

// Enhanced console logging
export const devLog = (...args) => {
  if (shouldEnableConsoleLogs()) {
    console.log(...args)
  }
}

export const devError = (...args) => {
  if (shouldEnableConsoleLogs()) {
    console.error(...args)
  }
}
```

### 5. Update Package.json Scripts

Add environment-specific build scripts:

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "serve": "vite preview"
  }
}
```

## Security Considerations

### 1. Environment Variables Security

**Safe for Frontend (VITE_ prefix):**
- API keys for client-side services (Google Sheets, Firebase)
- Public configuration values
- Feature flags

**NOT Safe for Frontend:**
- Database passwords
- Private API keys
- Server-side secrets

### 2. Firebase Security

**Development:**
- Use Firebase emulators for local development
- Separate Firebase project for development
- Relaxed security rules for testing

**Production:**
- Strict Firestore security rules
- Production Firebase project
- Proper authentication and authorization

### 3. API Keys Management

**Development:**
- Use development-specific API keys
- Restrict API keys to localhost domains
- Enable all necessary APIs for testing

**Production:**
- Use production API keys
- Restrict API keys to production domains only
- Monitor API usage and set quotas

## Firebase Projects Setup

### Recommended Project Structure

1. **Development Project**: `casemangervue-dev`
   - For local development and testing
   - Relaxed security rules
   - Test data

2. **Production Project**: `casemangervue-prod`
   - For live application
   - Strict security rules
   - Real user data

### Migration Steps

1. Create new Firebase project for production
2. Set up identical configuration
3. Update environment variables
4. Deploy functions to production project
5. Update hosting configuration

## Environment-Specific Features

### Development Only
- Debug menu and role switcher
- Detailed console logging
- Firebase emulator connections
- Hot module replacement

### Production Only
- Error tracking and monitoring
- Performance monitoring
- Analytics
- Optimized builds

## Testing Strategy

### Development Testing
- Use Firebase emulators
- Mock external services
- Test with development data

### Production Testing
- Staging environment (optional)
- Limited production testing
- Monitoring and alerting

## Deployment Process

### Development
```bash
npm run dev
# Uses .env.development
# Connects to emulators
# Enables debug features
```

### Production Build
```bash
npm run build
# Uses .env.production
# Optimized bundle
# Disabled debug features
```

### Firebase Deployment
```bash
# Deploy to development
firebase use development
firebase deploy

# Deploy to production
firebase use production
firebase deploy
```

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_APP_ENV` | development | production | Environment identifier |
| `VITE_FIREBASE_*` | Dev project | Prod project | Firebase configuration |
| `VITE_GOOGLE_*` | Dev keys | Prod keys | Google API credentials |
| `VITE_ENABLE_DEBUG_MENU` | true | false | Debug menu visibility |
| `VITE_ENABLE_CONSOLE_LOGS` | true | false | Console logging |
| `VITE_USE_FIREBASE_EMULATORS` | true | false | Emulator connections |

## Best Practices

1. **Never commit environment files** - Add to `.gitignore`
2. **Use different Firebase projects** for dev/prod
3. **Restrict API keys** to specific domains
4. **Monitor API usage** and set quotas
5. **Use environment-specific error handling**
6. **Implement proper logging** for production
7. **Set up monitoring and alerting**
8. **Regular security audits**

## Current Issues to Address

1. **Single Firebase Project**: Create separate dev/prod projects
2. **Hardcoded Credentials**: Move to environment variables
3. **No Environment Detection**: Implement proper environment logic
4. **Limited Production Features**: Add monitoring, error tracking
5. **No Staging Environment**: Consider adding staging for testing

This configuration will provide proper separation between development and production environments while maintaining security and flexibility. 