<template>
  <div class="admin-students">
    <h2>Edit Students</h2>
    
    <!-- Search and Delete All -->
    <div class="admin-form-row">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchTerm" 
          @input="debouncedHandleSearch"
          placeholder="Search by name"
          class="search-input"
        />
        <button @click="deleteAllStudents" class="delete-all-btn">Delete All Students</button>
      </div>
    </div>

    <!-- Status Message -->
    <div :class="['admin-status-msg', { error: isError }]" v-if="statusMessage">
      {{ statusMessage }}
    </div>

    <!-- Students Table -->
    <table class="user-admin-table students-table striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Grade</th>
          <th>Case Manager</th>
          <th>Date Added</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!paginatedStudents.length">
          <td colspan="7">No students found.</td>
        </tr>
        <tr 
          v-for="student in paginatedStudents" 
          :key="student.id"
          :class="{ 'active-row': activeEditId === student.id }"
          :data-id="student.id"
        >
          <td>{{ student.id }}</td>
          <td>
            <input 
              class="editable-input" 
              data-field="first_name" 
              :value="getDisplayValue(student, 'firstName') || ''" 
              :disabled="activeEditId !== student.id"
              @input="updateStudentField(student.id, 'first_name', $event.target.value)"
            />
          </td>
          <td>
            <input 
              class="editable-input" 
              data-field="last_name" 
              :value="getDisplayValue(student, 'lastName') || ''" 
              :disabled="activeEditId !== student.id"
              @input="updateStudentField(student.id, 'last_name', $event.target.value)"
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
            <input 
              class="editable-input" 
              data-field="caseManagerId" 
              :value="student.caseManagerId || ''" 
              :disabled="activeEditId !== student.id"
              @input="updateStudentField(student.id, 'caseManagerId', $event.target.value)"
            />
          </td>
          <td>{{ formatDate(student.created_at) }}</td>
          <td class="action-btns">
            <!-- Edit Mode -->
            <template v-if="activeEditId === student.id">
              <button @click="saveStudent(student.id)" class="btn-save" title="Save">💾</button>
              <button @click="cancelEdit" class="btn-cancel" title="Cancel">❌</button>
              <button @click="deleteStudentRecord(student.id)" class="btn-delete" title="Delete">🗑️</button>
            </template>
            <!-- View Mode -->
            <template v-else>
              <button @click="startEdit(student.id)" class="btn-edit" title="Edit">✏️</button>
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
        Prev
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="admin-btn"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import useStudents from '@/composables/useStudents'
import { getDisplayValue } from '@/utils/studentUtils'
import { 
  sanitizeString, 
  checkSecurityThreats, 
  validateStringLength,
  checkRateLimit,
  validateStudentData,
  sanitizeStudentFormData
} from '@/utils/validation.js'

const db = getFirestore()
const { students, fetchStudents, updateStudent, deleteStudent } = useStudents()

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
  const sanitizedTerm = sanitizeString(searchTerm.value, {
    trim: true,
    maxLength: 100,
    removeDangerous: true
  })

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
  if (activeEditId.value) return // Only allow editing one row at a time
  
  const student = students.value.find(s => s.id === studentId)
  if (student) {
    activeEditId.value = studentId
    editingStudent.value = { ...student }
  }
}

const cancelEdit = () => {
  activeEditId.value = null
  editingStudent.value = {}
}

const updateStudentField = (studentId, field, value) => {
  if (editingStudent.value.id === studentId) {
    // Sanitize the input value
    let sanitizedValue = value
    
    if (typeof value === 'string') {
      sanitizedValue = sanitizeString(value, {
        trim: true,
        maxLength: field === 'caseManagerId' ? 50 : 100,
        removeDangerous: true
      })

      // Security threat detection
      const securityCheck = checkSecurityThreats(sanitizedValue)
      if (!securityCheck.isSafe) {
        showStatus(`Security threat detected in ${field}: ${securityCheck.threats.join(', ')}`, true)
        return
      }

      // Validate string length
      const lengthValidation = validateStringLength(sanitizedValue, {
        max: field === 'caseManagerId' ? 50 : 100,
        fieldName: field
      })
      if (!lengthValidation.isValid) {
        showStatus(lengthValidation.error, true)
        return
      }
    }

    editingStudent.value[field] = sanitizedValue
  }
}

const saveStudent = async (studentId) => {
  try {
    // Rate limiting for save operations
    const rateCheck = checkRateLimit('saveStudent', 10, 60000) // 10 saves per minute
    if (!rateCheck.allowed) {
      showStatus('Too many save requests. Please wait before saving again.', true)
      return
    }

    // Prepare the updates object
    const updates = {}
    Object.keys(editingStudent.value).forEach(key => {
      if (key !== 'id' && editingStudent.value[key] !== students.value.find(s => s.id === studentId)[key]) {
        updates[key] = editingStudent.value[key]
      }
    })

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

    // Apply sanitized updates back to editing state
    Object.assign(editingStudent.value, sanitizedUpdates)

    await updateStudent(studentId, sanitizedUpdates)
    
    // Update local state
    const index = students.value.findIndex(s => s.id === studentId)
    if (index !== -1) {
      students.value[index] = { ...students.value[index], ...sanitizedUpdates }
    }
    
    showStatus('✅ Student updated.')
  } catch (error) {
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
    await fetchStudents()
    filteredStudents.value = students.value
  } catch (error) {
    showStatus('Failed to load students.', true)
    console.error('Load students error:', error)
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
/* Styles are in admin-panel.css */
</style>
