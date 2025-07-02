<template>
  <div class="admin-students">
    <h2>Edit Students</h2>
    
    <!-- Search and Delete All -->
    <div class="admin-form-row">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchTerm" 
          @input="handleSearch"
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
import { ref, computed, onMounted } from 'vue'
import useStudents from '../composables/useStudents.js'
import { getDisplayValue } from '@/utils/studentUtils'

const PAGE_SIZE = 20

// Reactive state
const students = ref([])
const filteredStudents = ref([])
const searchTerm = ref('')
const currentPage = ref(1)
const activeEditId = ref(null)
const statusMessage = ref('')
const isError = ref(false)
const editingStudent = ref({})

// Composables
const { fetchAllStudents, updateStudent, deleteStudent } = useStudents()

// Computed
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredStudents.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStudents.value.length / PAGE_SIZE))
})

// Methods
const showStatus = (message, error = false) => {
  statusMessage.value = message
  isError.value = error
  setTimeout(() => {
    statusMessage.value = ''
    isError.value = false
  }, 5000)
}

const handleSearch = () => {
  const term = searchTerm.value.trim().toLowerCase()
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
    editingStudent.value[field] = value
  }
}

const saveStudent = async (studentId) => {
  try {
    const updates = {}
    Object.keys(editingStudent.value).forEach(key => {
      if (key !== 'id' && editingStudent.value[key] !== students.value.find(s => s.id === studentId)[key]) {
        updates[key] = editingStudent.value[key]
      }
    })

    if (Object.keys(updates).length > 0) {
      await updateStudent(studentId, updates)
      
      // Update local state
      const index = students.value.findIndex(s => s.id === studentId)
      if (index !== -1) {
        students.value[index] = { ...students.value[index], ...updates }
      }
      
      showStatus('✅ Student updated.')
    }
  } catch (error) {
    showStatus('❌ Update failed.', true)
    console.error('Update error:', error)
  } finally {
    cancelEdit()
  }
}

const deleteStudentRecord = async (studentId) => {
  if (!confirm('Delete this student?')) return
  
  try {
    await deleteStudent(studentId)
    
    // Remove from local state
    students.value = students.value.filter(s => s.id !== studentId)
    filteredStudents.value = filteredStudents.value.filter(s => s.id !== studentId)
    
    showStatus('✅ Student deleted.')
  } catch (error) {
    showStatus('❌ Delete failed.', true)
    console.error('Delete error:', error)
  } finally {
    cancelEdit()
  }
}

const deleteAllStudents = async () => {
  const confirmation = prompt('Type DELETE ALL STUDENTS to confirm:')
  if (confirmation !== 'DELETE ALL STUDENTS') return
  
  try {
    // This would need to be implemented in the composable
    // For now, we'll delete them one by one
    for (const student of [...students.value]) {
      await deleteStudent(student.id)
    }
    
    students.value = []
    filteredStudents.value = []
    showStatus('✅ All students deleted.')
  } catch (error) {
    showStatus('❌ Delete all failed.', true)
    console.error('Delete all error:', error)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return '—'
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
    }
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

// Load data on mount
onMounted(async () => {
  try {
    students.value = await fetchAllStudents()
    filteredStudents.value = students.value
  } catch (error) {
    showStatus('❌ Failed to load students.', true)
    console.error('Load error:', error)
  }
})
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
