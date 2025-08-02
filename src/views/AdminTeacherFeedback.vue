<!-- src/views/AdminTeacherFeedback.vue -->
<template>
  <div class="teacher-feedback-admin">
    <div class="admin-header">
      <h2>Teacher Feedback Forms</h2>
      <p class="admin-description">
        Create and manage Google Forms for collecting teacher feedback on students. 
        Each case manager will have their own response sheet automatically created when they first use the form.
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
              <label>Google Sheet Template URL (optional):</label>
              <input 
                type="url" 
                v-model="sheetTemplateUrl" 
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                class="form-input"
              >
              <small class="form-help">Optional: Provide a Google Sheet template that case managers can duplicate for collecting responses</small>
            </div>

            <div class="form-info">
              <h4>📋 Setup Instructions:</h4>
              <ol>
                <li>Create your Google Form manually with the questions you want</li>
              <li>Make sure to enable "Collect email addresses" in form settings</li>
              <li>Copy the form's view URL and paste it above</li>
              <li>Click "Add Form" - a Google Sheet will be automatically created for responses</li>
              </ol>
            <p class="info-note">
              <strong>✅ Automatic:</strong> A Google Sheet will be created immediately when you add the form. 
              Each case manager will get their own copy of this sheet when they use the form.
            </p>
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

    <!-- Google Drive Setup Section -->
    <div class="setup-section">
      <h3>Google Drive Setup</h3>
      <p class="section-description">
        Configure how the system accesses Google Drive for creating feedback forms and response sheets.
      </p>
      
      <!-- Loading State -->
      <div v-if="driveLoading" class="loading-state">
        <p>Loading Google Drive settings...</p>
      </div>
      
      <!-- Current Status -->
      <div v-else-if="schoolInfo" class="status-card">
        <div class="status-header">
          <h4>{{ schoolInfo.name || 'Your School' }}</h4>
          <div class="status-indicator">
            <span v-if="schoolInfo.sharedDriveId" class="status-badge success">
              ✅ Google Workspace Mode
            </span>
            <span v-else class="status-badge info">
              📁 Personal Google Drive Mode
            </span>
          </div>
        </div>
        
        <div class="status-details">
          <p><strong>Current Mode:</strong> 
            <span v-if="schoolInfo.sharedDriveId">Google Workspace Shared Drive</span>
            <span v-else>Personal Google Drive</span>
          </p>
          <p v-if="schoolInfo.sharedDriveId">
            <strong>Shared Drive:</strong> {{ schoolInfo.sharedDriveName || 'CaseManageVue Templates' }}
          </p>
          <p v-if="!schoolInfo.sharedDriveId" class="info-note">
            <strong>Note:</strong> Files will be created in your personal Google Drive when you create forms.
          </p>
        </div>
        
        <div v-if="schoolInfo.sharedDriveId" class="drive-actions">
          <a 
            :href="`https://drive.google.com/drive/folders/${schoolInfo.sharedDriveId}`" 
            target="_blank" 
            class="secondary-btn"
          >
            📂 Open Shared Drive
          </a>
        </div>
      </div>
      
      <!-- Setup Options (Only show if not configured) -->
      <div v-if="!driveLoading && (!schoolInfo?.sharedDriveId)" class="setup-options">
        <div class="setup-card">
          <h4>📁 Personal Google Drive (Recommended for Testing)</h4>
          <p class="setup-description">
            Use your personal Google account to create forms and sheets. Files will be created in your personal Drive.
          </p>
          <div class="setup-note">
            <strong>✅ Ready to use:</strong> No additional setup required. When you create forms, you'll be prompted to sign in with your Google account.
          </div>
        </div>
        
        <div class="setup-card">
          <h4>🌐 Google Workspace (For Organizations)</h4>
          <p class="setup-description">
            Use a Google Workspace Shared Drive for organization-wide access and management.
          </p>
          
          <div class="workspace-setup">
            <div class="form-group">
              <label for="workspaceDriveName">Shared Drive Name:</label>
              <input 
                id="workspaceDriveName"
                v-model="workspaceDriveName" 
                type="text" 
                class="form-input"
                placeholder="e.g., CaseManageVue - School Name"
                :disabled="isSettingUpWorkspace"
              />
            </div>
            
            <button 
              @click="setupWorkspace" 
              class="primary-btn"
              :disabled="isSettingUpWorkspace || !workspaceDriveName.trim()"
            >
              <span v-if="isSettingUpWorkspace">🔄 Setting up...</span>
              <span v-else>Setup Google Workspace</span>
            </button>
            
            <div class="workspace-note">
              <strong>Note:</strong> This requires Google Workspace admin permissions and manual configuration.
            </div>
          </div>
        </div>
      </div>
      
      <!-- Drive Setup Messages -->
      <div v-if="driveMessage" class="alert" :class="driveMessageType">
        {{ driveMessage }}
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
            <p v-if="form.spreadsheetUrl">
              <strong>Response Sheet:</strong> 
              <a :href="form.spreadsheetUrl" target="_blank" class="form-link">View Responses</a>
              <span class="sheet-status">✅ Auto-created</span>
            </p>
            <p v-else class="sheet-status pending">⏳ Sheet will be created when form is first used</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Dynamic Document Manager removed - functionality no longer available -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTeacherFeedback } from '@/composables/useTeacherFeedback'
