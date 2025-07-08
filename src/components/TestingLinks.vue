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
          <a :href="linkedSheetUrl" target="_blank" class="sheet-link">
            Open Google Sheet →
          </a>
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
                        <span v-for="(period, idx) in getStudentTeacherPeriods(student, selectedTeachers)" :key="idx">
                          {{ period.period }}<span v-if="idx < getStudentTeacherPeriods(student, selectedTeachers).length - 1">, </span>
                        </span>
                      </td>
                      <td>
                        <span v-for="(period, idx) in getStudentTeacherPeriods(student, selectedTeachers)" :key="idx">
                          {{ period.teacherName }}<span v-if="idx < getStudentTeacherPeriods(student, selectedTeachers).length - 1">, </span>
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
              <button @click="showAddTabForm = false; selectedTeachers = []; newTabName = ''" class="btn-secondary">
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

    <!-- Existing Testing Links -->
    <div class="links-section">
      <h4>Testing Links</h4>
      <div class="links-grid">
        <a 
          v-for="link in testingLinks" 
          :key="link.path"
          :href="link.path" 
          target="_blank"
          class="test-link"
          :class="link.category"
        >
          <span class="link-icon">{{ link.icon }}</span>
          <span class="link-text">{{ link.name }}</span>
          <span class="link-category">{{ link.category }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import useStudents from '@/composables/useStudents'
import { useGoogleSheetsRealtime } from '@/composables/useGoogleSheetsRealtime'
import useUsers from '@/composables/useUsers'

// Composables
const { students, fetchStudents } = useStudents()
const { userList: users, fetchUsers } = useUsers()
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
const maxCustomTabs = 5

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
const getStudentsForTeachers = (teacherIds) => {
  return students.value.filter(student => {
    // Check aeries schedule structure
    if (student.aeries?.schedule) {
      for (const period of Object.values(student.aeries.schedule)) {
        if (period && period.teacherId && teacherIds.includes(String(period.teacherId))) {
          return true
        }
      }
    }
    
    // Check app.schedule.periods structure
    if (student.app?.schedule?.periods) {
      for (const teacherId of Object.values(student.app.schedule.periods)) {
        if (teacherId && teacherIds.includes(String(teacherId))) {
          return true
        }
      }
    }
    
    // Also check for direct period properties (from CSV import)
    for (let i = 1; i <= 7; i++) {
      const teacherIdField = `period${i}TeacherId`
      const teacherId = student[teacherIdField] || 
                       student.aeries?.[teacherIdField] ||
                       student.app?.[teacherIdField]
      if (teacherId && teacherIds.includes(String(teacherId))) {
        return true
      }
    }
    
    return false
  })
}

// Preview of filtered students
const filteredStudentsPreview = computed(() => {
  if (selectedTeachers.value.length === 0) return []
  return getStudentsForTeachers(selectedTeachers.value)
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
    const filteredStudents = getStudentsForTeachers(selectedTeachers.value)
    
    // Create the tab in Google Sheets
    const result = await createCustomTab(
      newTabName.value.trim(),
      filteredStudents,
      selectedTeachers.value,
      users.value // Pass users data for teacher name lookup
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
const getStudentTeacherPeriods = (student, teacherIds) => {
  const periods = []
  
  // Check aeries schedule structure
  if (student.aeries?.schedule) {
    Object.entries(student.aeries.schedule).forEach(([periodKey, period]) => {
      if (period && period.teacherId && teacherIds.includes(String(period.teacherId))) {
        // Extract period number from key (e.g., "period1" -> "1")
        const periodNum = periodKey.replace('period', '')
        
        // Find user by aeriesId or ID
        let user = users.value.find(u => u.id === String(period.teacherId))
        if (!user && /^\d+$/.test(period.teacherId)) {
          user = users.value.find(u => u.aeriesId === String(period.teacherId))
        }
        
        periods.push({
          period: periodNum,
          teacherName: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${period.teacherId}`
        })
      }
    })
  }
  
  // Check app.schedule.periods structure
  if (student.app?.schedule?.periods) {
    Object.entries(student.app.schedule.periods).forEach(([periodNum, teacherId]) => {
      if (teacherId && teacherIds.includes(String(teacherId))) {
        const user = users.value.find(u => u.id === String(teacherId))
        periods.push({
          period: periodNum,
          teacherName: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${teacherId}`
        })
      }
    })
  }
  
  // Also check for direct period properties (from CSV import)
  for (let i = 1; i <= 7; i++) {
    const teacherIdField = `period${i}TeacherId`
    const teacherId = student[teacherIdField] || 
                     student.aeries?.[teacherIdField] ||
                     student.app?.[teacherIdField]
    
    if (teacherId && teacherIds.includes(String(teacherId))) {
      // Find user by aeriesId or ID
      let user = users.value.find(u => u.id === String(teacherId))
      if (!user && /^\d+$/.test(teacherId)) {
        user = users.value.find(u => u.aeriesId === String(teacherId))
      }
      
      periods.push({
        period: i.toString(),
        teacherName: user ? (user.name || `${user.firstName} ${user.lastName}`) : `Teacher ${teacherId}`
      })
    }
  }
  
  return periods
}

// Testing links data
const testingLinks = ref([
  { 
    name: 'Student Table Test', 
    path: '/testing#student-table',
    category: 'components',
    icon: '📊'
  },
  { 
    name: 'Auth Flow Test', 
    path: '/testing#auth',
    category: 'auth',
    icon: '🔐'
  },
  { 
    name: 'Permissions Test', 
    path: '/testing#permissions',
    category: 'auth',
    icon: '🛡️'
  },
  { 
    name: 'API Integration Test', 
    path: '/testing#api',
    category: 'api',
    icon: '🔌'
  },
  { 
    name: 'Form Validation Test', 
    path: '/testing#forms',
    category: 'components',
    icon: '📝'
  },
  { 
    name: 'Data Import Test', 
    path: '/testing#import',
    category: 'data',
    icon: '📥'
  }
])

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
      fetchUsers()
    ])
    console.log('Students loaded:', students.value.length)
    console.log('Users loaded:', users.value.length)
    
    await initializeGoogleAuth()
    
    // Check if we have a linked sheet
    if (linkedSheetId.value) {
      const isConnected = await checkSheetConnection()
      if (isConnected) {
        // Do an initial sync
        await syncNow()
      }
    }
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error)
  }
})

// Watch for student changes and auto-sync
watch(() => students.value, async (newStudents, oldStudents) => {
  if (linkedSheetId.value && newStudents !== oldStudents) {
    // Debounce to avoid too many updates
    clearTimeout(window.autoSyncTimeout)
    window.autoSyncTimeout = setTimeout(async () => {
      await syncNow()
    }, 5000) // Wait 5 seconds after changes stop
  }
}, { deep: true })

// Create and link a Google Sheet
const createLinkedGoogleSheet = async () => {
  try {
    await createLinkedSheet(students.value)
  } catch (error) {
    console.error('Failed to create linked sheet:', error)
    alert('Failed to create Google Sheet. Please make sure you are signed in to Google.')
  }
}

// Sync the linked sheet
const syncNow = async () => {
  if (!linkedSheetId.value) return
  
  try {
    await updateSheetData(students.value)
  } catch (error) {
    console.error('Failed to sync sheet:', error)
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
  background: #28a745;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: #218838;
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
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
}

.btn-sync:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #1a73e8;
  color: #1a73e8;
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