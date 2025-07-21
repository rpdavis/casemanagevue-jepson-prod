# Cloud Functions Setup Guide

This guide will help you set up Firebase Cloud Functions for the Teacher Feedback system.

## Prerequisites

1. Firebase project with Firestore enabled
2. Google Cloud Console project (same as Firebase project)
3. Gmail account for sending emails
4. Node.js 18+ installed locally

## Step 1: Enable Required APIs

In Google Cloud Console (https://console.cloud.google.com):

1. Go to "APIs & Services" > "Library"
2. Enable these APIs:
   - **Gmail API**
   - **Google Sheets API** 
   - **Google Forms API** (if using form creation features)

## Step 2: Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `firebase-functions-service`
4. Grant these roles:
   - **Editor** (for Sheets access)
   - **Gmail API User** (for email sending)
5. Click "Done"
6. Click on the created service account
7. Go to "Keys" tab > "Add Key" > "Create new key" > "JSON"
8. Download the JSON key file

## Step 3: Configure Authentication

### Option A: Environment Variable (Recommended for Production)

1. Copy the JSON key content
2. Set environment variable in Firebase Functions:
```bash
firebase functions:config:set google.key="$(cat path/to/service-account.json)"
```

### Option B: Direct File (For Development)

1. Place the JSON file as `functions/service-account.json`
2. Add to `.gitignore`:
```
functions/service-account.json
```

## Step 4: Gmail API Setup

1. Go to Gmail API in Google Cloud Console
2. Click "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Add authorized redirect URIs:
   - `https://developers.google.com/oauthplayground`
5. Note the Client ID and Client Secret

### Enable Gmail Access for Service Account

1. Go to Google Admin Console (admin.google.com)
2. Security > API Controls > Domain-wide Delegation
3. Add the service account email with these scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/spreadsheets.readonly`

## Step 5: Deploy Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

## Step 6: Test the Setup

### Test Form Sending

In your Vue app, try sending a feedback form. Check:

1. Firebase Functions logs: `firebase functions:log`
2. Firestore collections:
   - `feedbackForms` - Your added forms
   - `feedbackSendLog` - Send history
   - `feedbackResponses` - Synced responses

### Test Response Syncing

1. Add responses to your Google Form
2. Call the sync function or wait for auto-sync
3. Check `feedbackResponses` collection in Firestore

## Troubleshooting

### Common Issues

**"Authentication required" errors:**
- Verify service account JSON is properly configured
- Check that APIs are enabled in Google Cloud Console

**"Permission denied" errors:**
- Verify user roles in Firestore `users` collection
- Check that custom claims are set correctly

**Gmail sending fails:**
- Verify domain-wide delegation is configured
- Check that Gmail API is enabled
- Ensure service account has proper scopes

**Sheets sync fails:**
- Verify spreadsheet ID is correct
- Check that service account has access to the sheet
- Ensure Google Sheets API is enabled

### Debugging

Enable debug logging in functions:
```javascript
console.log("Debug info:", { data, context });
```

View logs:
```bash
firebase functions:log --only sendTeacherFeedbackForm
```

## Security Notes

1. **Never commit service account keys to version control**
2. **Use environment variables in production**
3. **Regularly rotate service account keys**
4. **Monitor function usage and costs**
5. **Set up proper Firestore security rules**

## Firestore Security Rules

Add these rules to protect the feedback data:

```javascript
// Allow case managers to read/write feedback forms
match /feedbackForms/{formId} {
  allow read, write: if request.auth != null && 
    (resource == null || request.auth.token.role in ['admin', 'case_manager', 'sped_chair']);
}

// Allow case managers to read feedback responses
match /feedbackResponses/{responseId} {
  allow read: if request.auth != null && 
    request.auth.token.role in ['admin', 'case_manager', 'sped_chair'];
  allow write: if false; // Only functions can write
}

// Allow case managers to read send logs
match /feedbackSendLog/{logId} {
  allow read: if request.auth != null && 
    request.auth.token.role in ['admin', 'case_manager', 'sped_chair'];
  allow write: if false; // Only functions can write
}
```

## Cost Considerations

- Gmail API: Free up to 1 billion quota units per day
- Google Sheets API: Free up to 300 requests per minute
- Firebase Functions: Pay per execution and compute time
- Firestore: Pay per read/write operation

Monitor usage in Firebase Console and Google Cloud Console. 