import useStudents from '@/composables/useStudents'
import useUsers from '@/composables/useUsers'
import { useAuthStore } from '@/store/authStore'

// Composables
const { 
  isLoading,
  error,
  successMessage,
  formsLoading,
  feedbackForms,
  activeForms,
  createFeedbackForm,
  createFeedbackFormWithUserAuth,
  updateFeedbackForm,
  deleteFeedbackForm,
  clearMessages,
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
const sheetTemplateUrl = ref('')

// Google Drive Setup State
const schoolInfo = ref(null)
const driveLoading = ref(true)
const driveMessage = ref('')
const driveMessageType = ref('info')
const workspaceDriveName = ref('')
const isSettingUpWorkspace = ref(false)

// Computed
const canAddForm = computed(() => {
  return formTitle.value.trim() && formUrl.value.trim()
})

// Methods
const addForm = async () => {
  if (!canAddForm.value) return
  
  try {
    clearMessages()
    
    // Get Google access token for personal account
    const { GoogleAuthProvider, signInWithPopup, getAuth } = await import('firebase/auth')
    const auth = getAuth()
    
    // Create Google Auth provider with Drive scopes
    const provider = new GoogleAuthProvider()
    provider.addScope('https://www.googleapis.com/auth/drive.file')
    provider.addScope('https://www.googleapis.com/auth/spreadsheets')
    
    // Sign in with popup to get Google Drive access
    // Note: This popup is necessary for Google Drive API access
    // We'll handle COOP errors gracefully
    let result
    try {
      result = await signInWithPopup(auth, provider)
    } catch (popupError) {
      if (popupError.code === 'auth/popup-closed-by-user' || 
          popupError.message.includes('Cross-Origin-Opener-Policy')) {
        throw new Error('❌ Authentication popup was blocked or closed. Please allow popups for this site and try again.')
      }
      throw popupError
    }
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential.accessToken
    
    if (!accessToken) {
      throw new Error('Failed to get Google access token. Please try again.')
    }
    
    console.log('✅ Got Google access token for feedback form creation')
    
    const formData = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim(),
      formUrl: formUrl.value.trim(),
      sheetTemplateUrl: sheetTemplateUrl.value.trim(),
      createdBy: authStore.user.uid
    }
    
    await createFeedbackFormWithUserAuth(formData, accessToken)
    closeCreateForm()
    
  } catch (error) {
    console.error('Error adding form:', error)
    
    if (error.code === 'auth/popup-closed-by-user') {
      error.value = '❌ Authentication cancelled. Please try again and allow Google Drive access.'
    } else if (error.code === 'auth/popup-blocked') {
      error.value = '❌ Popup blocked. Please allow popups for this site and try again.'
    } else if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
      error.value = '❌ Browser security policy blocked the authentication popup. Please try again or contact support.'
    } else {
      error.value = error.message || 'Failed to create feedback form'
    }
  }
}

const closeCreateForm = () => {
  showCreateModal.value = false
  formTitle.value = ''
  formDescription.value = ''
  formUrl.value = ''
  sheetTemplateUrl.value = ''
  clearMessages()
}

const openForm = (form) => {
  window.open(form.formUrl, '_blank', 'noopener,noreferrer')
}

const editForm = async (form) => {
  // For now, just open the form URL for editing
  window.open(form.formUrl, '_blank', 'noopener,noreferrer')
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

const formatDate = (date) => {
  if (!date) return 'N/A'
  const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date)
  return dateObj.toLocaleDateString()
}

// Google Drive Setup Methods
const loadSchoolInfo = async () => {
  try {
    driveLoading.value = true
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions()
    const getUserSchool = httpsCallable(functions, 'getUserSchool')
    
    const result = await getUserSchool()
    
    if (result.data.success && result.data.school) {
      schoolInfo.value = result.data.school
    } else {
      // Create school if it doesn't exist
      await createSchool()
    }
  } catch (error) {
    console.error('Error loading school info:', error)
    driveMessage.value = 'Error loading Google Drive settings'
    driveMessageType.value = 'error'
  } finally {
    driveLoading.value = false
  }
}

