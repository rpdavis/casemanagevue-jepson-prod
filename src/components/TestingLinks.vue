<template>
  <div class="testing-links-container">
    <h3>Testing Links & Google Sheets Integration</h3>
    
    <!-- Google Sheets Integration Section -->
    <div class="sheets-section">
      <h4>Google Sheets Integration</h4>
      
      <!-- Linked Sheet Status -->
      <div v-if="linkedSheetId" class="linked-sheet-status">
        <div class="status-card success">
          <h5>📊 Linked Google Sheet</h5>
          <p>Your student data is synced to Google Sheets</p>
          <button @click="openGoogleSheet" class="sheet-link">
            Open Google Sheet →
          </button>
          <div class="sync-info">
            <span v-if="lastSyncTime">Last synced: {{ formatTime(lastSyncTime) }}</span>
            <span v-if="syncStatus === 'syncing'" class="syncing">🔄 Syncing...</span>
            <span v-else-if="syncStatus === 'success'" class="success">✅ Synced</span>
            <span v-else-if="syncStatus === 'error'" class="error">❌ {{ syncMessage }}</span>
          </div>
          <div class="auto-sync-info">
            <span class="auto-sync-badge">
              <span class="pulse"></span>
              Auto-sync enabled
            </span>
            <p class="auto-sync-description">
              Changes to student data, accommodations, and services are automatically synced to your Google Sheet.
            </p>
          </div>
          <div class="sheet-actions">
            <button @click="syncNow" :disabled="syncStatus === 'syncing'" class="btn-sync">
              Sync Now
            </button>
            <button @click="unlinkSheet" class="btn-unlink">
              Unlink Sheet
            </button>
          </div>
        </div>
        
        <!-- Custom Tabs Section -->
        <div class="custom-tabs-config">
          <h5>Custom Teacher Tabs</h5>
          <p>Create custom tabs with data filtered by specific teachers</p>
          
          <!-- Add Tab Button -->
          <div class="add-tab-controls">
            <button 
              @click="showAddTabForm = !showAddTabForm" 
              :disabled="customTabs.length >= maxCustomTabs"
              class="btn-primary"
            >
              + Add Custom Tab
            </button>
            <span v-if="customTabs.length >= maxCustomTabs" class="max-tabs-warning">
              Maximum of {{ maxCustomTabs }} custom tabs allowed
            </span>
          </div>
          
          <!-- Add Tab Form -->
          <div v-if="showAddTabForm" class="add-tab-form">
            <div class="form-group">
              <label>Tab Name</label>
              <input 
                v-model="newTabName" 
                type="text" 
                class="form-input" 
                placeholder="e.g., Math Teachers"
                maxlength="30"
              >
            </div>
            
            <div class="form-group">
              <label>Select Teachers</label>
              <div class="teacher-checkboxes">
                <label 
                  v-for="teacher in availableTeachers" 
                  :key="teacher.id"
                  class="checkbox-label"
                >
                  <input 
                    type="checkbox" 
                    :value="teacher.id"
                    v-model="selectedTeachers"
                  >
                  {{ teacher.name }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>Exclude Periods (Optional)</label>
              <div class="period-checkboxes">
                <label 
                  v-for="period in availablePeriods" 
                  :key="period.value"
                  class="checkbox-label"
                >
                  <input 
                    type="checkbox" 
                    :value="period.value"
                    v-model="selectedExcludedPeriods"
                  >
                  {{ period.label }}
                </label>
              </div>
            </div>
            
            <!-- Preview -->
            <div v-if="selectedTeachers.length > 0" class="preview-section">
              <h6>Preview ({{ filteredStudentsPreview.length }} students)</h6>
              <div class="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Grade</th>
                      <th>Period</th>
                      <th>Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in filteredStudentsPreview.slice(0, 5)" :key="student.id">
                      <td>{{ student.firstName }} {{ student.lastName }}</td>
                      <td>{{ student.grade || student.app?.studentData?.grade }}</td>
                      <td>
                        <span v-for="(period, idx) in getStudentTeacherPeriods(student, selectedTeachers, selectedExcludedPeriods)" :key="idx">
                          {{ period.period }}<span v-if="idx < getStudentTeacherPeriods(student, selectedTeachers, selectedExcludedPeriods).length - 1">, </span>
                        </span>
                      </td>
                      <td>
                        <span v-for="(period, idx) in getStudentTeacherPeriods(student, selectedTeachers, selectedExcludedPeriods)" :key="idx">
                          {{ period.teacherName }}<span v-if="idx < getStudentTeacherPeriods(student, selectedTeachers, selectedExcludedPeriods).length - 1">, </span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="filteredStudentsPreview.length > 5" class="preview-note">
                  ... and {{ filteredStudentsPreview.length - 5 }} more students
                </p>
              </div>
            </div>
            
            <div class="form-actions">
              <button @click="addCustomTab" class="btn-primary">
                Create Tab
              </button>
              <button @click="showAddTabForm = false; selectedTeachers = []; selectedExcludedPeriods = []; newTabName = ''" class="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
          
          <!-- Existing Tabs -->
          <div v-if="customTabs.length > 0" class="existing-tabs">
            <h6>Current Custom Tabs</h6>
            <div v-for="tab in customTabs" :key="tab.id" class="tab-item">
              <div>
                <strong>{{ tab.name }}</strong>
                <span class="tab-teachers">
                  {{ tab.teachers.length }} teacher(s), {{ tab.studentCount }} students
                </span>
              </div>
              <button @click="removeCustomTab(tab.id)" class="btn-danger btn-small">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Create Linked Sheet -->
      <div v-else class="create-sheet-section">
        <h5>Create a Linked Google Sheet</h5>
        <p>Link your student data to a Google Sheet that automatically updates when changes are made.</p>
        <div class="features-list">
          <div class="feature">
            <span class="feature-icon">🔄</span>
            <span>Auto-syncs when students are added or updated</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📝</span>
            <span>Updates accommodations and services in real-time</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🔗</span>
            <span>Maintains a live connection to your data</span>
          </div>
        </div>
        <button @click="createLinkedGoogleSheet" class="btn-primary">
          🔗 Create & Link Google Sheet
        </button>
      </div>
      
      <!-- Alternative Options -->
      <div class="alternative-options">
        <h5>Other Export Options</h5>
        <div class="button-group">
          <button @click="createGoogleSheetWithData" class="btn-secondary">
            📊 Create Google Sheet with Data (One-time)
          </button>
          <button @click="createBlankGoogleSheet" class="btn-secondary">
            📄 Create Blank Google Sheet
          </button>
          <button @click="exportToCSV" class="btn-secondary">
            💾 Export to CSV Only
          </button>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import useStudents from '@/composables/useStudents'
import { useGoogleSheetsRealtime } from '@/composables/useGoogleSheetsRealtime'
import useUsers from '@/composables/useUsers'
import { useAppSettings } from '@/composables/useAppSettings'

// Composables
const { students, fetchStudents } = useStudents()
const { userList: users, fetchUsers } = useUsers()
const { appSettings, loadAppSettings } = useAppSettings()
const { 
  linkedSheetId,
  linkedSheetUrl,
  lastSyncTime,
  syncStatus,
  syncMessage,
  initializeGoogleAuth,
  createLinkedSheet,
  updateSheetData,
  createCustomTab,
  deleteCustomTab,
  unlinkSheet,
  checkSheetConnection
} = useGoogleSheetsRealtime()

// Custom tabs state
const customTabs = ref([])
const showAddTabForm = ref(false)
const newTabName = ref('')
const selectedTeachers = ref([])
const selectedExcludedPeriods = ref([])
const maxCustomTabs = 5

// Get available periods from app settings
const availablePeriods = computed(() => {
  if (appSettings.value?.numPeriods && appSettings.value?.periodLabels) {
    return appSettings.value.periodLabels.slice(0, appSettings.value.numPeriods).map((label, index) => ({
      value: index.toString(), // Use index (0, 1, 2, 3, 4, 5, 6) instead of period number
      label: label,
      periodIndex: index // Keep track of the actual index
    }))
  }
  
  // Fallback to default periods
  return [
    { value: '0', label: 'Per1', periodIndex: 0 },
    { value: '1', label: 'Per2', periodIndex: 1 },
    { value: '2', label: 'Per3', periodIndex: 2 },
    { value: '3', label: 'Per4', periodIndex: 3 },
    { value: '4', label: 'Per5', periodIndex: 4 },
    { value: '5', label: 'Per6', periodIndex: 5 },
    { value: '6', label: 'Per7', periodIndex: 6 }
  ]
})

// Get unique teachers from student schedules
const availableTeachers = computed(() => {
  const teacherSet = new Set()
  
  console.log('🔍 Finding teachers from students:', students.value.length)
  
  students.value.forEach(student => {
    // Check aeries schedule structure first
    if (student.aeries?.schedule) {
      Object.values(student.aeries.schedule).forEach(period => {
        if (period && period.teacherId) {
          console.log('🔍 Found teacher ID in aeries.schedule:', period.teacherId)
          teacherSet.add(String(period.teacherId))
        }
      })
    }
    
    // Check app.schedule.periods structure
    if (student.app?.schedule?.periods) {
      Object.values(student.app.schedule.periods).forEach(teacherId => {
        if (teacherId) {
          console.log('🔍 Found teacher ID in app.schedule.periods:', teacherId)
          teacherSet.add(String(teacherId))
        }
      })
    }
    
    // Also check for direct period properties (from CSV import)
    for (let i = 1; i <= 7; i++) {
      const teacherIdField = `period${i}TeacherId`
      const teacherId = student[teacherIdField] || 
                       student.aeries?.[teacherIdField] ||
                       student.app?.[teacherIdField]
      if (teacherId) {
        console.log('🔍 Found teacher ID in', teacherIdField, ':', teacherId)
        teacherSet.add(String(teacherId))
      }
    }
  })
  
  console.log('🔍 Unique teacher IDs found:', Array.from(teacherSet))
  console.log('🔍 Users available:', users.value.length)
  
  // Convert to array and map to user objects
  // Handle both email-based IDs and numeric aeriesIds
  return Array.from(teacherSet).map(teacherId => {
    // First try to find by ID (email format)
    let user = users.value.find(u => u.id === teacherId)
    
    // If not found and teacherId is numeric, try to find by aeriesId
    if (!user && /^\d+$/.test(teacherId)) {
      user = users.value.find(u => u.aeriesId === teacherId)
    }
    
    return {
      id: teacherId,
      name: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${teacherId}`,
      actualUserId: user ? user.id : null
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
})

// Get students for selected teachers
const getStudentsForTeachers = (teacherIds, excludedPeriods = []) => {
  // Helper function to check if a period should be excluded
  const isPeriodExcluded = (periodKey) => {
    // Find the index of this period in the default configuration
    let periodIndex = -1
    
    // Handle numeric periods (1, 2, 3, etc.)
    if (/^\d+$/.test(periodKey)) {
      periodIndex = parseInt(periodKey) - 1 // Convert 1-based to 0-based
    }
    // Handle "SH" period
    else if (periodKey === 'SH') {
      periodIndex = 6 // SH is at index 6
    }
    // Handle "Per1", "Per2", etc. format
    else if (periodKey.startsWith('Per')) {
      const num = periodKey.replace('Per', '')
      if (/^\d+$/.test(num)) {
        periodIndex = parseInt(num) - 1
      }
    }
    
    return excludedPeriods.includes(periodIndex.toString())
  }

  return students.value.filter(student => {
    // Only include students with separate setting flag
    const hasSeparateSetting = student.app?.flags?.flag1 || student.flag1 || false
    if (!hasSeparateSetting) {
      return false
    }
    // Check aeries schedule structure
    if (student.aeries?.schedule) {
      const scheduleEntries = Object.entries(student.aeries.schedule)
      for (let i = 0; i < scheduleEntries.length; i++) {
        const [periodKey, period] = scheduleEntries[i]
        if (period && period.teacherId && teacherIds.includes(String(period.teacherId))) {
          // Use the period key mapping instead of array index
          if (!isPeriodExcluded(periodKey)) {
            return true
          }
        }
      }
    }
    
    // Check app.schedule.periods structure
    if (student.app?.schedule?.periods) {
      const periodEntries = Object.entries(student.app.schedule.periods)
      for (let i = 0; i < periodEntries.length; i++) {
        const [periodKey, teacherId] = periodEntries[i]
        if (teacherId && teacherIds.includes(String(teacherId))) {
          // Use the period key mapping instead of array index
          if (!isPeriodExcluded(periodKey)) {
            return true
          }
        }
      }
    }
    
    // Also check for direct period properties (from CSV import)
    // For this, we need to check each period index (0-6 maps to period1-period7)
    for (let i = 0; i < 7; i++) {
      const teacherIdField = `period${i + 1}TeacherId` // period1TeacherId, period2TeacherId, etc.
      const teacherId = student[teacherIdField] || 
                       student.aeries?.[teacherIdField] ||
                       student.app?.[teacherIdField]
      if (teacherId && teacherIds.includes(String(teacherId))) {
        // Use the index (i) for CSV fields
        if (!excludedPeriods.includes(i.toString())) {
          return true
        }
      }
    }
    
    return false
  })
}

// Preview of filtered students
const filteredStudentsPreview = computed(() => {
  if (selectedTeachers.value.length === 0) return []
  return getStudentsForTeachers(selectedTeachers.value, selectedExcludedPeriods.value)
})

// Add custom tab
const addCustomTab = async () => {
  if (!newTabName.value.trim() || selectedTeachers.value.length === 0) {
    alert('Please enter a tab name and select at least one teacher')
    return
  }
  
  if (customTabs.value.length >= maxCustomTabs) {
    alert(`Maximum of ${maxCustomTabs} custom tabs allowed`)
    return
  }
  
  try {
    // Get the filtered students for these teachers
    const filteredStudents = getStudentsForTeachers(selectedTeachers.value, selectedExcludedPeriods.value)
    
    // Create the tab in Google Sheets
    const result = await createCustomTab(
      newTabName.value.trim(),
      filteredStudents,
      selectedTeachers.value,
      users.value, // Pass users data for teacher name lookup
      selectedExcludedPeriods.value // Pass excluded periods
    )
    
    // Store the tab info locally with the sheet ID
    const tab = {
      id: Date.now().toString(),
      name: newTabName.value.trim(),
      teachers: [...selectedTeachers.value],
      studentCount: result.rowCount,
      sheetId: result.sheetId // Store the Google Sheet tab ID
    }
    
    customTabs.value.push(tab)
    
    // Reset form
    newTabName.value = ''
    selectedTeachers.value = []
    selectedExcludedPeriods.value = []
    showAddTabForm.value = false
    
    console.log('Custom tab added:', tab)
    alert(`Custom tab "${tab.name}" created successfully with ${result.rowCount} student entries!`)
    
  } catch (error) {
    console.error('Failed to create custom tab:', error)
    alert('Failed to create custom tab in Google Sheet. Please try again.')
  }
}

// Remove custom tab
const removeCustomTab = async (tabId) => {
  const tab = customTabs.value.find(t => t.id === tabId)
  if (!tab) return
  
  if (confirm(`Are you sure you want to remove the "${tab.name}" tab?`)) {
    try {
      // Delete from Google Sheets if we have a sheet ID
      if (tab.sheetId) {
        await deleteCustomTab(tab.sheetId)
      }
      
      // Remove from local list
      customTabs.value = customTabs.value.filter(t => t.id !== tabId)
      
      console.log('Custom tab removed:', tabId)
      alert(`Tab "${tab.name}" removed successfully.`)
      
    } catch (error) {
      console.error('Failed to delete custom tab:', error)
      alert('Failed to delete tab from Google Sheet. You may need to delete it manually.')
      // Still remove from local list even if Google Sheets deletion failed
      customTabs.value = customTabs.value.filter(t => t.id !== tabId)
    }
  }
}

// Get student's periods for selected teachers
const getStudentTeacherPeriods = (student, teacherIds, excludedPeriods = []) => {
  const periods = []
  
  // Helper function to check if a period should be excluded
  const isPeriodExcluded = (periodKey) => {
    // Find the index of this period in the default configuration
    let periodIndex = -1
    
    // Handle numeric periods (1, 2, 3, etc.)
    if (/^\d+$/.test(periodKey)) {
      periodIndex = parseInt(periodKey) - 1 // Convert 1-based to 0-based
    }
    // Handle "SH" period
    else if (periodKey === 'SH') {
      periodIndex = 6 // SH is at index 6
    }
    // Handle "Per1", "Per2", etc. format
    else if (periodKey.startsWith('Per')) {
      const num = periodKey.replace('Per', '')
      if (/^\d+$/.test(num)) {
        periodIndex = parseInt(num) - 1
      }
    }
    
    return excludedPeriods.includes(periodIndex.toString())
  }
  
  // Check aeries schedule structure
  if (student.aeries?.schedule) {
    const scheduleEntries = Object.entries(student.aeries.schedule)
    for (let i = 0; i < scheduleEntries.length; i++) {
      const [periodKey, period] = scheduleEntries[i]
      if (period && period.teacherId && teacherIds.includes(String(period.teacherId))) {
        // Only include if period is not excluded (using period key mapping)
        if (!isPeriodExcluded(periodKey)) {
          // Find user by aeriesId or ID
          let user = users.value.find(u => u.id === String(period.teacherId))
          if (!user && /^\d+$/.test(period.teacherId)) {
            user = users.value.find(u => u.aeriesId === String(period.teacherId))
          }
          
          // Get the actual period label from app settings
          const periodLabel = appSettings.value?.periodLabels?.[i] || `Period ${i + 1}`
          
          periods.push({
            period: periodLabel,
            teacherName: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${period.teacherId}`
          })
        }
      }
    }
  }
  
  // Check app.schedule.periods structure
  if (student.app?.schedule?.periods) {
    const periodEntries = Object.entries(student.app.schedule.periods)
    for (let i = 0; i < periodEntries.length; i++) {
      const [periodKey, teacherId] = periodEntries[i]
      if (teacherId && teacherIds.includes(String(teacherId))) {
        // Only include if period is not excluded (using period key mapping)
        if (!isPeriodExcluded(periodKey)) {
          const user = users.value.find(u => u.id === String(teacherId))
          
          // Get the actual period label from app settings
          const periodLabel = appSettings.value?.periodLabels?.[i] || `Period ${i + 1}`
          
          periods.push({
            period: periodLabel,
            teacherName: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${teacherId}`
          })
        }
      }
    }
  }
  
  // Also check for direct period properties (from CSV import)
  for (let i = 0; i < 7; i++) {
    const teacherIdField = `period${i + 1}TeacherId`
    const teacherId = student[teacherIdField] || 
                     student.aeries?.[teacherIdField] ||
                     student.app?.[teacherIdField]
    
    if (teacherId && teacherIds.includes(String(teacherId))) {
      // Only include if period is not excluded (using index for CSV fields)
      if (!excludedPeriods.includes(i.toString())) {
        // Find user by aeriesId or ID
        let user = users.value.find(u => u.id === String(teacherId))
        if (!user && /^\d+$/.test(teacherId)) {
          user = users.value.find(u => u.aeriesId === String(teacherId))
        }
        
        // Get the actual period label from app settings
        const periodLabel = appSettings.value?.periodLabels?.[i] || `Period ${i + 1}`
        
        periods.push({
          period: periodLabel,
          teacherName: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${teacherId}`
        })
      }
    }
  }
  
  return periods
}



