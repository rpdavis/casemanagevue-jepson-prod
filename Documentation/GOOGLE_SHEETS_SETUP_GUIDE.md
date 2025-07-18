# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API integration to create actual Google Sheets from your CaseManageVue application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. Your CaseManageVue application running locally

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter a project name (e.g., "CaseManageVue Sheets")
5. Click "Create"

## Step 2: Enable Google Sheets API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "CaseManageVue"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the steps

4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "CaseManageVue Web Client"
   - Authorized JavaScript origins: Add these URLs:
     ```
     http://localhost:5173
     http://localhost:5174
     http://localhost:5175
     http://localhost:5176
     http://localhost:5177
     http://localhost:5178
     http://localhost:5179
     http://localhost:5180
     ```
   - Authorized redirect URIs: Leave empty for now
   - Click "Create"

5. Copy the Client ID (you'll need this)

## Step 4: Create API Key

1. In "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API Key
4. Click "Restrict Key" and:
   - Name: "CaseManageVue Sheets API Key"
   - Restrict to: Google Sheets API
   - Click "Save"

## Step 5: Update Your Application

1. Open `src/composables/useGoogleSheetsClient.js`
2. Replace the CLIENT_ID and API_KEY with your new credentials:

```javascript
const CLIENT_ID = 'YOUR_NEW_CLIENT_ID_HERE'
const API_KEY = 'YOUR_NEW_API_KEY_HERE'
```

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Testing Links page
3. Click "Load Google API (with OAuth)"
4. Sign in with your Google account when prompted
5. Click "Create Google Sheet with Data"

## Troubleshooting

### OAuth Client Configuration Error

If you see "idpiframe_initialization_failed":

1. Check that your OAuth client has the correct JavaScript origins
2. Make sure there are no trailing slashes in the URLs
3. Wait 5-10 minutes for changes to propagate
4. Clear your browser cache and cookies
5. Try in an incognito/private window

### API Key Issues

If you see 403 errors:

1. Make sure Google Sheets API is enabled
2. Check that your API key is restricted to Google Sheets API
3. Verify the API key is correct in your code

### Content Security Policy Issues

If you see CSP violations:

1. Check your browser's developer console for specific errors
2. Make sure your app allows loading scripts from `https://apis.google.com`
3. Try disabling browser extensions that might block scripts

### Port Issues

If your dev server uses a different port:

1. Add the new port to your OAuth client's authorized JavaScript origins
2. Update the port in the error messages in the code if needed

## Security Best Practices

1. **Never commit API keys to version control**
2. Use environment variables for sensitive credentials
3. Restrict API keys to specific APIs and domains
4. Regularly rotate your credentials
5. Monitor API usage in Google Cloud Console

## Environment Variables Setup (Recommended)

1. Create a `.env.local` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

2. Update `src/composables/useGoogleSheetsClient.js`:

```javascript
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
```

3. Add `.env.local` to your `.gitignore` file

## What the Integration Does

Once properly configured, the Google Sheets integration will:

1. **Create real Google Sheets** with your student data
2. **Format the sheets** with headers and styling
3. **Add custom tabs** for specific teachers
4. **Provide direct links** to open the sheets
5. **Handle authentication** securely through OAuth

## Success Indicators

You'll know it's working when:

- ✅ You can sign in with Google without errors
- ✅ Clicking "Create Google Sheet" opens a new Google Sheet
- ✅ The sheet contains your student data with proper formatting
- ✅ You can add custom tabs for specific teachers
- ✅ The sheet link works and opens the actual Google Sheet

## Support

If you continue to have issues:

1. Check the browser console for specific error messages
2. Verify all steps in this guide were followed correctly
3. Try the integration in a different browser
4. Check Google Cloud Console for any quota or permission issues 