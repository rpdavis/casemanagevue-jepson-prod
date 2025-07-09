<!-- src/views/AdminTeacherFeedback.vue -->
<template>
  <div class="teacher-feedback-admin">
    <div class="admin-header">
      <h2>Teacher Feedback Forms</h2>
      <p class="admin-description">
        Create and manage Google Forms for collecting teacher feedback on students. 
        Forms can be customized with different question templates and sent to specific teachers.
      </p>
    </div>

    <!-- Status Messages -->
    <div v-if="formsMessage" :class="['status-message', formsStatus]">
      {{ formsMessage }}
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button 
        @click="showCreateForm = true" 
        class="primary-btn"
        :disabled="formsStatus === 'loading'"
      >
        <span>📝</span> Create New Feedback Form
      </button>
      <button 
        @click="refreshForms" 
        class="secondary-btn"
        :disabled="formsStatus === 'loading'"
      >
        <span>🔄</span> Refresh Forms
      </button>
    </div>

    <!-- Create Form Dialog -->
    <div v-if="showCreateForm" class="modal-overlay" @click="closeCreateForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create Teacher Feedback Form</h3>
          <button @click="closeCreateForm" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Student Selection -->
          <div class="form-group">
            <label>Select Student:</label>
            <select v-model="selectedStudent" required>
              <option value="">Choose a student...</option>
              <option 
                v-for="student in studentsWithSeparateSetting" 
                :key="student.id" 
                :value="student"
              >
                {{ student.firstName }} {{ student.lastName }} (Grade {{ student.grade }})
              </option>
            </select>
          </div>

          <!-- Template Selection -->
          <div class="form-group">
            <label>Select Feedback Templates:</label>
            <div class="template-checkboxes">
              <div v-for="(template, key) in formTemplates" :key="key" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :id="key" 
                  :value="key" 
                  v-model="selectedTemplates"
                >
                <label :for="key">
                  <strong>{{ template.name }}</strong>
                  <span class="template-description">{{ template.description }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Teacher Selection -->
          <div class="form-group" v-if="selectedStudent">
            <label>Teachers to Send Form To:</label>
            <div class="teacher-selection">
              <div class="teacher-checkboxes">
                <div v-for="teacher in getTeachersForStudent(selectedStudent)" :key="teacher.id" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :id="teacher.id" 
                    :value="teacher" 
                    v-model="selectedTeachers"
                  >
                  <label :for="teacher.id">
                    {{ teacher.name }} ({{ teacher.email }})
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Period Exclusion -->
          <div class="form-group" v-if="selectedStudent">
            <label>Exclude Periods (optional):</label>
            <div class="period-checkboxes">
              <div v-for="(period, index) in periodLabels" :key="index" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :id="`period-${index}`" 
                  :value="index.toString()" 
                  v-model="excludedPeriods"
                >
                <label :for="`period-${index}`">{{ period }}</label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateForm" class="secondary-btn">Cancel</button>
          <button 
            @click="createForm" 
            class="primary-btn"
            :disabled="!canCreateForm || formsStatus === 'loading'"
          >
            <span v-if="formsStatus === 'loading'">Creating...</span>
            <span v-else>Create Form</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Existing Forms List -->
    <div class="forms-list">
      <h3>Existing Feedback Forms</h3>
      
      <div v-if="linkedForms.length === 0" class="empty-state">
        <p>No feedback forms created yet.</p>
        <p>Click "Create New Feedback Form" to get started.</p>
      </div>

      <div v-else class="forms-grid">
        <div v-for="form in linkedForms" :key="form.id" class="form-card">
          <div class="form-header">
            <h4>{{ form.title }}</h4>
            <span class="form-date">{{ formatDate(form.createdAt) }}</span>
          </div>
          
          <div class="form-details">
            <p><strong>Student:</strong> {{ form.student.name }}</p>
            <p><strong>Grade:</strong> {{ form.student.grade }}</p>
            <p><strong>Templates:</strong> {{ form.templates.join(', ') }}</p>
            <p><strong>Teachers:</strong> {{ form.teachers.length }}</p>
            <p><strong>Responses:</strong> {{ form.responseCount || 0 }}</p>
          </div>

          <div class="form-actions">
            <button @click="openForm(form.editUrl)" class="secondary-btn">
              <span>📝</span> Edit Form
            </button>
            <button @click="openForm(form.responseUrl)" class="secondary-btn">
              <span>📋</span> View Form
            </button>
            <button @click="openForm(form.sheetUrl)" class="secondary-btn">
              <span>📊</span> View Responses
            </button>
            <button @click="deleteForm(form.id)" class="danger-btn">
              <span>🗑️</span> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useGoogleForms } from '@/composables/useGoogleForms.js'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import { useAppSettings } from '@/composables/useAppSettings.js'