// Initialize Google Auth on mount
onMounted(async () => {
  try {
    // Clear any old sheet ID that might be causing 403 errors
    const oldSheetId = localStorage.getItem('casemanage_linked_sheet_id')
    if (oldSheetId && oldSheetId.startsWith('1XSL0Sl7')) {
      console.log('Clearing old sheet ID that was causing 403 errors')
      localStorage.removeItem('casemanage_linked_sheet_id')
    }
    
    // Fetch students and users data first
    await Promise.all([
      fetchStudents(),
      fetchUsers(),
      loadAppSettings()
    ])
    console.log('Students loaded:', students.value.length)
    console.log('Users loaded:', users.value.length)
    console.log('App settings loaded:', appSettings.value)
    
    await initializeGoogleAuth()
    
    // Check if we have a linked sheet
    if (linkedSheetId.value) {
      const isConnected = await checkSheetConnection()
      if (isConnected) {
        // Do an initial sync
        await syncNow()
        // Start the hourly auto-sync
        setupAutoSync()
      }
    }
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error)
  }
})

// Auto-sync every hour if there have been changes
let autoSyncInterval = null
let hasChanges = false
let lastStudentCount = 0

// Watch for student changes to track if sync is needed
watch(() => students.value, (newStudents, oldStudents) => {
  if (newStudents && oldStudents && newStudents !== oldStudents) {
    hasChanges = true
    console.log('📝 Student data changed, will sync on next interval')
  }
  
  // Update count for change detection
  lastStudentCount = newStudents?.length || 0
}, { deep: true })

