<template>
  <div class="testing-links">
    <h2>Testing Links Configuration</h2>
    <p>Configure Google Sheets integration for testing data.</p>

        <!-- Simplified Controls -->
    <div class="sheet-controls">
      <p class="auth-info">Logged in as: <strong>{{ authStore.user?.email }}</strong></p>
      <p class="info-text">Create Google Sheets with your student data using one of the options below.</p>
    </div>

    <!-- Main Sheet Configuration -->
    <div class="sheet-config">
      <h3>Google Sheets Integration</h3>
      
      <!-- Debug Info -->
      <div class="debug-info">
        <p><strong>Debug:</strong> gapiLoaded: {{ gapiLoaded }}, currentSheetUrl: {{ currentSheetUrl || 'null' }}</p>
      </div>
      
      <!-- Create Sheet Options -->
      <div class="sheet-controls">
        <div class="create-options">
          <h4>Choose how to create your Google Sheet:</h4>
          
          <div class="option-card">
            <button 
              @click="createLinkedGoogleSheet" 
              class="btn-primary btn-large"
              :disabled="isCreating"
            >
              {{ isCreating ? 'Creating...' : '📊 Create Google Sheet with Data' }}
            </button>
            <p class="option-description">
              Downloads your student data as CSV and opens Google Sheets. Import the CSV to create a sheet with all your data.
            </p>
          </div>
          
          <div class="option-card">
            <button @click="createSimpleSheet" class="btn-secondary">
              📄 Create Blank Google Sheet
            </button>
            <p class="option-description">
              Opens a new blank Google Sheet that you can manually populate.
            </p>
          </div>
          
          <div class="option-card">
            <button @click="exportToCSV" class="btn-success">
              💾 Export to CSV Only
            </button>
            <p class="option-description">
              Downloads student data as a CSV file without opening Google Sheets.
            </p>
          </div>
        </div>
      </div>

      <!-- Sheet Structure Info -->
      <div class="sheet-structure">
        <h4>Sheet Structure</h4>
        <p>The Google Sheet will contain the following columns:</p>
        <ul>
          <li><strong>First Name</strong> - Student's first name</li>
          <li><strong>Last Name</strong> - Student's last name</li>
          <li><strong>Grade</strong> - Student's grade level</li>
          <li><strong>Case Manager</strong> - Student's case manager</li>
          <li><strong>Assessment Accommodations</strong> - Student's assessment accommodations</li>
          <li v-if="hasCustomTabs"><strong>Period</strong> - Class period (for custom tabs)</li>
          <li v-if="hasCustomTabs"><strong>Teacher</strong> - Class teacher (for custom tabs)</li>
        </ul>
      </div>
    </div>

    <!-- Custom Tabs Configuration -->
    <div class="custom-tabs-config">
      <h3>Custom Tabs Configuration</h3>
      
      <div class="add-tab-controls">
        <button 
          @click="showAddTabForm = true" 
          class="btn-secondary"
          :disabled="customTabs.length >= 5"
        >
          Add Custom Tab
        </button>
        <span v-if="customTabs.length >= 5" class="max-tabs-warning">
          Maximum 5 custom tabs allowed
        </span>
      </div>

      <!-- Add Tab Form -->
      <div v-if="showAddTabForm" class="add-tab-form">
        <h4>Create New Tab</h4>
        
        <div class="form-group">
          <label for="tabTitle">Tab Title:</label>
          <input 
            id="tabTitle"
            v-model="newTab.title" 
            type="text" 
            placeholder="Enter tab title"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Select Teachers:</label>
          <div class="teacher-checkboxes">
            <label v-for="teacher in availableTeachers" :key="teacher.id" class="checkbox-label">
              <input 
                type="checkbox" 
                :value="teacher.id" 
                v-model="newTab.selectedTeachers"
                @change="updateFilteredStudents"
              />
              {{ teacher.name }}
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button @click="createCustomTab" class="btn-primary" :disabled="!canCreateTab">
            Create Tab
          </button>
          <button @click="cancelAddTab" class="btn-secondary">Cancel</button>
        </div>
      </div>

      <!-- Existing Custom Tabs -->
      <div v-if="customTabs.length > 0" class="existing-tabs">
        <h4>Existing Custom Tabs</h4>
        <div v-for="(tab, index) in customTabs" :key="index" class="tab-item">
          <div class="tab-info">
            <strong>{{ tab.title }}</strong>
            <span class="tab-teachers">{{ tab.selectedTeachers.length }} teachers selected</span>
          </div>
          <button @click="deleteCustomTabLocal(index)" class="btn-danger btn-small">Delete</button>
        </div>
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="hasCustomTabs && filteredStudents.length > 0" class="preview-section">
      <h3>Preview: Students for Selected Teachers</h3>
      <div class="preview-table">
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Period</th>
              <th>Teacher</th>
              <th>Grade</th>
              <th>Case Manager</th>
              <th>Assessment Accommodations</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id">
              <td>{{ getDisplayValue(student, 'firstName') }}</td>
              <td>{{ getDisplayValue(student, 'lastName') }}</td>
              <td>{{ getStudentPeriod(student) }}</td>
              <td>{{ getStudentTeacher(student) }}</td>
              <td>{{ getDisplayValue(student, 'grade') }}</td>
              <td>{{ getUserName(getCaseManagerId(student)) }}</td>
              <td>{{ getDisplayValue(student, 'assessment') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/authStore'
import { getDisplayValue } from '@/utils/studentUtils'
import useGoogleSheetsClient from '@/composables/useGoogleSheetsClient'

// Get auth store
const authStore = useAuthStore()

// Import constants for testing
const API_KEY = 'AIzaSyDx1jbQT-FzgzjASFqVA2kbAHWJ_TeUzdY'
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
]

// Props
const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  userMap: {
    type: Object,
    default: () => ({})
  }
})

