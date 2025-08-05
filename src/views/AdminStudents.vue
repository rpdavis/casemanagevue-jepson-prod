<template>
  <div class="admin-students">
    <h2>Edit Students</h2>
    
    <!-- Search and Delete All -->
    <div class="admin-form-row">
      <input 
        type="text" 
        v-model="searchTerm" 
        @input="debouncedHandleSearch"
        placeholder="Search by name"
        class="admin-search-input"
      />
      <button 
        v-if="canDeleteAllStudents" 
        @click="deleteAllStudents" 
        class="delete-all-btn"
      >
        <Trash2 :size="16" />
        Delete All Students
      </button>
    </div>

    <!-- Status Message -->
    <div :class="['admin-status-msg', { error: isError }]" v-if="statusMessage">
      {{ statusMessage }}
    </div>



    <!-- Students Table -->
    <table class="student-admin-table striped">
      <thead>
        <tr>
          <th>SSID</th>
          <th style="display: none;">Student ID</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Grade</th>
          <th>Plan</th>
          <th>Case Manager</th>
          <th title="Staff ID Array present">staffIdArr</th>
          <th>Date Added</th>
          <th style="text-align:center;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!paginatedStudents.length">
          <td colspan="10">No students found.</td>
        </tr>
        <tr 
          v-for="student in paginatedStudents" 
          :key="student.id"
          :class="{ 'active-row': activeEditId === student.id }"
          :data-id="student.id"
        >
          <td>{{ getDisplayValue(student, 'ssid') || student.id }}</td>
          <td style="display: none;">{{ student.id }}</td>
          <td>
            <input 
              class="editable-input" 
              data-field="firstName" 
              :value="getDisplayValue(student, 'firstName') || ''" 
              :disabled="activeEditId !== student.id"
              @input="updateStudentField(student.id, 'firstName', $event.target.value)"
            />
          </td>
          <td>
            <input 
              class="editable-input" 
              data-field="lastName" 
              :value="getDisplayValue(student, 'lastName') || ''" 
              :disabled="activeEditId !== student.id"
              @input="updateStudentField(student.id, 'lastName', $event.target.value)"
            />
          </td>
          <td>
            <input 
              class="editable-input" 
              data-field="grade" 
              :value="getDisplayValue(student, 'grade') || ''" 
              :disabled="activeEditId !== student.id"
              @input="updateStudentField(student.id, 'grade', $event.target.value)"
            />
          </td>
          <td>
            <select 
              class="editable-select" 
              data-field="plan" 
              :value="getDisplayValue(student, 'plan') || ''" 
              :disabled="activeEditId !== student.id"
              @change="updateStudentField(student.id, 'plan', $event.target.value)"
            >
              <option value="">Select Plan</option>
              <option value="IEP">IEP</option>
              <option value="504">504</option>
            </select>
          </td>
          <td>
            <select 
              class="editable-select" 
              data-field="caseManagerId" 
              :value="getDisplayValue(student, 'caseManagerId') || ''" 
              :disabled="activeEditId !== student.id"
              @change="updateStudentField(student.id, 'caseManagerId', $event.target.value)"
            >
              <option value="">-- Select Case Manager --</option>
              <option v-for="cm in caseManagers" :key="cm.id" :value="cm.id">
                {{ cm.name || cm.email || cm.id }}
              </option>

            </select>
          </td>
          <td class="staff-id-status" :title="getStaffIdStatusTooltip(student)">
            <span class="status-icon" :class="hasStaffIds(student) ? 'present' : 'missing'">
              {{ hasStaffIds(student) ? '✓' : '✗' }}
            </span>
          </td>
          <td>{{ formatDate(student.created_at) }}</td>
          <td class="admin-action-btns">
            <!-- Edit Mode -->
            <template v-if="activeEditId === student.id">
              <button @click="saveStudent(student.id)" class="admin-action-btn save" title="Save">
                <Save :size="16" />
              </button>
              <button @click="cancelEdit" class="admin-action-btn cancel" title="Cancel">
                <X :size="16" />
              </button>
              <button @click="deleteStudentRecord(student.id)" class="admin-action-btn delete red" title="Delete Student">
                <Trash2 :size="16" />
              </button>
            </template>
            <!-- View Mode -->
            <template v-else>
              <button @click="startEdit(student.id)" class="admin-action-btn edit" title="Edit">
                <Edit :size="16" />
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="admin-pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="admin-btn"
      >
        <ChevronLeft :size="16" />
        Prev
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="admin-btn"
      >
        Next
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore'
import useStudents from '@/composables/useStudents'
import useUsers from '@/composables/useUsers'
import { useAuthStore } from '@/store/authStore'
import { useAdminPanelPermissions } from '@/composables/useAdminPanelPermissions'
import { getDisplayValue } from '@/utils/studentUtils'
import { 
  sanitizeString, 
  checkSecurityThreats, 
  validateStringLength,
  checkRateLimit,
  validateStudentData,
  sanitizeStudentFormData
} from '@/utils/validation.js'
import { Edit, Save, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const db = getFirestore()
const { students, fetchStudents, updateStudent, deleteStudent } = useStudents()
const { users, caseManagers, fetchUsers } = useUsers()
const { canDeleteAllStudents, initializeIfNeeded } = useAdminPanelPermissions()

const searchTerm = ref('')
const filteredStudents = ref([])
const currentPage = ref(1)
const studentsPerPage = 50
const activeEditId = ref(null)
const editingStudent = ref({})
const statusMessage = ref('')
const isError = ref(false)



// Debounced search implementation
let debounceTimer = null
const debouncedHandleSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    handleSearch()
  }, 300) // 300ms delay to prevent rapid API calls
}

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * studentsPerPage
  const end = start + studentsPerPage
  return filteredStudents.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / studentsPerPage)
})

