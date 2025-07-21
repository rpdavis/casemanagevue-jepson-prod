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
    <div v-if="isLoading" class="status-message loading">
      Processing...
    </div>
    <div v-if="successMessage" class="status-message success">
      {{ successMessage }}
    </div>
    <div v-if="error" class="status-message error">
      {{ error }}
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button 
        @click="showCreateModal = true" 
        class="primary-btn"
        :disabled="isLoading"
      >
        <span>📝</span> Add Form
      </button>
    </div>

                  <!-- Add Form Dialog -->
      <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateForm">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Add Teacher Feedback Form</h3>
            <button @click="closeCreateForm" class="close-btn">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Form Title:</label>
              <input 
                type="text" 
                v-model="formTitle" 
                placeholder="Enter a descriptive title for this form"
                class="form-input"
                required
              >
            </div>

            <div class="form-group">
              <label>Form Description (optional):</label>
              <textarea 
                v-model="formDescription" 
                placeholder="Brief description of what this form is for"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Google Form URL:</label>
              <input 
                type="url" 
                v-model="formUrl" 
                placeholder="https://docs.google.com/forms/d/your-form-id/viewform"
                class="form-input"
                required
              >
              <small class="form-help">Paste the Google Form URL here (viewform link)</small>
            </div>

            <div class="form-group">
              <label>Response Spreadsheet URL:</label>
              <input 
                type="url" 
                v-model="responseSpreadsheetUrl" 
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id"
                class="form-input"
                required
              >
              <small class="form-help">Link to the Google Sheet where responses are collected</small>
            </div>

            <div class="form-info">
              <h4>📋 Setup Instructions:</h4>
              <ol>
                <li>Create your Google Form manually with the questions you want</li>
                <li>Go to <strong>Responses</strong> tab in your form</li>
                <li>Click <strong>Create Spreadsheet</strong> to link it to a Google Sheet</li>
                <li>Copy both URLs and paste them above</li>
              </ol>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeCreateForm" class="secondary-btn">Cancel</button>
            <button 
              @click="addForm" 
              class="primary-btn"
              :disabled="!canAddForm || isLoading"
            >
              <span v-if="isLoading">Adding Form...</span>
              <span v-else>Add Form</span>
            </button>
          </div>
        </div>
      </div>



      <!-- Forms List -->
      <div class="forms-list">
        <h3>Feedback Forms</h3>
        
        <div v-if="formsLoading" class="loading">Loading forms...</div>
        
        <div v-else-if="activeForms.length === 0" class="empty-state">
          <p>No feedback forms added yet.</p>
          <p>Click "Add Form" to get started.</p>
        </div>
        
        <div v-else class="forms-grid">
          <div v-for="form in activeForms" :key="form.id" class="form-card">
            <div class="form-header">
              <h4>{{ form.title || 'Untitled Form' }}</h4>
              <div class="admin-action-btns">
                <button @click="openForm(form)" class="admin-action-btn info" title="View Form">
                  👁️
                </button>
                <button @click="syncFormResponses(form)" class="admin-action-btn warning" title="Sync Responses">
                  🔄
                </button>
                <button @click="editForm(form)" class="admin-action-btn edit" title="Edit Form">
                  ✏️
                </button>
                <button @click="deleteForm(form)" class="admin-action-btn delete" title="Delete Form">
                  🗑️
                </button>
              </div>
            </div>
            
            <div class="form-meta">
              <p><strong>Created:</strong> {{ formatDate(form.createdAt) }}</p>
              <p v-if="form.description"><strong>Description:</strong> {{ form.description }}</p>
              <p><strong>Form URL:</strong> <a :href="form.formUrl" target="_blank" class="form-link">Open Form</a></p>
              <p><strong>Responses:</strong> <a :href="getSpreadsheetUrl(form.responseSpreadsheetId)" target="_blank" class="form-link">View Sheet</a></p>
            </div>
            
            <div class="form-stats">
              <div class="stat">
                <span class="stat-label">Responses:</span>
                <span class="stat-value">{{ getResponseCount(form.responseSpreadsheetId) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Last Sync:</span>
                <span class="stat-value">{{ getLastSyncDate(form.responseSpreadsheetId) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useTeacherFeedback } from '@/composables/useTeacherFeedback.js'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import { useAuthStore } from '@/store/authStore'

export default {
  name: 'AdminTeacherFeedback',
  setup() {
    // Composables
    const { 
      isLoading,
      error,
      successMessage,
      formsLoading,
      responsesLoading,
      feedbackForms,
      feedbackResponses,
      activeForms,
      totalResponses,
      createFeedbackForm,
      updateFeedbackForm,
      deleteFeedbackForm,
      syncResponses,
      getResponsesForSpreadsheet,
      clearMessages,
      extractSpreadsheetId,
      extractFormId
    } = useTeacherFeedback()
    
    const { students, fetchStudents } = useStudents()
    const { users, fetchUsers } = useUsers()
    const authStore = useAuthStore()

    // State
    const showCreateModal = ref(false)
    const formTitle = ref('')
    const formDescription = ref('')
    const formUrl = ref('')
    const responseSpreadsheetUrl = ref('')

    // Computed
    const canAddForm = computed(() => {
      return formTitle.value.trim() && 
             formUrl.value.trim() && 
             responseSpreadsheetUrl.value.trim()
    })

    // Methods
    const addForm = async () => {
      if (!canAddForm.value) return
      
      try {
        clearMessages()
        
        const formData = {
          title: formTitle.value.trim(),
          description: formDescription.value.trim(),
          formUrl: formUrl.value.trim(),
          responseSpreadsheetId: extractSpreadsheetId(responseSpreadsheetUrl.value),
          createdBy: authStore.user.uid
        }
        
        await createFeedbackForm(formData)
        closeCreateForm()
        
      } catch (error) {
        console.error('Error adding form:', error)
      }
    }

    const closeCreateForm = () => {
      showCreateModal.value = false
      formTitle.value = ''
      formDescription.value = ''
      formUrl.value = ''
      responseSpreadsheetUrl.value = ''
      clearMessages()
    }

    const openForm = (form) => {
      window.open(form.formUrl, '_blank')
    }

    const syncFormResponses = async (form) => {
      try {
        await syncResponses(form.responseSpreadsheetId)
      } catch (error) {
        console.error('Error syncing responses:', error)
      }
    }

    const editForm = async (form) => {
      // For now, just open the form URL for editing
      window.open(form.formUrl, '_blank')
    }

    const deleteForm = async (form) => {
      if (confirm(`Are you sure you want to delete "${form.title}"?`)) {
        try {
          await deleteFeedbackForm(form.id)
        } catch (error) {
          console.error('Error deleting form:', error)
        }
      }
    }

    const getResponseCount = (spreadsheetId) => {
      const responses = getResponsesForSpreadsheet(spreadsheetId)
      return responses.value.length
    }

    const getLastSyncDate = (spreadsheetId) => {
      const responses = getResponsesForSpreadsheet(spreadsheetId)
      if (responses.value.length === 0) return 'Never'
      
      const lastSync = responses.value[0]?.syncedAt || responses.value[0]?.autoSyncedAt
      return lastSync ? new Date(lastSync.seconds * 1000).toLocaleDateString() : 'Never'
    }

    const getSpreadsheetUrl = (spreadsheetId) => {
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    }

    const formatDate = (date) => {
      if (!date) return 'N/A'
      const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date)
      return dateObj.toLocaleDateString()
    }



    // Initialize
    onMounted(async () => {
      try {
        await Promise.all([
          fetchStudents(),
          fetchUsers()
        ])
      } catch (error) {
        console.error('Error initializing teacher feedback:', error)
      }
    })

    return {
      // State
      isLoading,
      error,
      successMessage,
      showCreateModal,
      formTitle,
      formDescription,
      formUrl,
      responseSpreadsheetUrl,
      
      // Data
      formsLoading,
      feedbackForms,
      activeForms,
      totalResponses,
      
      // Computed
      canAddForm,
      
      // Methods
      addForm,
      closeCreateForm,
      openForm,
      syncFormResponses,
      editForm,
      deleteForm,
      getResponseCount,
      getLastSyncDate,
      getSpreadsheetUrl,
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

.large-modal {
  max-width: 900px;
  width: 95%;
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

.action-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.action-btn.view:hover {
  background: #e3f2fd;
  border-color: #2196f3;
}

.action-btn.sync:hover {
  background: #fff3e0;
  border-color: #ff9800;
}

.action-btn.edit:hover {
  background: #e8f5e8;
  border-color: #4caf50;
}

.action-btn.delete:hover {
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.form-link {
  color: #2a79c9;
  text-decoration: none;
}

.form-link:hover {
  text-decoration: underline;
}

.form-meta {
  margin-bottom: 1rem;
}

.form-meta p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.form-stats {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-weight: 600;
  color: #495057;
}

.form-info {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.form-info h4 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 1rem;
}

.form-info ol {
  margin: 0;
  padding-left: 1.5rem;
}

.form-info li {
  margin-bottom: 0.5rem;
  color: #495057;
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-help {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.bulk-student-selection {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

.selection-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.control-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.selection-count {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
}

.student-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Form Builder Styles */
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-question-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.add-question-btn:hover {
  background: #218838;
}

.empty-questions {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed #dee2e6;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-item {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8f9fa;
  overflow: hidden;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #e9ecef;
  border-bottom: 1px solid #dee2e6;
}

.question-number {
  font-weight: 600;
  color: #495057;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.question-controls {
  display: flex;
  gap: 0.25rem;
}

.control-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.danger {
  color: #dc3545;
  border-color: #dc3545;
}

.control-btn.danger:hover:not(:disabled) {
  background: #f5c6cb;
}

.question-content {
  padding: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
}

.form-select.small {
  width: auto;
  min-width: 60px;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin: 0;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-item .form-input {
  flex: 1;
}

.add-option-btn {
  padding: 0.5rem 1rem;
  border: 2px dashed #ced4da;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: #6c757d;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.add-option-btn:hover {
  border-color: #007bff;
  color: #007bff;
  background: #f8f9fa;
}

.scale-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scale-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scale-range label {
  margin: 0;
  white-space: nowrap;
}

.scale-range span {
  color: #6c757d;
  font-size: 0.9rem;
}

.scale-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.label-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label-group label {
  font-size: 0.9rem;
  color: #495057;
  margin: 0;
}
</style> 