// Google Sheets composable
const {
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
  testAPI
} = useGoogleSheetsClient()

// Helper function to load Google API
function loadGapi() {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.gapi.load) {
      window.gapi.load('client:auth2', resolve)
      return
    }

    if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
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

// Reactive data
const isCreating = ref(false)
const showAddTabForm = ref(false)
const customTabs = ref([])
const newTab = ref({
  title: '',
  selectedTeachers: []
})
const filteredStudents = ref([])

// Computed properties
const hasCustomTabs = computed(() => customTabs.value.length > 0)

const availableTeachers = computed(() => {
  // Get all users who are teachers
  return Object.values(props.userMap).filter(user => user.role === 'teacher')
})

const canCreateTab = computed(() => {
  return newTab.value.title.trim() && newTab.value.selectedTeachers.length > 0
})

// Methods
const createLinkedSheet = async () => {
  isCreating.value = true
  try {
    const sheet = await createSheet('Student Testing Data')
    // Write main data
    const headers = [
      'First Name',
      'Last Name',
      'Grade',
      'Case Manager',
      'Assessment Accommodations'
    ]
    const dataRows = props.students.map(student => [
      getDisplayValue(student, 'firstName'),
      getDisplayValue(student, 'lastName'),
      getDisplayValue(student, 'grade'),
      getUserName(getCaseManagerId(student)),
      getDisplayValue(student, 'assessment')
    ])
    await addDataToSheet(sheet.spreadsheetId, 'Sheet1!A1:E' + (dataRows.length + 1), [headers, ...dataRows])
    alert('✅ Google Sheet created successfully!')
  } catch (error) {
    console.error('Create sheet error:', error)
    
    if (error.message && error.message.includes('OAuth authentication required')) {
      alert('🔐 OAuth Required: ' + error.message + '\n\nPlease:\n1. Click "Load Google API (with OAuth)"\n2. Sign in with Google\n3. Try creating the sheet again')
    } else {
      alert('❌ Failed to create Google Sheet: ' + error.message)
    }
  } finally {
    isCreating.value = false
  }
}

const unlinkSheet = () => {
  // Just clear the local state (does not delete the sheet)
  currentSheetId.value = ''
  customTabs.value = []
}

const createCustomTab = async () => {
  if (!canCreateTab.value) return
  const tab = {
    title: newTab.value.title,
    selectedTeachers: [...newTab.value.selectedTeachers]
  }
  try {
    // Add a new sheet (tab) and write data
    const headers = [
      'First Name',
      'Last Name',
      'Period',
      'Teacher',
      'Grade',
      'Case Manager',
      'Assessment Accommodations'
    ]
    // Filter students for selected teachers
    const filtered = props.students.filter(student => {
      const schedule = getStudentSchedule(student)
      if (!schedule) return false
      return Object.values(schedule).some(teacherId => tab.selectedTeachers.includes(teacherId))
    })
    const dataRows = filtered.map(student => {
      const schedule = getStudentSchedule(student)
      const period = getStudentPeriod(student, schedule, tab.selectedTeachers)
      const teacher = getStudentTeacher(student, schedule, tab.selectedTeachers)
      return [
        getDisplayValue(student, 'firstName'),
        getDisplayValue(student, 'lastName'),
        period,
        teacher,
        getDisplayValue(student, 'grade'),
        getUserName(getCaseManagerId(student)),
        getDisplayValue(student, 'assessment')
      ]
    })
    // Add the new sheet
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: currentSheetId.value,
      requests: [{
        addSheet: { properties: { title: tab.title } }
      }]
    })
    await addDataToSheet(currentSheetId.value, `${tab.title}!A1:G${dataRows.length + 1}`, [headers, ...dataRows])
    customTabs.value.push(tab)
    cancelAddTab()
  } catch (error) {
    alert('Failed to create custom tab. Please try again.')
    console.error(error)
  }
}