// Set up hourly auto-sync interval
const setupAutoSync = () => {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval)
  }
  
  // Auto-sync every hour (3600000 ms) if there are changes
  // To change frequency:
  // - Every 30 minutes: 1800000 ms
  // - Every 2 hours: 7200000 ms  
  // - Every 6 hours: 21600000 ms
  // - Once per day: 86400000 ms
  autoSyncInterval = setInterval(async () => {
    if (linkedSheetId.value && hasChanges && syncStatus.value !== 'syncing') {
      try {
        console.log('🔄 Hourly auto-sync starting...')
        await syncNow()
        hasChanges = false // Reset change flag after successful sync
        console.log('✅ Hourly auto-sync completed')
      } catch (error) {
        console.error('❌ Hourly auto-sync failed:', error)
        // Don't reset hasChanges so it will try again next hour
      }
    }
  }, 3600000) // 1 hour = 3600000 ms
}

// Cleanup auto-sync interval on unmount
onUnmounted(() => {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval)
  }
})

// Create and link a Google Sheet
const createLinkedGoogleSheet = async () => {
  try {
    await createLinkedSheet(students.value, users.value)
    // Start the hourly auto-sync for the new sheet
    setupAutoSync()
  } catch (error) {
    console.error('Failed to create linked sheet:', error)
    alert('Failed to create Google Sheet. Please make sure you are signed in to Google.')
  }
}