const showStatus = (message, error = false) => {
  statusMessage.value = message
  isError.value = error
  setTimeout(() => {
    statusMessage.value = ''
    isError.value = false
  }, 5000)
}

const handleSearch = () => {
  // Rate limiting for search operations
  const rateCheck = checkRateLimit('studentSearch', 20, 60000) // 20 searches per minute
  if (!rateCheck.allowed) {
    showStatus('Too many search requests. Please wait before searching again.', true)
    return
  }

  // Sanitize search term
  const sanitizedTerm = sanitizeString(searchTerm.value, 100)

  // Security threat detection
  const securityCheck = checkSecurityThreats(sanitizedTerm)
  if (!securityCheck.isSafe) {
    showStatus(`Security threat detected in search: ${securityCheck.threats.join(', ')}`, true)
    searchTerm.value = sanitizedTerm // Apply sanitized version
    return
  }

  // Apply sanitized term back to the input
  if (sanitizedTerm !== searchTerm.value) {
    searchTerm.value = sanitizedTerm
  }

  const term = sanitizedTerm.toLowerCase()
  if (!term) {
    filteredStudents.value = students.value
  } else {
    filteredStudents.value = students.value.filter(student => {
      const firstName = getDisplayValue(student, 'firstName') || ''
      const lastName = getDisplayValue(student, 'lastName') || ''
      const fullName = `${firstName} ${lastName}`.toLowerCase()
      return fullName.includes(term)
    })
  }
  currentPage.value = 1
}

const startEdit = (studentId) => {
  console.log('🚀 ADMIN EDIT DEBUG - Starting edit:', {
    studentId,
    activeEditId: activeEditId.value,
    studentExists: !!students.value.find(s => s.id === studentId)
  })
  
  if (activeEditId.value) return // Only allow editing one row at a time
  
  const student = students.value.find(s => s.id === studentId)
  if (student) {
    console.log('🚀 ADMIN EDIT DEBUG - Student found:', {
      id: student.id,
      hasApp: !!student.app,
      appStudentData: student.app?.studentData,
      keys: Object.keys(student)
    })
    
    activeEditId.value = studentId
    // Create a deep copy to avoid modifying the original student object
    editingStudent.value = JSON.parse(JSON.stringify(student))
    
    console.log('🚀 ADMIN EDIT DEBUG - Edit state set:', {
      activeEditId: activeEditId.value,
      editingStudentId: editingStudent.value.id
    })
  } else {
    console.error('🚀 ADMIN EDIT DEBUG - Student not found!')
  }
}

const cancelEdit = () => {
  activeEditId.value = null
  editingStudent.value = {}
}