export default {
  name: 'AdminTeacherFeedback',
  setup() {
    // Composables
    const { 
      formsStatus, 
      formsMessage, 
      linkedForms, 
      initializeGoogleAuth,
      createFeedbackForm,
      loadExistingForms,
      deleteFeedbackForm,
      getFormTemplates
    } = useGoogleForms()
    
    const { students, fetchStudents } = useStudents()
    const { users, fetchUsers } = useUsers()
    const { appSettings, loadAppSettings } = useAppSettings()

    // State
    const showCreateForm = ref(false)
    const selectedStudent = ref('')
    const selectedTemplates = ref(['academic'])
    const selectedTeachers = ref([])
    const excludedPeriods = ref([])

    // Computed
    const formTemplates = computed(() => getFormTemplates())
    
    const studentsWithSeparateSetting = computed(() => {
      return students.value.filter(student => {
        const hasSeparateSetting = student.app?.flags?.flag1 || student.flag1 || false
        return hasSeparateSetting
      })
    })

    const periodLabels = computed(() => {
      return appSettings.value?.periodLabels || ['Per1', 'Per2', 'Per3', 'Per4', 'Per5', 'Per6', 'SH']
    })

    const canCreateForm = computed(() => {
      return selectedStudent.value && 
             selectedTemplates.value.length > 0 && 
             selectedTeachers.value.length > 0
    })

    // Methods
    const getTeachersForStudent = (student) => {
      if (!student || !users.value) return []
      
      const teacherIds = new Set()
      
      // Get teachers from schedule data
      if (student.app?.schedule?.periods) {
        Object.values(student.app.schedule.periods).forEach(teacherId => {
          if (teacherId) teacherIds.add(teacherId)
        })
      }
      
      // Get teachers from aeries data
      if (student.aeries?.schedule) {
        Object.values(student.aeries.schedule).forEach(period => {
          if (period?.teacherId) teacherIds.add(period.teacherId)
        })
      }
      
      // Convert to teacher objects
      return Array.from(teacherIds)
        .map(id => users.value.find(u => u.id === id))
        .filter(Boolean)
        .filter(user => user.role === 'teacher')
    }

    const createForm = async () => {
      try {
        await createFeedbackForm(
          selectedStudent.value,
          selectedTeachers.value,
          selectedTemplates.value,
          excludedPeriods.value
        )
        closeCreateForm()
      } catch (error) {
        console.error('Error creating form:', error)
      }
    }

    const closeCreateForm = () => {
      showCreateForm.value = false
      selectedStudent.value = ''
      selectedTemplates.value = ['academic']
      selectedTeachers.value = []
      excludedPeriods.value = []
    }

    const openForm = (url) => {
      window.open(url, '_blank')
    }

    const deleteForm = async (formId) => {
      if (confirm('Are you sure you want to remove this form from the list?')) {
        try {
          await deleteFeedbackForm(formId)
        } catch (error) {
          console.error('Error deleting form:', error)
        }
      }
    }

    const refreshForms = () => {
      loadExistingForms()
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    // Initialize
    onMounted(async () => {
      try {
        await Promise.all([
          initializeGoogleAuth(),
          fetchStudents(),
          fetchUsers(),
          loadAppSettings()
        ])
        loadExistingForms()
      } catch (error) {
        console.error('Error initializing teacher feedback:', error)
      }
    })

    return {
      // State
      formsStatus,
      formsMessage,
      linkedForms,
      showCreateForm,
      selectedStudent,
      selectedTemplates,
      selectedTeachers,
      excludedPeriods,
      
      // Computed
      formTemplates,
      studentsWithSeparateSetting,
      periodLabels,
      canCreateForm,
      
      // Methods
      getTeachersForStudent,
      createForm,
      closeCreateForm,
      openForm,
      deleteForm,
      refreshForms,
      formatDate
    }
  }
}
</script>

<style scoped>
.teacher-feedback-admin {
  padding: 1rem;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.admin-description {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.status-message {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-weight: 500;
}

.status-message.loading {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.status-message.success {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.status-message.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.primary-btn, .secondary-btn, .danger-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn {
  background: #2a79c9;
  color: white;
}

.primary-btn:hover:not(:disabled) {
  background: #1e5a96;
}

.secondary-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.secondary-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.danger-btn {
  background: #dc3545;
  color: white;
}

.danger-btn:hover:not(:disabled) {
  background: #c82333;
}

.primary-btn:disabled, .secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.template-checkboxes, .teacher-checkboxes, .period-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.checkbox-item input[type="checkbox"] {
  margin-top: 0.25rem;
}

.checkbox-item label {
  margin: 0;
  cursor: pointer;
  flex: 1;
}

.template-description {
  display: block;
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
  margin-top: 0.25rem;
}

.forms-list {
  margin-top: 3rem;
}

.forms-list h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.form-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.form-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.form-date {
  font-size: 0.9rem;
  color: #666;
}

.form-details {
  margin-bottom: 1.5rem;
}

.form-details p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.form-actions button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.period-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.teacher-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}
</style> 