const deleteCustomTabLocal = async (index) => {
  const tab = customTabs.value[index]
  try {
    // Find the sheetId for the tab
    const spreadsheet = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: currentSheetId.value
    })
    const sheetToDelete = spreadsheet.result.sheets.find(sheet => sheet.properties.title === tab.title)
    if (!sheetToDelete) throw new Error('Sheet not found')
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: currentSheetId.value,
      requests: [{ deleteSheet: { sheetId: sheetToDelete.properties.sheetId } }]
    })
    customTabs.value.splice(index, 1)
  } catch (error) {
    alert('Failed to delete custom tab. Please try again.')
    console.error(error)
  }
}

const cancelAddTab = () => {
  showAddTabForm.value = false
  newTab.value = {
    title: '',
    selectedTeachers: []
  }
  filteredStudents.value = []
}

const updateFilteredStudents = () => {
  if (newTab.value.selectedTeachers.length === 0) {
    filteredStudents.value = []
    return
  }
  // Filter students who have the selected teachers in their schedule
  filteredStudents.value = props.students.filter(student => {
    const schedule = getStudentSchedule(student)
    if (!schedule) return false
    return Object.values(schedule).some(teacherId => newTab.value.selectedTeachers.includes(teacherId))
  })
}

const getStudentSchedule = (student) => {
  if (student.schedule) return student.schedule
  if (student.app?.schedule?.periods) return student.app.schedule.periods
  if (student.aeries?.schedule?.periods) return student.aeries.schedule.periods
  return null
}
const getStudentPeriod = (student, schedule, selectedTeachers) => {
  schedule = schedule || getStudentSchedule(student)
  if (!schedule) return '—'
  for (const [period, teacherId] of Object.entries(schedule)) {
    if ((selectedTeachers || newTab.value.selectedTeachers).includes(teacherId)) {
      return period
    }
  }
  return '—'
}
const getStudentTeacher = (student, schedule, selectedTeachers) => {
  schedule = schedule || getStudentSchedule(student)
  if (!schedule) return '—'
  for (const [period, teacherId] of Object.entries(schedule)) {
    if ((selectedTeachers || newTab.value.selectedTeachers).includes(teacherId)) {
      const teacher = props.userMap[teacherId]
      return teacher ? teacher.name : teacherId
    }
  }
  return '—'
}
const getCaseManagerId = (student) => {
  return student.app?.studentData?.caseManagerId || student.caseManagerId || student.casemanager_id
}
const getUserName = (userId) => {
  const user = props.userMap[userId]
  return user ? (user.name || user.email || userId) : userId
}

// Test function to check basic API access without OAuth
const testBasicAPI = async () => {
  try {
    console.log('Testing basic Google API access...')
    
    // Load the API script
    await loadGapi()
    console.log('✅ Google API script loaded')
    
    // Try to initialize without OAuth
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    })
    console.log('✅ Google API client initialized without OAuth')
    
    // Test if we can access the Sheets API
    try {
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: 'test'
      })
      console.log('✅ Sheets API accessible')
      alert('✅ Basic API test successful! The API key and Sheets API are working correctly.')
    } catch (error) {
      // 404 is expected for a non-existent spreadsheet - this means the API is working!
      if (error.status === 404) {
        console.log('✅ Sheets API accessible (404 expected for non-existent spreadsheet)')
        alert('✅ Basic API test successful! The API key and Sheets API are working correctly. The 404 error is expected for the test spreadsheet.')
      } else {
        throw error
      }
    }
    
  } catch (error) {
    console.error('❌ Basic API test failed:', error)
    if (error.status === 403) {
      alert('❌ API Key issue: Google Sheets API might not be enabled or API key lacks permissions.')
    } else {
      alert(`❌ API test failed: ${error.message}`)
    }
  }
}