const updateStudentField = (studentId, field, value) => {
  if (editingStudent.value.id === studentId) {
    console.log('🚀 ADMIN UPDATE DEBUG - Updating field:', {
      studentId,
      field,
      value,
      currentValue: getDisplayValue(editingStudent.value, field)
    })
    
    // Handle case manager ID specially - it's a Firebase user ID and should not be sanitized
    let sanitizedValue = value
    
    if (field === 'caseManagerId') {
      // Case manager IDs are Firebase user IDs - don't sanitize them
      sanitizedValue = value
    } else if (typeof value === 'string') {
      // For other string fields, apply normal sanitization
      sanitizedValue = sanitizeString(value, field === 'grade' ? 10 : 100)

      // Security threat detection
      const securityCheck = checkSecurityThreats(sanitizedValue)
      if (!securityCheck.isSafe) {
        showStatus(`Security threat detected in ${field}: ${securityCheck.threats.join(', ')}`, true)
        return
      }

      // Validate string length
      const lengthValidation = validateStringLength(sanitizedValue, field, 0, field === 'grade' ? 10 : 100)
      if (!lengthValidation.isValid) {
        showStatus(lengthValidation.error, true)
        return
      }
    }

    // Update the field in the correct nested structure
    if (['firstName', 'lastName', 'grade', 'plan', 'ssid', 'caseManagerId'].includes(field)) {
      // Ensure app.studentData structure exists
      if (!editingStudent.value.app) {
        editingStudent.value.app = {}
      }
      if (!editingStudent.value.app.studentData) {
        editingStudent.value.app.studentData = {}
      }
      editingStudent.value.app.studentData[field] = sanitizedValue
    } else {
      // For other fields, update directly
      editingStudent.value[field] = sanitizedValue
    }
    
    console.log('🚀 ADMIN UPDATE DEBUG - Updated field:', {
      field,
      newValue: sanitizedValue,
      updatedPath: ['firstName', 'lastName', 'grade', 'plan', 'ssid', 'caseManagerId'].includes(field) 
        ? `app.studentData.${field}` 
        : field
    })
  }
}

const saveStudent = async (studentId) => {
  try {
    console.log('🚀 ADMIN SAVE DEBUG - Starting saveStudent:', {
      studentId,
      editingStudentId: editingStudent.value.id,
      editingStudentKeys: Object.keys(editingStudent.value),
      hasStudentInList: !!students.value.find(s => s.id === studentId)
    })
    
const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)
    console.log('🔐 PERMISSION DEBUG:', {
      currentUser: currentUser.value,
      userRole: currentUser.value?.role,
      userEmail: currentUser.value?.email,
      userId: currentUser.value?.uid
    })
    
    // Rate limiting for save operations
    const rateCheck = checkRateLimit('saveStudent', 10, 60000) // 10 saves per minute
    if (!rateCheck.allowed) {
      showStatus('Too many save requests. Please wait before saving again.', true)
      return
    }

    // Prepare the updates object with proper nested structure
    const updates = {}
    const originalStudent = students.value.find(s => s.id === studentId)
    

    
    // Handle nested studentData fields
    const studentDataFields = ['firstName', 'lastName', 'grade', 'plan', 'ssid', 'caseManagerId']
    let studentDataUpdates = {}
    let hasStudentDataChanges = false
    
    studentDataFields.forEach(field => {
      const currentValue = getDisplayValue(editingStudent.value, field)
      const originalValue = getDisplayValue(originalStudent, field)
      
      if (currentValue !== originalValue) {
        studentDataUpdates[field] = currentValue
        hasStudentDataChanges = true
        console.log(`✅ CHANGE DETECTED - ${field}: "${originalValue}" → "${currentValue}"`)
      }
    })
    
    if (hasStudentDataChanges) {
      // Build proper nested structure - preserve ALL existing fields plus changes
      updates.app = {
        studentData: {
          // Include ALL existing fields from original data
          ...originalStudent.app?.studentData,
          // Then merge in the changed fields
          ...studentDataUpdates
        }
      }
    }
    
    // Handle other top-level fields
    Object.keys(editingStudent.value).forEach(key => {
      if (key !== 'id' && key !== 'app' && editingStudent.value[key] !== originalStudent[key]) {
        updates[key] = editingStudent.value[key]
      }
    })
    
    console.log('🚀 ADMIN SAVE DEBUG - Updates prepared:', updates)

    if (Object.keys(updates).length === 0) {
      cancelEdit()
      return
    }

    // Sanitize the updates
    const sanitizedUpdates = sanitizeStudentFormData(updates)

    // Validate the updates
    const validation = validateStudentData(sanitizedUpdates, { isNew: false })
    if (!validation.isValid) {
      showStatus(`Validation failed: ${validation.errors.join(', ')}`, true)
      return
    }

    // Add update metadata
    sanitizedUpdates.updatedAt = serverTimestamp()
    sanitizedUpdates.updatedBy = currentUser.value?.uid || null

    // Apply sanitized updates back to editing state
    Object.assign(editingStudent.value, sanitizedUpdates)

    console.log('🚀 ADMIN SAVE DEBUG - Calling setDoc with merge:', {
      studentId,
      sanitizedUpdates
    })
    
    // Use setDoc with merge: true like the working StudentForm
    await setDoc(doc(db, 'students', studentId), sanitizedUpdates, { merge: true })
    
    console.log('🚀 ADMIN SAVE DEBUG - updateStudent completed successfully')
    
    // Update local state with proper nested structure handling
    const index = students.value.findIndex(s => s.id === studentId)
    if (index !== -1) {
      // Handle nested updates properly
      const updatedStudent = { ...students.value[index] }
      
      Object.keys(sanitizedUpdates).forEach(key => {
        if (key === 'app.studentData') {
          // Merge studentData updates
          if (!updatedStudent.app) updatedStudent.app = {}
          updatedStudent.app.studentData = {
            ...updatedStudent.app.studentData,
            ...sanitizedUpdates[key]
          }
        } else {
          // Direct field updates
          updatedStudent[key] = sanitizedUpdates[key]
        }
      })
      
      students.value[index] = updatedStudent
    }
    
    console.log('🚀 ADMIN SAVE DEBUG - Local state updated')
    showStatus('✅ Student updated.')
  } catch (error) {
    console.error('🚀 ADMIN SAVE DEBUG - Save failed:', error)
    showStatus('❌ Update failed.', true)
    console.error('Update error:', error)
  } finally {
    cancelEdit()
  }
}

