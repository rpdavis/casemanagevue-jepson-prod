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
  let functions, sendTeacherFeedbackForm, syncFormResponses, getStudentFeedback
  
  try {
    functions = getFunctions()
    sendTeacherFeedbackForm = httpsCallable(functions, 'sendTeacherFeedbackForm')
    syncFormResponses = httpsCallable(functions, 'syncFormResponses')
    getStudentFeedback = httpsCallable(functions, 'getStudentFeedback')
  } catch (err) {
    console.warn('Firebase Functions not available:', err)
    // Create mock functions for development
    sendTeacherFeedbackForm = () => Promise.reject(new Error('Functions not available'))
    syncFormResponses = () => Promise.reject(new Error('Functions not available'))
    getStudentFeedback = () => Promise.reject(new Error('Functions not available'))
  }

  // Firestore collections
  const feedbackFormsRef = collection(db, 'feedbackForms')
  const feedbackResponsesRef = collection(db, 'feedbackResponses')
  const feedbackSendLogRef = collection(db, 'feedbackSendLog')

  // Reactive data
  const feedbackForms = ref([])
  const formsLoading = ref(true)
  const feedbackResponses = ref([])
  const responsesLoading = ref(true)
  const sendLog = ref([])
  const sendLogLoading = ref(true)

  // Unsubscribe functions
  let unsubscribeForms, unsubscribeResponses, unsubscribeSendLog

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

  const totalResponses = computed(() => {
    return feedbackResponses.value?.length || 0
  })

  // Methods
  const createFeedbackForm = async (formData) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const formDoc = {
        title: formData.title,
        description: formData.description,
        formUrl: formData.formUrl,
        responseSpreadsheetId: formData.responseSpreadsheetId,
        active: true,
        createdAt: new Date(),
        createdBy: formData.createdBy
      }

      const docRef = doc(feedbackFormsRef)
      await setDoc(docRef, formDoc)
      
      successMessage.value = 'Feedback form created successfully!'
      return { id: docRef.id, ...formDoc }
      
    } catch (err) {
      console.error('Error creating feedback form:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

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

  const sendFeedbackForm = async (formData) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const result = await sendTeacherFeedbackForm(formData)
      
      if (result.data.success) {
        successMessage.value = result.data.message
        return result.data
      } else {
        throw new Error(result.data.message || 'Failed to send feedback form')
      }
      
    } catch (err) {
      console.error('Error sending feedback form:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const syncResponses = async (spreadsheetId, sheetName = 'Form Responses 1') => {
    try {
      isLoading.value = true
      error.value = ''
      
      const result = await syncFormResponses({ spreadsheetId, sheetName })
      
      if (result.data.success) {
        successMessage.value = result.data.message
        return result.data
      } else {
        throw new Error(result.data.message || 'Failed to sync responses')
      }
      
    } catch (err) {
      console.error('Error syncing responses:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getResponsesForStudent = async (studentId) => {
    try {
      isLoading.value = true
      error.value = ''
      
      const result = await getStudentFeedback({ studentId })
      
      if (result.data.success) {
        return result.data.responses
      } else {
        throw new Error(result.data.message || 'Failed to get student feedback')
      }
      
    } catch (err) {
      console.error('Error getting student feedback:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getResponsesForForm = (formId) => {
    return computed(() => {
      return feedbackResponses.value?.filter(response => response.formId === formId) || []
    })
  }

  const getResponsesForSpreadsheet = (spreadsheetId) => {
    return computed(() => {
      return feedbackResponses.value?.filter(response => response.spreadsheetId === spreadsheetId) || []
    })
  }

  const getSendLogForStudent = (studentId) => {
    return computed(() => {
      return sendLog.value?.filter(log => log.studentId === studentId) || []
    })
  }

  const clearMessages = () => {
    error.value = ''
    successMessage.value = ''
  }

  // Extract spreadsheet ID from Google Sheets URL
  const extractSpreadsheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
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
      unsubscribeResponses = onSnapshot(feedbackResponsesRef, (snapshot) => {
        feedbackResponses.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        responsesLoading.value = false
      }, (error) => {
        console.warn('Error listening to feedback responses:', error)
        responsesLoading.value = false
      })

      // Listen to send log
      unsubscribeSendLog = onSnapshot(feedbackSendLogRef, (snapshot) => {
        sendLog.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        sendLogLoading.value = false
      }, (error) => {
        console.warn('Error listening to send log:', error)
        sendLogLoading.value = false
      })
    } catch (error) {
      console.warn('Error initializing Firestore listeners:', error)
      formsLoading.value = false
      responsesLoading.value = false
      sendLogLoading.value = false
    }
  }

  // Cleanup listeners
  const cleanupListeners = () => {
    if (unsubscribeForms) unsubscribeForms()
    if (unsubscribeResponses) unsubscribeResponses()
    if (unsubscribeSendLog) unsubscribeSendLog()
  }

  // Initialize on mount
  onMounted(() => {
    initializeListeners()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupListeners()
  })

  // Get teacher emails from users collection
  const getTeacherEmails = async () => {
    try {
      const usersRef = collection(db, 'users')
      const teachersQuery = query(usersRef, where('role', '==', 'teacher'))
      const snapshot = await getDocs(teachersQuery)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          email: data.email
        }
      })
    } catch (err) {
      console.error('Error getting teacher emails:', err)
      throw err
    }
  }

  return {
    // State
    isLoading,
    error,
    successMessage,
    formsLoading,
    responsesLoading,
    sendLogLoading,
    
    // Data
    feedbackForms,
    feedbackResponses,
    sendLog,
    activeForms,
    totalResponses,
    
    // Methods
    createFeedbackForm,
    updateFeedbackForm,
    deleteFeedbackForm,
    sendFeedbackForm,
    syncResponses,
    getResponsesForStudent,
    getResponsesForForm,
    getResponsesForSpreadsheet,
    getSendLogForStudent,
    getTeacherEmails,
    clearMessages,
    extractSpreadsheetId,
    extractFormId
  }
} 