const createSchool = async () => {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions()
    const getOrCreateSchool = httpsCallable(functions, 'getOrCreateSchool')
    
    const result = await getOrCreateSchool()
    
    if (result.data.success) {
      schoolInfo.value = result.data.school
      
      if (result.data.school.isNew) {
        driveMessage.value = 'Google Drive settings initialized! You can now create feedback forms.'
        driveMessageType.value = 'success'
      }
    }
  } catch (error) {
    console.error('Error creating school:', error)
    driveMessage.value = 'Error initializing Google Drive settings: ' + error.message
    driveMessageType.value = 'error'
  }
}

const setupWorkspace = async () => {
  if (!workspaceDriveName.value.trim()) return
  
  isSettingUpWorkspace.value = true
  driveMessage.value = ''
  
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions()
    const createSharedDrive = httpsCallable(functions, 'createSharedDrive')
    
    const result = await createSharedDrive({
      schoolId: schoolInfo.value.schoolId,
      driveName: workspaceDriveName.value.trim()
    })
    
    if (result.data.requiresManualCreation) {
      // Show instructions for manual creation
      const instructions = result.data.instructions
      const serviceAccountEmail = result.data.serviceAccountEmail
      
      driveMessage.value = `Google Workspace setup requires manual configuration:\n\n1. ${instructions.join('\n2. ')}\n\nService Account Email: ${serviceAccountEmail}`
      driveMessageType.value = 'info'
    } else if (result.data.success) {
      driveMessage.value = 'Google Workspace setup completed successfully!'
      driveMessageType.value = 'success'
      await loadSchoolInfo() // Reload to get updated info
      workspaceDriveName.value = ''
    } else {
      driveMessage.value = 'Error setting up Google Workspace: ' + result.data.error
      driveMessageType.value = 'error'
    }
  } catch (error) {
    console.error('Error setting up workspace:', error)
    driveMessage.value = 'Error setting up Google Workspace: ' + error.message
    driveMessageType.value = 'error'
  } finally {
    isSettingUpWorkspace.value = false
  }
}

// Initialize Google Drive settings on mount
onMounted(async () => {
  await loadSchoolInfo()
})
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

.primary-btn:disabled, .secondary-btn:disabled, .danger-btn:disabled {
  opacity: 0.7;
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
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  padding: 0;
  color: #666;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-textarea {
  resize: vertical;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.form-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.form-info h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
}

.form-info ol {
  margin: 0;
  padding-left: 1.25rem;
}

.form-info li {
  margin-bottom: 0.5rem;
  color: #495057;
}

.info-note {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  color: #495057;
  font-size: 0.95rem;
}

.forms-list {
  margin-top: 2rem;
}

.forms-list h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.form-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
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
}

.admin-action-btns {
  display: flex;
  gap: 0.5rem;
}

.admin-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.admin-action-btn:hover {
  background: #f8f9fa;
}

.form-meta {
  color: #666;
  font-size: 0.9rem;
}

.form-meta p {
  margin: 0.5rem 0;
}

.form-link {
  color: #2a79c9;
  text-decoration: none;
}

.form-link:hover {
  text-decoration: underline;
}

.sheet-status {
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background: #d4edda;
  color: #155724;
}

.sheet-status.pending {
  background: #fff3cd;
  color: #856404;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

.empty-state p {
  margin: 0.5rem 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.document-manager-section {
  margin-top: 3rem;
  border-top: 2px solid #dee2e6;
  padding-top: 2rem;
}

/* New styles for Google Drive Setup */
.setup-section {
  margin-top: 3rem;
  border-top: 2px solid #dee2e6;
  padding-top: 2rem;
}

.setup-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.section-description {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.status-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-header h4 {
  margin: 0;
  color: #333;
}

.status-indicator {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.status-badge.success {
  background-color: #4caf50; /* Green */
}

.status-badge.info {
  background-color: #2196f3; /* Blue */
}

.status-details {
  margin-bottom: 1.5rem;
  color: #495057;
  font-size: 0.9rem;
}

.status-details p {
  margin: 0.5rem 0;
}

.drive-actions {
  display: flex;
  justify-content: flex-start;
}

.setup-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.setup-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.setup-card h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
}

.setup-description {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.setup-note {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  color: #1976d2;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.workspace-setup {
  margin-top: 1.5rem;
}

.workspace-setup .form-group {
  margin-bottom: 1rem;
}

.workspace-setup label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.workspace-setup input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.95rem;
}

.workspace-note {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  color: #495057;
  font-size: 0.85rem;
}

.alert {
  padding: 0.75rem 1rem;
  margin-top: 1.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.alert.success {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.alert.info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.alert.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}
</style> 