// Sync the linked sheet
const syncNow = async () => {
  if (!linkedSheetId.value || syncStatus.value === 'syncing') return
  
  try {
    await updateSheetData(students.value, users.value)
  } catch (error) {
    console.error('Failed to sync sheet:', error)
    alert('Failed to sync sheet. Please try again.')
  }
}

// Force open sheet in new tab (prevent redirect issues)
const openGoogleSheet = () => {
  if (linkedSheetUrl.value) {
    // Use window.open with specific parameters to ensure new tab
    const newWindow = window.open(linkedSheetUrl.value, '_blank', 'noopener,noreferrer')
    if (!newWindow) {
      // Fallback if popup blocked
      window.location.href = linkedSheetUrl.value
    }
  }
}

// One-time export with data
const createGoogleSheetWithData = () => {
  const csvContent = generateCSV()
  downloadCSV(csvContent, 'student_data.csv')
  window.open('https://sheets.new', '_blank')
}

// Create blank sheet
const createBlankGoogleSheet = () => {
  window.open('https://sheets.new', '_blank')
}

// Export to CSV only
const exportToCSV = () => {
  const csvContent = generateCSV()
  downloadCSV(csvContent, 'student_data_export.csv')
}

// Generate CSV content
const generateCSV = () => {
  const headers = [
    'Student ID',
    'First Name', 
    'Last Name',
    'Grade',
    'Case Manager',
    'Assessment Accommodations',
    'Services'
  ]
  
  const rows = students.value.map(student => {
    const firstName = student.firstName || student.app?.studentData?.firstName || ''
    const lastName = student.lastName || student.app?.studentData?.lastName || ''
    const grade = student.grade || student.app?.studentData?.grade || ''
    const caseManager = student.caseManagerId || student.app?.studentData?.caseManagerId || ''
    
    const assessmentAccom = student.app?.accommodations?.assessment || []
    const services = student.app?.classServices || []
    
    return [
      student.id || '',
      firstName,
      lastName,
      grade,
      caseManager,
      Array.isArray(assessmentAccom) ? assessmentAccom.join('; ') : assessmentAccom,
      Array.isArray(services) ? services.map(s => s.name || s).join('; ') : services
    ]
  })
  
  const allRows = [headers, ...rows]
  return allRows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
       .join(',')
  ).join('\n')
}