const deleteStudentRecord = async (studentId) => {
  // Rate limiting for delete operations
  const rateCheck = checkRateLimit('deleteStudent', 5, 300000) // 5 deletes per 5 minutes
  if (!rateCheck.allowed) {
    showStatus('Too many delete requests. Please wait before deleting again.', true)
    return
  }

  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
    return
  }

  try {
    await deleteStudent(studentId)
    showStatus('✅ Student deleted.')
    
    // Remove from local state
    const index = students.value.findIndex(s => s.id === studentId)
    if (index !== -1) {
      students.value.splice(index, 1)
    }
    
    // Update filtered results
    handleSearch()
  } catch (error) {
    showStatus('❌ Delete failed.', true)
    console.error('Delete error:', error)
  }
}

const deleteAllStudents = async () => {
  // Enhanced rate limiting for delete all operations
  const rateCheck = checkRateLimit('deleteAllStudents', 1, 3600000) // 1 delete all per hour
  if (!rateCheck.allowed) {
    showStatus('Delete all operation rate limited. Please wait before trying again.', true)
    return
  }

  const confirmMessage = `Are you sure you want to delete ALL ${students.value.length} students? 

This action cannot be undone and will permanently remove all student data.

Type "DELETE ALL STUDENTS" to confirm:`

  const userInput = prompt(confirmMessage)
  
  if (userInput !== 'DELETE ALL STUDENTS') {
    showStatus('Delete all operation cancelled.', false)
    return
  }

  try {
    showStatus('Deleting all students...')
    
    // Delete in batches to avoid Firestore limits
    const batch = writeBatch(db)
    let batchCount = 0
    
    for (const student of students.value) {
      batch.delete(doc(db, 'students', student.id))
      batchCount++
      
      // Firestore batch limit is 500 operations
      if (batchCount >= 500) {
        await batch.commit()
        batchCount = 0
      }
    }
    
    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit()
    }
    
    // Clear local state
    students.value = []
    filteredStudents.value = []
    
    showStatus('✅ All students deleted.')
  } catch (error) {
    showStatus('❌ Failed to delete all students.', true)
    console.error('Delete all error:', error)
  }
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'
  
  try {
    // Handle Firestore timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString()
    }
    
    // Handle ISO string or regular date
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString()
  } catch (error) {
    return 'Invalid Date'
  }
}

// Check if student has staffIds array
const hasStaffIds = (student) => {
  return student.app?.staffIds && Array.isArray(student.app.staffIds) && student.app.staffIds.length > 0
}

// Get tooltip text for staffIds status
const getStaffIdStatusTooltip = (student) => {
  if (hasStaffIds(student)) {
    const count = student.app.staffIds.length
    return `Staff ID Array present (${count} staff members)`
  } else {
    return 'Staff ID Array missing or empty'
  }
}

