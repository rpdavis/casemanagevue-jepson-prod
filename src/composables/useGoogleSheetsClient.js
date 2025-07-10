import { ref } from 'vue'

// Environment-based Google API configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
]
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

export default function useGoogleSheetsClient() {
  const isSignedIn = ref(false)
  const gapiLoaded = ref(false)
  const currentSheetId = ref('')
  const currentSheetUrl = ref('')
  const errorMessage = ref('')

  // Log configuration in development
  if (import.meta.env.DEV) {
    console.log('🔑 Google Sheets Client Configuration:')
    console.log('  CLIENT_ID:', CLIENT_ID ? CLIENT_ID.substring(0, 20) + '...' : 'Not set')
    console.log('  API_KEY:', API_KEY ? API_KEY.substring(0, 20) + '...' : 'Not set')
  }

  function loadGapi() {
    return new Promise((resolve, reject) => {
      // Check if gapi is already loaded
      if (window.gapi && window.gapi.load) {
        window.gapi.load('client:auth2', resolve)
        return
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
        // Wait for existing script to load
        const checkGapi = () => {
          if (window.gapi && window.gapi.load) {
            window.gapi.load('client:auth2', resolve)
          } else {
            setTimeout(checkGapi, 100)
          }
        }
        checkGapi()
        return
      }

      // Load the script
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.gapi && window.gapi.load) {
          window.gapi.load('client:auth2', resolve)
        } else {
          reject(new Error('Google API failed to load properly'))
        }
      }
      script.onerror = () => reject(new Error('Failed to load Google API script'))
      document.head.appendChild(script)
    })
  }

  async function initClientWithoutOAuth() {
    try {
      errorMessage.value = ''
      console.log('Starting Google API initialization without OAuth...')
      
      await loadGapi()
      console.log('Google API script loaded successfully')
      
      // Initialize the client without OAuth
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      })
      
      console.log('Google API client initialized successfully (without OAuth)')
      gapiLoaded.value = true
      isSignedIn.value = false // No OAuth, so not signed in
      console.log('Google API client setup complete (without OAuth)')
      
    } catch (error) {
      console.error('Error initializing Google API client:', error)
      errorMessage.value = error.message || 'Failed to initialize Google API'
      throw new Error(errorMessage.value)
    }
  }

  async function initClient() {
    try {
      errorMessage.value = ''
      console.log('Starting Google API initialization...')
      
      await loadGapi()
      console.log('Google API script loaded successfully')
      
      // Initialize the client with more specific configuration
      await window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
        // Remove problematic options that might cause issues
        // hosted_domain: 'localhost',
        // ux_mode: 'popup'
      })
      
      console.log('Google API client initialized successfully')
      
      // Set up auth state listener
      const authInstance = window.gapi.auth2.getAuthInstance()
      authInstance.isSignedIn.listen((val) => {
        isSignedIn.value = val
        console.log('Auth state changed:', val)
      })
      
      isSignedIn.value = authInstance.isSignedIn.get()
      gapiLoaded.value = true
      console.log('Google API client setup complete')
      
    } catch (error) {
      console.error('Error initializing Google API client:', error)
      errorMessage.value = error.message || 'Failed to initialize Google API'
      
      // Provide specific guidance based on error type
      const currentPort = window.location.port || '5173'
      if (error.message && error.message.includes('idpiframe_initialization_failed')) {
        errorMessage.value = `OAuth client configuration error. The issue is likely with your OAuth client settings. Please verify:
        1. http://localhost:${currentPort} is in Authorized JavaScript origins (no trailing slash)
        2. Remove any malformed entries like http://localhost:${currentPort}/http://localhost:${currentPort}/
        3. Wait 5-10 minutes for changes to propagate
        4. Try clearing your browser cache and cookies`
      } else if (error.message && error.message.includes('403')) {
        errorMessage.value = 'API key or permissions error. Please check your Google Cloud Console API key and ensure Google Sheets API is enabled.'
      } else if (error.message && error.message.includes('CSP')) {
        errorMessage.value = 'Content Security Policy violation. The Google API script is being blocked by your browser security settings.'
      }
      
      throw new Error(errorMessage.value)
    }
  }

  async function signIn() {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      
      if (!authInstance) {
        throw new Error('Google OAuth not initialized. Please use "Load Google API (with OAuth)" instead of the "No OAuth" option.')
      }
      
      await authInstance.signIn()
      isSignedIn.value = true
      console.log('User signed in successfully')
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async function signOut() {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      
      if (!authInstance) {
        console.warn('No auth instance to sign out from')
        isSignedIn.value = false
        return
      }
      
      await authInstance.signOut()
      isSignedIn.value = false
      console.log('User signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  async function createSheet(title) {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.create({
        properties: { title }
      })
      currentSheetId.value = response.result.spreadsheetId
      currentSheetUrl.value = response.result.spreadsheetUrl
      console.log('Sheet created successfully:', response.result.spreadsheetId)
      return response.result
    } catch (error) {
      console.error('Create sheet error:', error)
      
      // Handle 401 Unauthorized - OAuth required for write operations
      if (error.status === 401) {
        throw new Error('OAuth authentication required to create Google Sheets. Please use the "Load Google API (with OAuth)" option and sign in with Google.')
      }
      
      // Handle other errors
      if (error.status === 403) {
        throw new Error('Permission denied. Please check your Google Cloud Console API key permissions.')
      }
      
      throw new Error(`Failed to create Google Sheet: ${error.message || 'Unknown error'}`)
    }
  }

  async function addDataToSheet(sheetId, range, values) {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range,
        valueInputOption: 'RAW',
        values: values,
      })
      console.log('Data added to sheet successfully')
      return response
    } catch (error) {
      console.error('Add data error:', error)
      throw error
    }
  }

  async function testAPI() {
    try {
      // Test if we can access the Sheets API
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: 'test'
      })
      return true
    } catch (error) {
      console.error('API test failed:', error)
      return false
    }
  }

  return {
    isSignedIn,
    gapiLoaded,
    currentSheetId,
    currentSheetUrl,
    errorMessage,
    initClient,
    initClientWithoutOAuth,
    signIn,
    signOut,
    createSheet,
    addDataToSheet,
    testAPI,
  }
} 