// Simple direct initialization without OAuth
const initializeGoogleAPI = async () => {
  try {
    console.log('Initializing Google API directly...')
    
    // Load the API script
    await loadGapi()
    console.log('✅ Google API script loaded')
    
    // Initialize without OAuth
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    })
    console.log('✅ Google API client initialized successfully')
    
    // Update the reactive state
    gapiLoaded.value = true
    isSignedIn.value = false // No OAuth, so not signed in
    errorMessage.value = ''
    
    console.log('✅ Google API ready for use!')
    alert('✅ Google API initialized successfully! You can now create Google Sheets.')
    
  } catch (error) {
    console.error('❌ Google API initialization failed:', error)
    errorMessage.value = `Failed to initialize Google API: ${error.message}`
    alert(`❌ Failed to initialize Google API: ${error.message}`)
  }
}

// Test OAuth client configuration
const testOAuthClient = async () => {
  try {
    console.log('Testing OAuth client configuration...')
    
    // Load the API script
    await loadGapi()
    console.log('✅ Google API script loaded')
    
    // Try to initialize with OAuth
    await window.gapi.client.init({
      apiKey: API_KEY,
      clientId: '756483333257-kh1cv865e0buv0cv9g0v1h7ghq7s0e70.apps.googleusercontent.com',
      discoveryDocs: DISCOVERY_DOCS,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
    })
    console.log('✅ OAuth client initialized successfully')
    
    // Try to get auth instance
    const authInstance = window.gapi.auth2.getAuthInstance()
    console.log('✅ Auth instance created successfully')
    
    alert('✅ OAuth client configuration is working! You can now sign in with Google.')
    
  } catch (error) {
    console.error('❌ OAuth client test failed:', error)
    
    if (error.message && error.message.includes('idpiframe_initialization_failed')) {
      alert('❌ OAuth Client Configuration Error:\n\nPlease check your Google Cloud Console:\n1. Go to APIs & Services > Credentials\n2. Find your OAuth 2.0 Client ID\n3. Add http://localhost:5173 to Authorized JavaScript origins\n4. Remove any malformed entries')
    } else {
      alert(`❌ OAuth test failed: ${error.message}`)
    }
  }
}

// Create a blank Google Sheet
const createSimpleSheet = async () => {
  try {
    console.log('Opening Google Sheets to create new sheet...')
    
    // For a blank sheet, just open Google Sheets directly
    // This will open the Google Sheets homepage where user can create a new sheet
    window.open('https://sheets.google.com', '_blank')
    
    alert('✅ Google Sheets opened! Click "+" or "Blank" to create a new sheet.')
    
  } catch (error) {
    console.error('Open sheets error:', error)
    alert('❌ Failed to open Google Sheets: ' + error.message)
  }
}