// Removed getCaseManagerId function - now using direct student.caseManagerId access

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Initialize data on mount
onMounted(async () => {
  try {
    await Promise.all([
      fetchStudents(),
      fetchUsers(),
      initializeIfNeeded()
    ])
    filteredStudents.value = students.value
    console.log('🚀 ADMIN DEBUG - Case managers loaded:', caseManagers.value.length)
  } catch (error) {
    showStatus('Failed to load data.', true)
    console.error('Load data error:', error)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped>
/* =====================
   UNIFIED ADMIN TABLE SYSTEM
   ===================== */

/* Admin Form Controls */
.admin-form-row {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-bottom: 1em;
  flex-wrap: wrap;
}

.admin-search-input {
  padding: 0.5em;
  font-size: 0.9em;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 250px;
  max-width: 100%;
}

.delete-all-btn {
  margin-left: auto;
  background: #f44336;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.15s;
}

.delete-all-btn:hover {
  background: #d32f2f;
}

/* Status Messages */
.admin-status-msg {
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.admin-status-msg.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Main Table */
.student-admin-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

/* Table Headers */
.student-admin-table thead th {
  background: #f8f9fa;
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid #dee2e6;
  text-align: left;
  font-size: 0.85rem;
  color: #495057;
}

/* Table Cells */
.student-admin-table td {
  padding: 0.5rem;
  vertical-align: middle;
  border-bottom: 1px solid #eee;
}

/* Zebra Striping */
.student-admin-table.striped tr:nth-child(even) {
  background-color: #f9fbfd;
}

/* Column Widths - Optimized for content */
.student-admin-table th:nth-child(1), .student-admin-table td:nth-child(1) { width: 16%; } /* SSID */
.student-admin-table th:nth-child(2), .student-admin-table td:nth-child(2) { width: 0%; display: none; } /* Hidden Student ID */
.student-admin-table th:nth-child(3), .student-admin-table td:nth-child(3) { width: 13%; } /* First Name */
.student-admin-table th:nth-child(4), .student-admin-table td:nth-child(4) { width: 13%; } /* Last Name */
.student-admin-table th:nth-child(5), .student-admin-table td:nth-child(5) { width: 6%; }  /* Grade - Smaller */
.student-admin-table th:nth-child(6), .student-admin-table td:nth-child(6) { width: 8%; }  /* Plan */
.student-admin-table th:nth-child(7), .student-admin-table td:nth-child(7) { width: 12%; } /* Case Manager */
.student-admin-table th:nth-child(8), .student-admin-table td:nth-child(8) { width: 8%; }  /* staffIdArr */
.student-admin-table th:nth-child(9), .student-admin-table td:nth-child(9) { width: 12%; } /* Date Added */
.student-admin-table th:nth-child(10), .student-admin-table td:nth-child(10) { width: 12%; } /* Actions - Wider */

/* Form Controls */
.editable-input, .editable-select {
  width: 100%;
  padding: 0.25rem 0.4rem;
  border: 1px solid #ced4da;
  border-radius: 3px;
  font-size: 0.85rem;
  background: #f8f9fa;
  color: #6c757d;
}

.editable-input:disabled, .editable-select:disabled {
  background: transparent;
  border: none;
  color: inherit;
  cursor: default;
}

/* Active Row Highlighting */
.student-admin-table tr.active-row {
  background-color: #e3f2fd !important;
  box-shadow: inset 0 0 0 2px #2196f3;
}

.student-admin-table tr.active-row .editable-input,
.student-admin-table tr.active-row .editable-select {
  border: 1px solid #2196f3;
  background: #fff;
  color: #212529;
  box-shadow: 0 0 0 2px rgba(33,150,243,0.2);
}

/* Action Buttons */
.admin-action-btns {
  text-align: center;
  padding: 0.5rem;
}

.admin-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  margin: 0 3px; /* Better spacing between buttons */
  padding: 0.25rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #f8f9fa;
  color: #495057;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}

.admin-action-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-action-btn.save {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.admin-action-btn.save:hover {
  background: #218838;
  border-color: #1e7e34;
}

.admin-action-btn.cancel {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.admin-action-btn.cancel:hover {
  background: #545b62;
  border-color: #545b62;
}

.admin-action-btn.delete.red {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.admin-action-btn.delete.red:hover {
  background: #c82333;
  border-color: #bd2130;
}

.admin-action-btn.edit {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.admin-action-btn.edit:hover {
  background: #0069d9;
  border-color: #0062cc;
}

/* Staff ID Status */
.staff-id-status {
  text-align: center;
  padding: 8px;
}

.status-icon {
  font-weight: bold;
  font-size: 14px;
  display: inline-block;
  width: 18px;
  height: 18px;
  line-height: 18px;
  border-radius: 50%;
  text-align: center;
}

.status-icon.present {
  color: #28a745;
  background-color: #d4edda;
}

.status-icon.missing {
  color: #dc3545;
  background-color: #f8d7da;
}

.staff-id-status:hover {
  cursor: help;
}

/* Pagination */
.admin-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
}

.admin-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.admin-btn:hover:not(:disabled) {
  background: #0069d9;
}

.admin-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
