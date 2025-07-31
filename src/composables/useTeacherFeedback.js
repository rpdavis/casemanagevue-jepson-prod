import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, query, where, orderBy, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

export function useTeacherFeedback() {
  // State
  const isLoading = ref(false)
  const error = ref('')
  const successMessage = ref('')
  
  // Firebase Functions (with error handling)
  let functions, getStudentFeedback, createFeedbackFormSheet, createFeedbackFormSheetWithUserAuth
  
  try {
    functions = getFunctions()
    // Removed unused functions:
    // sendTeacherFeedbackForm = httpsCallable(functions, 'sendTeacherFeedbackForm')
    // sendTeacherFeedbackFormWithDuplication = httpsCallable(functions, 'sendTeacherFeedbackFormWithDuplication')
    // syncFormResponses = httpsCallable(functions, 'syncFormResponses')
    getStudentFeedback = httpsCallable(functions, 'getStudentFeedback')
    // generateFeedbackDocument = httpsCallable(functions, 'generateFeedbackDocument')
    createFeedbackFormSheet = httpsCallable(functions, 'createFeedbackFormSheet')
    createFeedbackFormSheetWithUserAuth = httpsCallable(functions, 'createFeedbackFormSheetWithUserAuth')
    // createCaseManagerFeedbackSystem = httpsCallable(functions, 'createCaseManagerFeedbackSystem')
    // getCaseManagerFeedbackSystem = httpsCallable(functions, 'getCaseManagerFeedbackSystem')
    // updateCaseManagerDocument = httpsCallable(functions, 'updateCaseManagerDocument')
    // getCaseManagerResources = httpsCallable(functions, 'getCaseManagerResources')
  } catch (err) {
    console.warn('Firebase Functions not available:', err)
    // Create mock functions for development
    // Removed unused mock functions
    getStudentFeedback = () => Promise.reject(new Error('Functions not available'))
    createFeedbackFormSheet = () => Promise.reject(new Error('Functions not available'))
    createFeedbackFormSheetWithUserAuth = () => Promise.reject(new Error('Functions not available'))
  }

  // Firestore collections
  const feedbackFormsRef = collection(db, 'feedbackForms')
  // Removed unused: feedbackSendLogRef, feedbackDocumentsRef - no longer needed
  
  // Reactive state
  const formsLoading = ref(false)
  const feedbackForms = ref([])
  // Removed unused: feedbackDocuments, feedbackResponses, sendLog, responsesLoading, sendLogLoading
  
  // Unsubscribe functions
  let unsubscribeForms
  // Removed unused: unsubscribeResponses, unsubscribeSendLog, unsubscribeDocuments

  // Computed
  const activeForms = computed(() => {
    const forms = feedbackForms.value?.filter(form => form.active !== false) || []
    // Sort by createdAt in JavaScript
    return forms.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt)
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt)
      return dateB - dateA // Descending order
    })
  })
  // Removed unused: totalResponses computed property

  // Methods
  const createFeedbackForm = async (formData) => {
    try {
      isLoading.value = true
      error.value = ''
      
      // Use the new function that works with personal Google accounts
      console.log('🔄 Creating Google Sheet with personal account for form:', formData.title)
      
      // We need to get the user's Google access token first
      // For now, let's try the service account approach but with better error handling
      const sheetResult = await createFeedbackFormSheet({
        title: formData.title,
        description: formData.description,
        formUrl: formData.formUrl,
        studentId: formData.studentId || null,
        studentName: formData.studentName || null
      })
      
      if (!sheetResult.data.success) {
        throw new Error('Failed to create Google Sheet: ' + sheetResult.data.message)
      }
      
      console.log('✅ Google Sheet created:', sheetResult.data.spreadsheetUrl)
      
      // Create the form document with sheet information
      const formDoc = {
        title: formData.title,
        description: formData.description,
        formUrl: formData.formUrl,
        spreadsheetId: sheetResult.data.spreadsheetId,
        spreadsheetUrl: sheetResult.data.spreadsheetUrl,
        userDriveId: sheetResult.data.userDriveId,
        parentFolderId: sheetResult.data.parentFolderId,
        active: true,
        createdAt: new Date(),
        createdBy: formData.createdBy
      }

      const docRef = doc(feedbackFormsRef)
      await setDoc(docRef, formDoc)
      
      successMessage.value = 'Feedback form and Google Sheet created successfully!'
      return { 
        id: docRef.id, 
        ...formDoc 
      }
      
    } catch (error) {
      console.error('Error creating feedback form:', error)
      
      // Provide helpful error messages based on the error type
      if (error.message.includes('storage quota exceeded') || error.message.includes('Service account storage quota exceeded')) {
        error.value = '❌ Cannot create Google Sheet: Service account has no storage quota. Please use the "Test with Personal Account" button in Google Drive Setup to use your personal Google account instead.'
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        error.value = '❌ Permission denied: Please ensure the folder is shared with the service account or use your personal Google account.'
      } else {
        error.value = error.message
      }
      
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Removed unused document generation functions - no longer available:
  // - generateDocument
  // - getDocumentForForm  
  // - updateDocument
  // These functions were removed because the backend generateFeedbackDocument 
  // function is no longer available and FeedbackDocumentManager.vue was deleted.

  // Removed createCaseManagerSystem function - no longer used by any component

  // Removed updateCaseManagerDoc function - no longer used by any component

  const updateFeedbackForm = async (formId, updates) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const docRef = doc(feedbackFormsRef, formId)
      await setDoc(docRef, { ...updates, updatedAt: new Date() }, { merge: true })
      
      successMessage.value = 'Feedback form updated successfully!'
      
    } catch (err) {
      console.error('Error updating feedback form:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteFeedbackForm = async (formId) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const docRef = doc(feedbackFormsRef, formId)
      await deleteDoc(docRef)
      
      successMessage.value = 'Feedback form deleted successfully!'
      
    } catch (err) {
      console.error('Error deleting feedback form:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Removed sendFeedbackForm function - no longer used by any component

  // Removed unused functions - no longer available in backend:
  /*
  All the following functions have been removed from the backend:
  - sendTeacherFeedbackForm
  - sendTeacherFeedbackFormWithDuplication  
  - generateFeedbackDocument
  - createCaseManagerFeedbackSystem
  - getCaseManagerFeedbackSystem
  - updateCaseManagerDocument
  - getCaseManagerResources
  - syncFormResponses
  - autoSyncFormResponses
  
  The frontend now opens forms directly instead of using these backend functions.
  */

  // Removed all remaining unused functions - no longer needed by any component:
  // - syncResponses (was only used by deleted FeedbackDocumentManager)
  // - getResponsesForStudent (was only used by deleted components) 
  // - getResponsesForForm (was only used by deleted components)
  // - getResponsesForSpreadsheet (was only used by deleted components)
  // - getSendLogForStudent (was only used by deleted components)

  const clearMessages = () => {
    error.value = ''
    successMessage.value = ''
  }

  // Extract form ID from Google Forms URL
  const extractFormId = (url) => {
    const match = url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  // Initialize Firestore listeners
  const initializeListeners = () => {
    try {
      // Listen to feedback forms
      unsubscribeForms = onSnapshot(feedbackFormsRef, (snapshot) => {
        feedbackForms.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        formsLoading.value = false
      }, (error) => {
        console.warn('Error listening to feedback forms:', error)
        formsLoading.value = false
      })

      // Listen to feedback responses
      // Removed unused: unsubscribeResponses = onSnapshot(feedbackResponsesRef, (snapshot) => {
      // Removed unused: feedbackResponses.value = snapshot.docs.map(doc => ({
      // Removed unused: responsesLoading.value = false
      // Removed unused: }, (error) => {
      // Removed unused: responsesLoading.value = false
      // Removed unused: })

      // Listen to send log
      // Removed unused: unsubscribeSendLog = onSnapshot(feedbackSendLogRef, (snapshot) => {
      // Removed unused: sendLog.value = snapshot.docs.map(doc => ({
      // Removed unused: sendLogLoading.value = false
      // Removed unused: }, (error) => {
      // Removed unused: sendLogLoading.value = false
      // Removed unused: })

      // Listen to feedback documents
      // Removed unused: unsubscribeDocuments = onSnapshot(feedbackDocumentsRef, (snapshot) => {
      // Removed unused: feedbackDocuments.value = snapshot.docs.map(doc => ({
      // Removed unused: }, (error) => {
      // Removed unused: })
    } catch (error) {
      console.warn('Error initializing Firestore listeners:', error)
      formsLoading.value = false
      // Removed unused: responsesLoading.value = false
      // Removed unused: sendLogLoading.value = false
    }
  }

  // Cleanup listeners
  const cleanupListeners = () => {
    if (unsubscribeForms) unsubscribeForms()
    // Removed unused: if (unsubscribeResponses) unsubscribeResponses()
    // Removed unused: if (unsubscribeSendLog) unsubscribeSendLog()
    // Removed unused: if (unsubscribeDocuments) unsubscribeDocuments()
  }

  // Initialize on mount
  onMounted(() => {
    initializeListeners()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupListeners()
  })

  // Create feedback form with personal Google account (requires user authentication)
  const createFeedbackFormWithUserAuth = async (formData, accessToken) => {
    try {
      isLoading.value = true
      error.value = ''
      
      // Use the new function that works with personal Google accounts
      console.log('🔄 Creating Google Sheet with personal account for form:', formData.title)
      
      const sheetResult = await createFeedbackFormSheetWithUserAuth({
        title: formData.title,
        description: formData.description,
        formUrl: formData.formUrl,
        studentId: formData.studentId || null,
        studentName: formData.studentName || null,
        accessToken: accessToken
      })
      
      if (!sheetResult.data.success) {
        throw new Error('Failed to create Google Sheet: ' + sheetResult.data.message)
      }
      
      console.log('✅ Google Sheet created with personal account:', sheetResult.data.spreadsheetUrl)
      
      // Create the form document with sheet information
      const formDoc = {
        title: formData.title,
        description: formData.description,
        formUrl: formData.formUrl,
        spreadsheetId: sheetResult.data.spreadsheetId,
        spreadsheetUrl: sheetResult.data.spreadsheetUrl,
        driveType: 'personal',
        active: true,
        createdAt: new Date(),
        createdBy: formData.createdBy
      }

      const docRef = doc(feedbackFormsRef)
      await setDoc(docRef, formDoc)
      
      successMessage.value = 'Feedback form and Google Sheet created successfully in your personal Google Drive!'
      return { 
        id: docRef.id, 
        ...formDoc 
      }
      
    } catch (error) {
      console.error('Error creating feedback form with user auth:', error)
      error.value = error.message
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isLoading,
    error,
    successMessage,
    formsLoading,
    // Removed unused state: responsesLoading, sendLogLoading, feedbackResponses, sendLog, totalResponses, feedbackDocuments
    
    // Data
    feedbackForms,
    activeForms,
    
    // Methods
    createFeedbackForm,
    updateFeedbackForm,
    deleteFeedbackForm,
    clearMessages,
    extractFormId,
    createFeedbackFormWithUserAuth
    // Removed unused methods: generateDocument, getDocumentForForm, updateDocument, sendFeedbackForm, 
    // getResponsesForStudent, getResponsesForForm, getResponsesForSpreadsheet, getSendLogForStudent,
    // getTeacherEmails, extractSpreadsheetId
  }
} 