import { ref, computed, watch, reactive, onMounted } from 'vue'
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { getDisplayValue } from '@/utils/studentUtils'
import { useAppSettings } from '@/composables/useAppSettings'

export function useStudentForm(props, emit) {
  // Load app settings
  const { appSettings, loadAppSettings, loading: appSettingsLoading, error: appSettingsError } = useAppSettings()
  
  // Loading state
  const isSaving = ref(false)
  
  // Initialize app settings
  onMounted(async () => {
    try {
      console.log('useStudentForm: Starting to load app settings...')
      await loadAppSettings()
      console.log('useStudentForm: App settings loaded successfully:', appSettings.value)
    } catch (error) {
      console.error('useStudentForm: Error loading app settings:', error)
    }
  })

  // Dynamic periods from app settings
  const periods = computed(() => {
    if (appSettings.value?.numPeriods && appSettings.value?.periodLabels) {
      return appSettings.value.periodLabels.slice(0, appSettings.value.numPeriods)
    }
    return ['Per1', 'Per2', 'Per3', 'Per4', 'Per5', 'Per6', 'Per7']
  })

  // Grades options from app settings
  const gradeOptions = computed(() => {
    if (appSettings.value?.grades && appSettings.value.grades.length > 0) {
      console.log('useStudentForm: Using app settings grades:', appSettings.value.grades)
      return appSettings.value.grades
    }
    console.log('useStudentForm: Using fallback grades: [7, 8]')
    return ['7', '8']
  })

  // Class services from app settings
  const availableClassServices = computed(() => {
    if (appSettings.value?.classServices && appSettings.value.classServices.length > 0) {
      const enabledServices = appSettings.value.classServices.filter(s => 
        s.enabledSubcategories && s.enabledSubcategories.length > 0
      )
      console.log('useStudentForm: Available class services:', enabledServices.length, 'services')
      return enabledServices
    }
    console.log('useStudentForm: No class services available')
    return []
  })

  // Service providers from app settings
  const serviceProviders = computed(() => {
    if (appSettings.value?.serviceProviders && appSettings.value.serviceProviders.length > 0) {
      console.log('useStudentForm: Using app settings service providers:', appSettings.value.serviceProviders.length, 'providers')
      return appSettings.value.serviceProviders
    }
    console.log('useStudentForm: No service providers configured in app settings')
    return []
  })

  const customServiceProviders = computed(() => {
    if (appSettings.value?.customServiceProviders) {
      return appSettings.value.customServiceProviders
    }
    return []
  })

  // User roles structure
  const userRoles = computed(() => {
    let roles = props.users.userRoles ? props.users.userRoles : {
      teachers: props.users.teachers || [],
      caseManagers: props.users.caseManagers || [],
      speech: props.users.speech || [],
      ot: props.users.ot || [],
      mh: props.users.mh || []
    }
    
    // Force all teacher IDs to strings
    if (roles.teachers) {
      roles = {
        ...roles,
        teachers: roles.teachers.map(t => ({ ...t, id: String(t.id) }))
      }
    }
    return roles
  })

  // Form state initialization
  const initializeFormData = (student) => {
    return {
      ssid: student.id || '',
      firstName: getDisplayValue(student, 'firstName') || '',
      lastName: getDisplayValue(student, 'lastName') || '',
      grade: getDisplayValue(student, 'grade') || '7',
      plan: getDisplayValue(student, 'plan') || 'IEP',
      reviewDate: getDisplayValue(student, 'reviewDate') || '',
      reevalDate: getDisplayValue(student, 'reevalDate') || '',
      meetingDate: getDisplayValue(student, 'meetingDate') || '',
      caseManagerId: student.app?.studentData?.caseManagerId || student.caseManagerId || student.casemanager_id || '',
      schedule: student.app?.schedule?.periods || student.aeries?.schedule?.periods || student.schedule || {},
      services: (student.app?.schedule?.classServices || student.services) || [],
      speechId: student.app?.providers?.speechId || student.speechId || student.speech_id || '',
      otId: student.app?.providers?.otId || student.otId || student.ot_id || '',
      mhId: student.app?.providers?.mhId || student.mhId || student.mh_id || '',
      ptId: student.app?.providers?.ptId || student.ptId || student.pt_id || '',
      scId: student.app?.providers?.scId || student.scId || student.sc_id || '',
      trId: student.app?.providers?.trId || student.trId || student.tr_id || '',
      audId: student.app?.providers?.audId || student.audId || student.aud_id || '',
      viId: student.app?.providers?.viId || student.viId || student.vi_id || '',
      atId: student.app?.providers?.atId || student.atId || student.at_id || '',
      dhhId: student.app?.providers?.dhhId || student.dhhId || student.dhh_id || '',
      omId: student.app?.providers?.omId || student.omId || student.om_id || '',
      bisId: student.app?.providers?.bisId || student.bisId || student.bis_id || '',
      hnId: student.app?.providers?.hnId || student.hnId || student.hn_id || '',
      swId: student.app?.providers?.swId || student.swId || student.sw_id || '',
      instruction: getDisplayValue(student, 'instruction') || '',
      assessment: getDisplayValue(student, 'assessment') || '',
      flag1: student.app?.flags?.flag1 || student.flag1 || false,
      flag2: student.app?.flags?.flag2 || student.flag2 || false,
      ataglancePdfUrl: student.app?.documents?.ataglancePdfUrl || student.ataglancePdfUrl || '',
      bipPdfUrl: student.app?.documents?.bipPdfUrl || student.bipPdfUrl || '',
      bipFile: null,
      ataglanceFile: null,
      removeBipFile: false,
      removeAtaglanceFile: false
    }
  }

  // Form state - reactive object
  const form = reactive(initializeFormData(props.student || {}))

  // Watch for changes in student prop and update form
  watch(() => props.student, (newStudent) => {
    if (newStudent && Object.keys(newStudent).length > 0) {
      console.log('🔍 useStudentForm DEBUG - newStudent.app?.schedule?.periods:', JSON.stringify(newStudent?.app?.schedule?.periods, null, 2))
      console.log('🔍 useStudentForm DEBUG - newStudent.aeries?.schedule?.periods:', JSON.stringify(newStudent?.aeries?.schedule?.periods, null, 2))
      console.log('🔍 useStudentForm DEBUG - newStudent.schedule:', JSON.stringify(newStudent?.schedule, null, 2))
      
      // Update form with new student data
      const newFormData = initializeFormData(newStudent)
      Object.assign(form, newFormData)
      
      console.log('🔍 useStudentForm DEBUG - Processed form.schedule:', form.schedule)
    }
  }, { immediate: true, deep: true })

  // Watch for app settings changes and update form accordingly
  watch(() => appSettings.value, (newSettings) => {
    console.log('useStudentForm: App settings watcher triggered:', newSettings)
    
    // Update grade if app settings has grades and current grade is not in the list
    if (newSettings?.grades && newSettings.grades.length > 0) {
      if (!newSettings.grades.includes(form.grade)) {
        form.grade = newSettings.grades[0] || '7'
      }
    }
  }, { immediate: true, deep: true })

  // File handling functions
  const onFileChange = (event, key) => {
    form[key] = event.target.files[0] || null
  }

  const removeBipFile = (event) => {
    event.preventDefault()
    event.stopPropagation()
    form.removeBipFile = true
    form.bipFile = null
  }

  const removeAtaglanceFile = (event) => {
    event.preventDefault()
    event.stopPropagation()
    form.removeAtaglanceFile = true
    form.ataglanceFile = null
  }

  // File upload/delete utilities
  const uploadFile = async (file, path) => {
    if (!file) return null
    const fileRef = storageRef(storage, path)
    const snapshot = await uploadBytes(fileRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  const deleteFile = async (url) => {
    if (!url) return
    
    try {
      // Extract the file path from the URL
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split('/')
      const filePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/')
      
      // Decode the path
      const decodedPath = decodeURIComponent(filePath)
      
      // Delete from Firebase Storage
      const fileRef = storageRef(storage, decodedPath)
      await deleteObject(fileRef)
      console.log('File deleted successfully:', decodedPath)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Service provider utilities
  const providerFieldMap = {
    SLP: 'speechId',
    OT: 'otId',
    MH: 'mhId',
    PT: 'ptId',
    SC: 'scId',
    TR: 'trId',
    AUD: 'audId',
    VI: 'viId',
    AT: 'atId',
    DHH: 'dhhId',
    'O&M': 'omId',
    BIS: 'bisId',
    HN: 'hnId',
    SW: 'swId'
  }

  const DEFAULT_SERVICE_PROVIDERS = [
    { name: 'Speech-Language Therapy', abbreviation: 'SLP' },
    { name: 'Occupational Therapy', abbreviation: 'OT' },
    { name: 'Physical Therapy', abbreviation: 'PT' },
    { name: 'School Counseling', abbreviation: 'SC' },
    { name: 'School-Based Mental Health Services', abbreviation: 'MH' },
    { name: 'Transportation', abbreviation: 'TR' },
    { name: 'Audiology Services', abbreviation: 'AUD' },
    { name: 'Vision Services', abbreviation: 'VI' },
    { name: 'Assistive Technology', abbreviation: 'AT' },
    { name: 'Deaf and Hard of Hearing Services', abbreviation: 'DHH' },
    { name: 'Orientation and Mobility', abbreviation: 'O&M' },
    { name: 'Behavioral Intervention Services', abbreviation: 'BIS' },
    { name: 'Health/Nursing Services', abbreviation: 'HN' },
    { name: 'Social Work Services', abbreviation: 'SW' }
  ]

  const getProviderLabel = (abbr) => {
    // Try to find in App Settings first
    if (appSettings.value?.serviceProviders && Array.isArray(appSettings.value.serviceProviders)) {
      const found = (appSettings.value.serviceProvidersDetails || DEFAULT_SERVICE_PROVIDERS).find(s => s.abbreviation === abbr)
      if (found) return found.name + ' (' + abbr + ')'
    }
    // Fallback to default list
    const found = DEFAULT_SERVICE_PROVIDERS.find(s => s.abbreviation === abbr)
    return found ? found.name + ' (' + abbr + ')' : abbr
  }

  const getProviderUsers = (abbr) => {
    // Map provider abbreviations to user role keys
    const providerUserMap = {
      'SLP': 'speech',
      'OT': 'ot', 
      'MH': 'mh',
      'PT': 'pt',
      'SC': 'sc',
      'TR': 'tr',
      'AUD': 'aud',
      'VI': 'vi',
      'AT': 'at',
      'DHH': 'dhh',
      'O&M': 'om',
      'BIS': 'bis',
      'HN': 'hn',
      'SW': 'sw'
    }
    
    const userRoleKey = providerUserMap[abbr] || abbr.toLowerCase()
    return userRoles.value[userRoleKey] || []
  }

  // Form validation
  const validateForm = () => {
    // Validate SSID for new students
    if (props.mode === 'new' && (!form.ssid || form.ssid.trim() === '')) {
      alert('SSID is required. Please enter the student\'s State Student ID from your SIS (Aeries, SEIS, etc.).')
      return false
    }
    
    // Add more validation rules as needed
    return true
  }

  // Main submit handler
  const handleSubmit = async () => {
    try {
      console.log('Form submitted:', form)
      isSaving.value = true
      
      // Validate form
      if (!validateForm()) {
        isSaving.value = false
        return
      }
      
      // Compose services arrays
      const classServices = form.services.filter(s => s && s.includes(':'))
      
      // Compose schedule object
      const schedule = {}
      periods.value.forEach(p => {
        if (form.schedule[p]) schedule[p] = form.schedule[p]
      })
      
      console.log('Composed data:', { classServices, schedule })
      
      // Handle file uploads and removals
      let bipPdfUrl = props.student.bipPdfUrl || null
      let ataglancePdfUrl = props.student.ataglancePdfUrl || null
      
      // Handle BIP file
      if (form.removeBipFile && props.student.bipPdfUrl) {
        console.log('Removing BIP file...')
        await deleteFile(props.student.bipPdfUrl)
        bipPdfUrl = null
      } else if (form.bipFile) {
        console.log('Uploading BIP file...')
        const studentId = props.mode === 'edit' && props.student.id ? props.student.id : 'temp'
        bipPdfUrl = await uploadFile(form.bipFile, `students/${studentId}/bip.pdf`)
        console.log('BIP uploaded:', bipPdfUrl)
      }
      
      // Handle At-A-Glance file
      if (form.removeAtaglanceFile && props.student.ataglancePdfUrl) {
        console.log('Removing At-A-Glance file...')
        await deleteFile(props.student.ataglancePdfUrl)
        ataglancePdfUrl = null
      } else if (form.ataglanceFile) {
        console.log('Uploading At-A-Glance file...')
        const studentId = props.mode === 'edit' && props.student.id ? props.student.id : 'temp'
        ataglancePdfUrl = await uploadFile(form.ataglanceFile, `students/${studentId}/ataglance.pdf`)
        console.log('At-A-Glance uploaded:', ataglancePdfUrl)
      }
      
      // Compose payload - save to nested 'app' structure with categories
      const appData = {
        // Basic student information
        studentData: {
          firstName: form.firstName,
          lastName: form.lastName,
          grade: form.grade,
          plan: form.plan,
          caseManagerId: form.caseManagerId
        },
        
        // Important dates
        dates: {
          reviewDate: form.reviewDate,
          reevalDate: form.reevalDate,
          meetingDate: form.meetingDate
        },
        
        // Academic schedule and services
        schedule: {
          periods: schedule,
          classServices: classServices
        },
        
        // Service providers
        providers: {
          speechId: form.speechId,
          otId: form.otId,
          mhId: form.mhId,
          ptId: form.ptId,
          scId: form.scId,
          trId: form.trId,
          audId: form.audId,
          viId: form.viId,
          atId: form.atId,
          dhhId: form.dhhId,
          omId: form.omId,
          bisId: form.bisId,
          hnId: form.hnId,
          swId: form.swId
        },
        
        // Accommodations
        accommodations: {
          instruction: form.instruction,
          assessment: form.assessment
        },
        
        // Flags
        flags: {
          flag1: form.flag1,
          flag2: form.flag2
        },
        
        // Documents
        documents: {
          ataglancePdfUrl: ataglancePdfUrl,
          bipPdfUrl: bipPdfUrl
        }
      }
      
      console.log('Saving payload:', appData)
      
      // Create the full payload with nested structure
      const payload = {
        app: appData,
        updatedAt: serverTimestamp()
      }
      
      console.log('Saving payload:', payload)
      
      // Save to Firestore
      if (props.mode === 'edit' && props.student.id) {
        console.log('Updating existing student:', props.student.id)
        // Update existing student with merge to preserve other data
        await setDoc(doc(db, 'students', props.student.id), payload, { merge: true })
        console.log('Student updated successfully')
      } else {
        console.log('Adding new student')
        // For new students, SSID is required
        if (!form.ssid || form.ssid.trim() === '') {
          alert('SSID is required for new students')
          return
        }
        
        const ssid = form.ssid.trim()
        
        // Add SSID to the payload for internal reference
        payload.app.studentData.ssid = ssid
        
        // Use Firebase auto-generated ID for security
        const docRef = doc(collection(db, 'students'))
        payload.createdAt = serverTimestamp()
        await setDoc(docRef, payload)
        payload.id = docRef.id
        console.log('Student added successfully with ID:', docRef.id, 'SSID:', ssid)
      }
      
      emit('saved', payload)
      emit('close')
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Error saving student. Please try again.')
    } finally {
      isSaving.value = false
    }
  }

  // Return all the reactive state and functions
  return {
    // Form state
    form,
    isSaving,
    
    // App settings
    appSettings,
    appSettingsLoading,
    appSettingsError,
    
    // Computed properties
    periods,
    gradeOptions,
    availableClassServices,
    serviceProviders,
    customServiceProviders,
    userRoles,
    
    // File handling
    onFileChange,
    removeBipFile,
    removeAtaglanceFile,
    
    // Provider utilities
    providerFieldMap,
    getProviderLabel,
    getProviderUsers,
    
    // Form submission
    handleSubmit,
    validateForm
  }
} 