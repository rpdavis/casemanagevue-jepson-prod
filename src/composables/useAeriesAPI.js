import { ref, reactive } from 'vue'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getApp } from 'firebase/app'

export function useAeriesAPI() {
  const functions = getFunctions(getApp())
  
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const accessToken = ref('')
  const connectionStatus = ref('')
  const isError = ref(false)

  const connectionConfig = reactive({
    baseUrl: "encrypted",
    clientId: "encrypted", 
    clientSecret: "encrypted",
    selectedSchoolId: "school123",
    selectedClassIds: ["class1", "class2"],
    selectedApiTypes: {
      oneroster: true,
      nativeAeries: true
    },
    selectedEndpoints: ["/schools", "/students", "/api/special-education/students"]
  })

  const availableEndpoints = ref([
    // OneRoster endpoints
    { path: '/orgs', name: 'Organizations', description: 'District information' },
    { path: '/schools', name: 'Schools', description: 'School sites' },
    { path: '/academicSessions', name: 'Academic Sessions', description: 'Terms/semesters' },
    { path: '/grades', name: 'Grades', description: 'Grade levels' },
    { path: '/courses', name: 'Courses', description: 'Course catalog' },
    { path: '/classes', name: 'Classes', description: 'Sections (MST table)' },
    { path: '/teachers', name: 'Teachers', description: 'Teacher roster' },
    { path: '/students', name: 'Students', description: 'Student roster' },
    { path: '/enrollments', name: 'Enrollments', description: 'Student-to-class links' },
    
    // Special Education endpoints (to test)
    { path: '/api/special-education/students', name: 'SPED Students', description: 'Students with IEP/504 plans' },
    { path: '/api/special-education/ieps', name: 'IEP Records', description: 'IEP documents and data' },
    { path: '/api/special-education/504-plans', name: '504 Plans', description: '504 plan records' },
    { path: '/api/special-education/accommodations', name: 'Accommodations', description: 'Student accommodations' },
    { path: '/api/special-education/services', name: 'Services', description: 'Related services' },
    { path: '/api/special-education/case-managers', name: 'Case Managers', description: 'Case manager assignments' },
    
    // Alternative endpoint patterns
    { path: '/api/students/special-education', name: 'SPED Students Alt', description: 'Alternative SPED endpoint' },
    { path: '/api/iep/students', name: 'IEP Students', description: 'IEP student data' },
    { path: '/api/504/students', name: '504 Students', description: '504 student data' }
  ])

  const showStatus = (message, error = false) => {
    connectionStatus.value = message
    isError.value = error
    setTimeout(() => {
      connectionStatus.value = ''
      isError.value = false
    }, 5000)
  }

  const loadDemoCredentials = () => {
    connectionConfig.baseUrl = 'https://demo.aeries.net/aeries'
    connectionConfig.clientId = '1279e5c6b747b6d62b7c76db3a205d40eb7458e678a90493d537d5af6b953550'
    connectionConfig.clientSecret = '68019dbf8d8ba82980dd148eecc3977ac0d7f1f040d444225874c88eb80b9c1a'
    showStatus('Demo credentials loaded. Click Connect to test.')
  }

  const connect = async () => {
    if (!connectionConfig.baseUrl || !connectionConfig.clientId || !connectionConfig.clientSecret) {
      showStatus('Please fill in all connection fields.', true)
      return false
    }

    isConnecting.value = true
    showStatus('Connecting to Aeries API...')

    try {
      const getAeriesToken = httpsCallable(functions, 'getAeriesToken')
      const result = await getAeriesToken({
        baseUrl: connectionConfig.baseUrl,
        clientId: connectionConfig.clientId,
        clientSecret: connectionConfig.clientSecret
      })

      const data = result.data
      
      if (data.success && data.access_token) {
        accessToken.value = data.access_token
        isConnected.value = true
        showStatus('✅ Successfully connected to Aeries API!')
        return true
      } else {
        throw new Error('No access token received')
      }
    } catch (error) {
      const errorMessage = error.message || 'Connection failed'
      showStatus(`❌ Connection failed: ${errorMessage}`, true)
      console.error('Aeries API Connection Error:', error)
      return false
    } finally {
      isConnecting.value = false
    }
  }

  const disconnect = () => {
    isConnected.value = false
    accessToken.value = ''
    showStatus('Disconnected from Aeries API.')
  }

  const testEndpoint = async (endpointPath) => {
    if (!isConnected.value || !accessToken.value) {
      showStatus('Not connected to Aeries API.', true)
      return null
    }

    try {
      const testAeriesEndpoint = httpsCallable(functions, 'testAeriesEndpoint')
      const result = await testAeriesEndpoint({
        baseUrl: connectionConfig.baseUrl,
        endpoint: endpointPath,
        accessToken: accessToken.value
      })

      const data = result.data
      
      if (data.success) {
        showStatus(`✅ Successfully fetched data from ${endpointPath}`)
        return { data: data.data, responseTime: data.responseTime }
      } else {
        throw new Error(data.error || 'API call failed')
      }
    } catch (error) {
      const errorMessage = error.message || 'API call failed'
      showStatus(`❌ API call failed: ${errorMessage}`, true)
      console.error('Aeries API Test Error:', error)
      return { error: errorMessage }
    }
  }

  const testCustomEndpoint = async (endpointPath) => {
    if (!isConnected.value || !accessToken.value) {
      showStatus('Not connected to Aeries API.', true)
      return null
    }

    try {
      const testCustomAeriesEndpoint = httpsCallable(functions, 'testCustomAeriesEndpoint')
      const result = await testCustomAeriesEndpoint({
        baseUrl: connectionConfig.baseUrl,
        endpoint: endpointPath,
        accessToken: accessToken.value
      })

      const data = result.data
      
      if (data.success) {
        showStatus(`✅ Successfully fetched data from ${endpointPath}`)
        return { data: data.data, responseTime: data.responseTime }
      } else {
        return { error: data.error || 'API call failed' }
      }
    } catch (error) {
      const errorMessage = error.message || 'API call failed'
      showStatus(`❌ API call failed: ${errorMessage}`, true)
      console.error('Custom Aeries API Test Error:', error)
      return { error: errorMessage }
    }
  }

  const fetchStudents = async () => {
    const result = await testEndpoint('/students')
    return result
  }

  const fetchTeachers = async () => {
    const result = await testEndpoint('/teachers')
    return result
  }



  // Special Education specific methods
  const fetchSpecialEducationStudents = async () => {
    // Try multiple possible endpoints
    const endpoints = [
      '/api/special-education/students',
      '/api/students/special-education',
      '/api/iep/students',
      '/api/504/students'
    ]
    
    for (const endpoint of endpoints) {
      const result = await testCustomEndpoint(endpoint)
      if (result && !result.error) {
        return result
      }
    }
    return { error: 'No special education endpoints found' }
  }

  const fetchIEPRecords = async () => {
    const result = await testCustomEndpoint('/api/special-education/ieps')
    return result
  }

  const fetch504Plans = async () => {
    const result = await testCustomEndpoint('/api/special-education/504-plans')
    return result
  }

  const fetchAccommodations = async () => {
    const result = await testCustomEndpoint('/api/special-education/accommodations')
    return result
  }

  const fetchServices = async () => {
    const result = await testCustomEndpoint('/api/special-education/services')
    return result
  }

  const fetchCaseManagers = async () => {
    const result = await testCustomEndpoint('/api/special-education/case-managers')
    return result
  }

  // Test all special education endpoints
  const testAllSpecialEducationEndpoints = async () => {
    const results = {}
    const specialEdEndpoints = availableEndpoints.value.filter(ep => 
      ep.path.includes('special-education') || ep.path.includes('iep') || ep.path.includes('504')
    )
    
    for (const endpoint of specialEdEndpoints) {
      results[endpoint.path] = await testCustomEndpoint(endpoint.path)
    }
    
    return results
  }

  // Test OneRoster students endpoint for special education data
  const testOneRosterForSpecialEd = async () => {
    const result = await testEndpoint('/students')
    if (result && !result.error && result.data) {
      // Check if the response includes any special education fields
      const sampleStudent = result.data.students?.[0] || result.data[0]
      const hasSpecialEdFields = sampleStudent && (
        sampleStudent.specialEducation ||
        sampleStudent.iep ||
        sampleStudent.plan504 ||
        sampleStudent.disabilities ||
        sampleStudent.accommodations
      )
      
      return {
        success: true,
        hasSpecialEdFields,
        sampleStudent,
        message: hasSpecialEdFields 
          ? 'OneRoster includes special education data!' 
          : 'OneRoster does not include special education data'
      }
    }
    return result
  }

  // Try to get students with IEP/504 using query parameters
  const testStudentsWithSpecialEd = async () => {
    const queryParams = [
      '?filter=specialEducation=true',
      '?filter=iep=true',
      '?filter=plan504=true',
      '?filter=disabilities=*',
      '?filter=accommodations=*'
    ]
    
    const results = {}
    for (const param of queryParams) {
      results[param] = await testEndpoint(`/students${param}`)
    }
    
    return results
  }

  // Fetch schools from Aeries API
  async function fetchSchools({ baseUrl, accessToken }) {
    const functions = getFunctions()
    const testEndpoint = httpsCallable(functions, 'testAeriesEndpoint')
    // OneRoster endpoint for schools
    const endpoint = '/schools'
    const result = await testEndpoint({
      baseUrl,
      endpoint,
      accessToken
    })
    // OneRoster returns {orgs: [...]}, Aeries may return {schools: [...]}
    return result.data.data.orgs || result.data.data.schools || result.data.data || []
  }

  // Fetch classes for a school from Aeries API
  async function fetchClasses({ baseUrl, accessToken, schoolId }) {
    const functions = getFunctions()
    const testEndpoint = httpsCallable(functions, 'testAeriesEndpoint')
    // OneRoster endpoint for classes filtered by school
    const endpoint = `/classes?filter=school.sourcedId='${schoolId}'`
    const result = await testEndpoint({
      baseUrl,
      endpoint,
      accessToken
    })
    // OneRoster returns {classes: [...]}
    return result.data.data.classes || result.data.data || []
  }

  return {
    // State
    isConnected,
    isConnecting,
    accessToken,
    connectionStatus,
    isError,
    connectionConfig,
    availableEndpoints,
    
    // Methods
    showStatus,
    loadDemoCredentials,
    connect,
    disconnect,
    testEndpoint,
    testCustomEndpoint,
    fetchStudents,
    fetchTeachers,
    fetchSpecialEducationStudents,
    fetchIEPRecords,
    fetch504Plans,
    fetchAccommodations,
    fetchServices,
    fetchCaseManagers,
    testAllSpecialEducationEndpoints,
    testOneRosterForSpecialEd,
    testStudentsWithSpecialEd,
    fetchSchools,
    fetchClasses
  }
} 