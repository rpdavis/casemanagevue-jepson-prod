import { ref, computed, watch, reactive, onMounted } from 'vue'
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { getDisplayValue } from '@/utils/studentUtils'
import { useAppSettings } from '@/composables/useAppSettings'

// Debug helper for tracking timing and process
const debugProcess = (stage, data) => {
  const timestamp = new Date().toISOString()
  console.log(`🕒 [${timestamp}] Process Stage: ${stage}`, data)
}

export function useStudentForm(props, emit) {
  // Track form state changes
  const formStateVersion = ref(0)
  const lastSavedState = ref(null)
  const isProcessing = ref(false)
  
  // Load app settings
  const { appSettings, loadAppSettings, loading: appSettingsLoading, error: appSettingsError } = useAppSettings()
  
  // Loading state
  const isSaving = ref(false)
  
  // Initialize app settings
  onMounted(async () => {
    try {
      debugProcess('MOUNT', 'Starting component mount process')
      await loadAppSettings()
      debugProcess('APP_SETTINGS_LOADED', appSettings.value)
    } catch (error) {
      console.error('useStudentForm: Error loading app settings:', error)
    }
  })

  // Form state initialization
  const initializeFormData = (student) => {
    debugProcess('INIT_START', {
      studentId: student.id,
      hasData: !!student.app
    })

    // Get raw schedule periods from any possible location
    const rawPeriods = student.app?.schedule?.periods || student.aeries?.schedule?.periods || student.schedule || {}
    
    debugProcess('INIT_SCHEDULE_SOURCE', {
      fromApp: !!student.app?.schedule?.periods,
      fromAeries: !!student.aeries?.schedule?.periods,
      fromLegacy: !!student.schedule,
      finalSource: Object.keys(rawPeriods).length > 0 ? 
        (student.app?.schedule?.periods ? 'app' : 
         student.aeries?.schedule?.periods ? 'aeries' : 
         student.schedule ? 'legacy' : 'empty') : 'none'
    })

    // Normalize the schedule data structure
    const normalizedSchedule = {}
    Object.entries(rawPeriods).forEach(([period, data]) => {
      if (typeof data === 'string') {
        normalizedSchedule[period] = data
      } else if (typeof data === 'object' && data !== null) {
        if (data.coTeaching) {
          normalizedSchedule[period] = data
        } else if (data.teacherId) {
          normalizedSchedule[period] = {
            teacherId: data.teacherId,
            coTeaching: {
              caseManagerId: data.coTeachingCaseManager || '',
              subject: data.subject || ''
            }
          }
        } else {
          normalizedSchedule[period] = String(data) || ''
        }
      }
    })

    debugProcess('INIT_SCHEDULE_NORMALIZED', {
      before: rawPeriods,
      after: normalizedSchedule
    })

    const formData = {
      ssid: student.id || '',
      firstName: getDisplayValue(student, 'firstName') || '',
      lastName: getDisplayValue(student, 'lastName') || '',
      grade: getDisplayValue(student, 'grade') || '7',
      plan: getDisplayValue(student, 'plan') || 'IEP',
      reviewDate: getDisplayValue(student, 'reviewDate') || '',
      reevalDate: getDisplayValue(student, 'reevalDate') || '',
      meetingDate: getDisplayValue(student, 'meetingDate') || '',
      caseManagerId: student.app?.studentData?.caseManagerId || student.caseManagerId || student.casemanager_id || '',
      schedule: normalizedSchedule,
      services: (student.app?.schedule?.classServices || student.services) || [],
      // ... rest of the initialization code ...
    }

    debugProcess('INIT_COMPLETE', {
      formStateVersion: formStateVersion.value + 1,
      schedule: formData.schedule,
      services: formData.services
    })

    formStateVersion.value++
    return formData
  }

  // Form state - reactive object
  const form = reactive(initializeFormData(props.student || {}))

  // Watch for changes in student prop and update form
  watch(() => props.student, (newStudent) => {
    if (newStudent && Object.keys(newStudent).length > 0) {
      debugProcess('STUDENT_PROP_CHANGE', {
        studentId: newStudent.id,
        currentFormState: formStateVersion.value,
        isProcessing: isProcessing.value,
        isSaving: isSaving.value
      })

      if (!isProcessing.value) {
        isProcessing.value = true
        const newFormData = initializeFormData(newStudent)
        Object.assign(form, newFormData)
        isProcessing.value = false
        
        debugProcess('FORM_UPDATED', {
          newFormState: formStateVersion.value,
          schedule: form.schedule
        })
      } else {
        debugProcess('SKIPPED_UPDATE', {
          reason: 'Processing in progress',
          currentState: formStateVersion.value
        })
      }
    }
  }, { immediate: true, deep: true })

  // Note: No longer need to watch for periodLabels changes since we use numeric keys

      // Compose schedule object – use the form.schedule directly (already normalized)
      const schedule = { ...form.schedule } 

// Main submit handler
const handleSubmit = async () => {
  try {
    debugProcess('SUBMIT_START', {
      formStateVersion: formStateVersion.value,
      isProcessing: isProcessing.value
    })

    if (isProcessing.value) {
      debugProcess('SUBMIT_BLOCKED', 'Processing in progress')
      return
    }

    isProcessing.value = true
    isSaving.value = true
    
    // Validate form
    if (!validateForm()) {
      isProcessing.value = false
      isSaving.value = false
      return
    }
    
    // Compose schedule object - preserve co-teaching structure and period order
    const schedule = {}
    Object.entries(form.schedule).forEach(([periodNum, periodData]) => {
      if (!periodData) return
      
      if (typeof periodData === 'string') {
        // Simple string format - just teacher ID
        schedule[periodNum] = periodData
      } else if (typeof periodData === 'object' && periodData.teacherId) {
        // Object format with co-teaching
        const scheduleEntry = {
          teacherId: periodData.teacherId
        }
        
        // Only add coTeaching if it has a caseManagerId
        if (periodData.coTeaching && periodData.coTeaching.caseManagerId) {
          scheduleEntry.coTeaching = {
            caseManagerId: periodData.coTeaching.caseManagerId,
            subject: periodData.coTeaching.subject || ''
          }
        }
        
        schedule[periodNum] = scheduleEntry
      }
    })
    
    debugProcess('SUBMIT_SCHEDULE', {
      before: form.schedule,
      after: schedule
    })
    
    // Compose payload
    const appData = {
      studentData: {
        firstName: form.firstName,
        lastName: form.lastName,
        grade: form.grade,
        plan: form.plan,
        caseManagerId: form.caseManagerId
      },
      schedule: {
        periods: schedule,
        classServices: form.services.filter(s => s && s.includes(':'))
      },
      // ... rest of appData ...
    }
    
    const payload = {
      app: appData,
      updatedAt: serverTimestamp()
    }
    
    debugProcess('SUBMIT_PAYLOAD', payload)
    
    // Save to Firestore
    if (props.mode === 'edit' && props.student.id) {
      await setDoc(doc(db, 'students', props.student.id), payload, { merge: true })
      debugProcess('SAVE_COMPLETE', {
        type: 'update',
        studentId: props.student.id
      })
    } else {
      const docRef = doc(collection(db, 'students'))
      payload.createdAt = serverTimestamp()
      await setDoc(docRef, payload)
      payload.id = docRef.id
      debugProcess('SAVE_COMPLETE', {
        type: 'create',
        studentId: docRef.id
      })
    }
    
    lastSavedState.value = JSON.stringify(form.schedule)
    formStateVersion.value++
    
    emit('saved', payload)
    emit('close')
  } catch (error) {
    console.error('Error saving student:', error)
    debugProcess('SAVE_ERROR', error)
    alert('Error saving student. Please try again.')
  } finally {
    isProcessing.value = false
    isSaving.value = false
  }
} 
} 