// Download CSV helper
const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Format time helper
const formatTime = (date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.testing-links-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.sheets-section, .links-section {
  margin-bottom: 3rem;
}

.sheets-section h4, .links-section h4 {
  margin-bottom: 1.5rem;
  color: #333;
}

.status-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.status-card.success {
  border-color: #c3e6cb;
  background-color: #f8f9fa;
}

.create-sheet-section {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.feature-icon {
  font-size: 1.5rem;
}

.sync-info {
  margin: 1rem 0;
  font-size: 0.9rem;
  color: #6c757d;
}

.syncing {
  color: #007bff;
}

.success {
  color: #28a745;
}

.error {
  color: #dc3545;
}

.auto-sync-info {
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.auto-sync-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #2e7d32;
}

.pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.auto-sync-description {
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  color: #495057;
}

.sheet-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-sync, .btn-unlink {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-sync {
  background: #1a73e8;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: #1557b0;
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-unlink {
  background: #dc3545;
  color: white;
}

.btn-unlink:hover {
  background: #c82333;
}

.alternative-options {
  margin-top: 2rem;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.test-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
}

.test-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #007bff;
}

.link-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.link-text {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.link-category {
  font-size: 0.85rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-note {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  font-style: italic;
}

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

.teacher-checkboxes,
.period-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.period-checkboxes {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
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

/* Google Sheets Section */
.sheets-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.sheets-section h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.2em;
}

.linked-sheet-status {
  margin: 15px 0;
}

.status-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.status-card.success {
  border-left: 4px solid #34a853;
}

.status-card h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1em;
}

.sheet-link {
  display: inline-block;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 500;
  margin: 10px 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
}

.sheet-link:hover {
  text-decoration: underline;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 15px 0;
  font-size: 0.9em;
  color: #666;
}

.sync-info .syncing {
  color: #fbbc04;
}

.sync-info .success {
  color: #34a853;
}

.sync-info .error {
  color: #ea4335;
}

.sheet-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-sync,
.btn-unlink {
  padding: 8px 16px;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  background: #1a73e8;
  color: white;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
}

.btn-unlink {
  border: 1px solid #dadce0;
  background: white;
  color: #ea4335;
}

.btn-sync:hover:not(:disabled) {
  background: #1a73e8;
  border-color: #1a73e8;
  color: white;
}

.btn-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-unlink {
  color: #ea4335;
}

.btn-unlink:hover {
  background: #fef1f0;
  border-color: #ea4335;
}

.create-sheet-section {
  background: white;
  border: 2px dashed #dadce0;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
}

.create-sheet-section h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.create-sheet-section p {
  color: #666;
  margin: 0 0 20px 0;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1557b0;
}

.alternative-options {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.alternative-options h5 {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 1em;
}

.links-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.test-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
}

.test-link:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.link-icon {
  font-size: 1.2em;
  color: #6c757d;
}

.link-text {
  font-weight: 500;
  color: #333;
}

.link-category {
  font-size: 0.8em;
  color: #6c757d;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Auto-sync indicator */
.auto-sync-info {
  margin: 20px 0;
  padding: 15px;
  background: #e8f4fd;
  border-radius: 6px;
  border: 1px solid #c2e0ff;
}

.auto-sync-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #1a73e8;
  color: white;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.auto-sync-description {
  margin: 10px 0 0 0;
  font-size: 0.9em;
  color: #1a73e8;
}

/* Features list */
.features-list {
  margin: 20px 0;
  text-align: left;
}

.feature {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  color: #555;
  font-size: 0.95em;
}

.feature-icon {
  font-size: 1.2em;
}
</style> 