// Create a linked Google Sheet with student data
const createLinkedGoogleSheet = async () => {
  isCreating.value = true
  
  try {
    console.log('Creating Google Sheet with student data...')
    
    // Prepare the data
    const headers = [
      'First Name',
      'Last Name',
      'Grade',
      'Case Manager',
      'Assessment Accommodations'
    ]
    
    const dataRows = props.students.map(student => [
      getDisplayValue(student, 'firstName') || '',
      getDisplayValue(student, 'lastName') || '',
      getDisplayValue(student, 'grade') || '',
      getUserName(getCaseManagerId(student)) || '',
      getDisplayValue(student, 'assessment') || ''
    ])
    
    // Create CSV content
    const csvContent = [headers, ...dataRows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    // Create a blob and download the CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    // Create a temporary link to download
    const link = document.createElement('a')
    link.href = url
    link.download = `student_data_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Open Google Sheets import page in new tab
    setTimeout(() => {
      window.open('https://sheets.new', '_blank')
    }, 500)
    
    alert(`✅ CSV Downloaded Successfully!\n\nNext steps:\n1. A new Google Sheet will open\n2. Click File → Import\n3. Upload the CSV file that was just downloaded\n4. Choose "Replace current sheet"\n5. Click "Import data"\n\nYour student data will be imported with ${dataRows.length} students!`)
    
  } catch (error) {
    console.error('Create sheet error:', error)
    alert(`❌ Failed to create sheet: ${error.message}`)
  } finally {
    isCreating.value = false
  }
}

// Alternative: Direct Google Sheets with pre-filled data
const createGoogleSheetWithData = () => {
  try {
    // Prepare the data as tab-separated values for URL
    const headers = ['First Name', 'Last Name', 'Grade', 'Case Manager', 'Assessment Accommodations']
    const dataRows = props.students.slice(0, 10).map(student => [ // Limit to 10 for URL length
      getDisplayValue(student, 'firstName') || '',
      getDisplayValue(student, 'lastName') || '',
      getDisplayValue(student, 'grade') || '',
      getUserName(getCaseManagerId(student)) || '',
      getDisplayValue(student, 'assessment') || ''
    ])
    
    // Create a simple table format
    const allData = [headers, ...dataRows]
    const tableData = allData.map(row => row.join('\t')).join('\n')
    
    // Encode for URL
    const encodedData = encodeURIComponent(tableData)
    
    // Create Google Sheets URL with pre-filled data (limited due to URL length constraints)
    // For full data, use the CSV approach
    window.open('https://sheets.new', '_blank')
    
    alert('✅ Opening Google Sheets!\n\nTo add your data:\n1. Copy the data from the CSV file\n2. Paste it into the new sheet\n\nNote: For large datasets, use the "Export to CSV" option.')
    
  } catch (error) {
    console.error('Error opening Google Sheets:', error)
    alert('Failed to open Google Sheets. Please try the CSV export option.')
  }
}

// Export student data to CSV for Google Sheets
const exportToCSV = () => {
  try {
    console.log('Exporting student data to CSV...')
    
    // Create CSV headers
    const headers = [
      'First Name',
      'Last Name', 
      'Grade',
      'Case Manager',
      'Assessment Accommodations'
    ]
    
    // Create CSV data rows
    const dataRows = props.students.map(student => [
      getDisplayValue(student, 'firstName'),
      getDisplayValue(student, 'lastName'),
      getDisplayValue(student, 'grade'),
      getUserName(getCaseManagerId(student)),
      getDisplayValue(student, 'assessment')
    ])
    
    // Combine headers and data
    const csvContent = [headers, ...dataRows]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n')
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'student_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    alert('✅ CSV file downloaded! Now:\n1. Go to Google Sheets\n2. Create a new sheet\n3. File > Import > Upload the CSV file\n4. Your student data will be imported!')
    
  } catch (error) {
    console.error('Export error:', error)
    alert('❌ Failed to export data: ' + error.message)
  }
}
</script>

<style scoped>
.testing-links {
  max-width: 1200px;
  margin: 0 auto;
}

.sheet-config, .custom-tabs-config, .preview-section {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.sheet-controls {
  margin-bottom: 1.5rem;
}

.auth-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
  color: #721c24;
}

.error-help {
  margin-top: 1rem;
  font-size: 0.9em;
}

.error-help ol {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
}

.error-help code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-message {
  color: #28a745;
  font-weight: 500;
}

.auth-note {
  margin: 0;
  font-size: 0.85em;
  color: #6c757d;
  font-style: italic;
}

.debug-info {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9em;
}

.debug-info p {
  margin: 0;
}

.api-not-loaded, .api-loaded {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.api-not-loaded p, .api-loaded p {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.api-loaded {
  background: #d4edda;
  border-color: #c3e6cb;
}

.oauth-note {
  margin-top: 0.5rem;
  font-size: 0.9em;
  color: #6c757d;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8em;
}

.auth-notice p {
  margin: 0 0 1rem 0;
  color: #856404;
}

.linked-sheet-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
}

.sheet-url {
  flex: 1;
}

.sheet-url small {
  color: #6c757d;
  font-size: 0.8em;
}

.sheet-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  margin: 0.5rem 0;
}

.sheet-link:hover {
  text-decoration: underline;
}

.sheet-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sheet-structure ul {
  margin-left: 1.5rem;
}

.sheet-structure li {
  margin-bottom: 0.5rem;
}

.add-tab-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.max-tabs-warning {
  color: #dc3545;
  font-size: 0.9rem;
}

.add-tab-form {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.teacher-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.existing-tabs {
  margin-top: 1.5rem;
}

.tab-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.tab-teachers {
  color: #6c757d;
  font-size: 0.9rem;
  margin-left: 1rem;
}

.preview-table {
  overflow-x: auto;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.preview-table th,
.preview-table td {
  border: 1px solid #dee2e6;
  padding: 0.5rem;
  text-align: left;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-success {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-success:hover {
  background: #218838;
}

.csv-export-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #dee2e6;
}

.sign-in-required {
  text-align: center;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.warning-text {
  color: #856404;
  margin-bottom: 1rem;
  font-weight: 500;
}

.oauth-explanation {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.oauth-explanation p {
  margin: 0.5rem 0;
  color: #856404;
}

.auth-info {
  margin-bottom: 1rem;
  color: #495057;
}

.button-note {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.85em;
  color: #6c757d;
  font-style: italic;
}

.info-text {
  color: #495057;
  margin-bottom: 1rem;
}

.create-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

.option-card button {
  width: 100%;
  margin-bottom: 0.5rem;
}

.option-description {
  margin: 0;
  font-size: 0.9em;
  color: #6c757d;
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}
</style> 