<template>
  <div class="modal-overlay" @click="closeDialog">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Send Teacher Feedback Form</h3>
        <button @click="closeDialog" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Student Info -->
        <div class="student-info">
          <h4>{{ student.firstName }} {{ student.lastName }} (Grade {{ student.grade }})</h4>
          <p class="case-manager-info">Case Manager: {{ currentUser?.name || currentUser?.email }}</p>
        </div>

        <!-- Available Forms -->
        <div class="form-group">
          <label>Select Feedback Form to Send:</label>
          <div v-if="availableForms.length === 0" class="no-forms-message">
            <p>No feedback forms available. Forms must be created in the Admin Panel first.</p>
            <p><em>Contact your administrator to create feedback forms.</em></p>
          </div>
          <div v-else class="form-selection">
            <div v-for="form in availableForms" :key="form.id" class="form-option">
              <input 
                type="radio" 
                :id="form.id" 
                :value="form.id" 
                v-model="selectedFormId"
              >
                          <label :for="form.id" class="form-option-label">
              <div class="form-title">{{ form.title }}</div>
              <div class="form-details">
                <span class="form-description" v-if="form.description">{{ form.description }}</span>
                <span class="form-date">Created: {{ formatDate(form.createdAt) }}</span>
              </div>
            </label>
            </div>
          </div>
        </div>

        <!-- Teacher Selection -->
        <div v-if="selectedFormId" class="form-group">
          <label>Select Teachers to Send Form To:</label>
          <div class="teacher-selection">
            <div v-if="teachersForStudent.length === 0" class="no-teachers-message">
              <p>No teachers found for this student's schedule.</p>
            </div>
            <div v-else class="teacher-checkboxes">
              <div v-for="teacher in teachersForStudent" :key="teacher.id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :id="`teacher-${teacher.id}`" 
                  :value="teacher" 
                  v-model="selectedTeachers"
                >
                <label :for="`teacher-${teacher.id}`">
                  {{ teacher.name || teacher.email }} 
                  <span class="teacher-email">({{ teacher.email }})</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Send Options -->
        <div v-if="selectedFormId && selectedTeachers.length > 0" class="form-group">
          <label>Send Method:</label>
          <div class="send-options">
            <div class="option-item">
              <input type="radio" id="copy-link" value="copy" v-model="sendMethod">
              <label for="copy-link">Copy form link to clipboard</label>
            </div>
            <div class="option-item">
              <input type="radio" id="email-link" value="email" v-model="sendMethod">
              <label for="email-link">Generate email with form link</label>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        <div v-if="statusMessage" :class="['status-message', statusType]">
          {{ statusMessage }}
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeDialog" class="secondary-btn">Cancel</button>
        <button 
          @click="sendForm" 
          class="primary-btn"
          :disabled="!canSendForm || isProcessing"
        >
          <span v-if="isProcessing">Sending...</span>
          <span v-else>{{ sendMethod === 'copy' ? 'Copy Link' : 'Generate Email' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTeacherFeedback } from '@/composables/useTeacherFeedback.js'
import useUsers from '@/composables/useUsers.js'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'form-sent'])

// Composables
const { activeForms, sendFeedbackForm } = useTeacherFeedback()
const { users } = useUsers()

// State
const selectedFormId = ref('')
const selectedTeachers = ref([])
const sendMethod = ref('copy')
const statusMessage = ref('')
const statusType = ref('success')
const isProcessing = ref(false)

// Computed
const availableForms = computed(() => {
  // Return all active forms created in admin
  return activeForms.value || []
})

const teachersForStudent = computed(() => {
  if (!props.student || !users.value) return []
  
  const teacherIds = new Set()
  
  // Get teachers from schedule data
  if (props.student.app?.schedule?.periods) {
    Object.values(props.student.app.schedule.periods).forEach(teacherId => {
      if (teacherId) teacherIds.add(teacherId)
    })
  }
  
  // Get teachers from aeries data
  if (props.student.aeries?.schedule) {
    Object.values(props.student.aeries.schedule).forEach(period => {
      if (period?.teacherId) teacherIds.add(period.teacherId)
    })
  }
  
  // Convert to teacher objects
  return Array.from(teacherIds)
    .map(id => users.value.find(u => u.id === id))
    .filter(Boolean)
    .filter(user => user.role === 'teacher')
})

const selectedForm = computed(() => {
  return availableForms.value.find(form => form.id === selectedFormId.value)
})

const canSendForm = computed(() => {
  return selectedFormId.value && selectedTeachers.value.length > 0 && sendMethod.value
})

// Methods
const formatDate = (date) => {
  if (!date) return ''
  const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date)
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const sendForm = async () => {
  if (!canSendForm.value) return
  
  try {
    isProcessing.value = true
    statusMessage.value = ''
    
    const form = selectedForm.value
    const teacherEmails = selectedTeachers.value.map(t => t.email)
    const teacherNames = selectedTeachers.value.map(t => t.name || t.email).join(', ')
    
    if (sendMethod.value === 'copy') {
      // Copy form link to clipboard
      await navigator.clipboard.writeText(form.formUrl)
      statusMessage.value = `Form link copied to clipboard! Send to: ${teacherNames}`
      statusType.value = 'success'
      
      // Record that form was sent locally
      recordFormSent(form, selectedTeachers.value)
      
    } else if (sendMethod.value === 'email') {
      // Send via Cloud Function
      try {
        const result = await sendFeedbackForm({
          formUrl: form.formUrl,
          studentId: props.student.id,
          teacherEmails: teacherEmails,
          formTitle: form.title,
          customMessage: null // Use default message
        })
        
        if (result.success) {
          statusMessage.value = `Successfully sent to ${result.sent} teachers`
          if (result.failed > 0) {
            statusMessage.value += ` (${result.failed} failed)`
          }
          statusType.value = 'success'
        } else {
          throw new Error('Failed to send emails')
        }
        
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        statusMessage.value = 'Failed to send emails. Generating mailto link instead.'
        statusType.value = 'error'
        
        // Fallback to mailto
        const subject = `Teacher Feedback Request - ${props.student.firstName} ${props.student.lastName}`
        const body = `Dear Teachers,

I am requesting your feedback for ${props.student.firstName} ${props.student.lastName} (Grade ${props.student.grade}).

Please complete the following feedback form:
${form.formUrl}

Form: ${form.title}

Thank you for your time and feedback.

Best regards,
${props.currentUser.name || props.currentUser.email}
Case Manager`

        const mailtoLink = `mailto:${teacherEmails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoLink, '_blank')
        
        statusMessage.value = `Email client opened for: ${teacherNames}`
        statusType.value = 'success'
      }
      
      // Record that form was sent
      recordFormSent(form, selectedTeachers.value)
    }
    
    // Emit success event
    emit('form-sent', {
      form: form,
      student: props.student,
      teachers: selectedTeachers.value,
      method: sendMethod.value
    })
    
  } catch (error) {
    console.error('Error sending form:', error)
    statusMessage.value = 'Failed to send form. Please try again.'
    statusType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}

const recordFormSent = (form, teachers) => {
  // Store form sending record in localStorage for tracking
  const sentForms = JSON.parse(localStorage.getItem('casemanage_sent_forms') || '[]')
  
  const record = {
    id: `${form.id}_${props.student.id}_${Date.now()}`,
    formId: form.id,
    formTitle: form.title,
    formUrl: form.formUrl,
    studentId: props.student.id,
    studentName: `${props.student.firstName} ${props.student.lastName}`,
    caseManagerId: props.currentUser.uid,
    caseManagerName: props.currentUser.name || props.currentUser.email,
    teachers: teachers.map(t => ({ id: t.id, name: t.name, email: t.email })),
    sentAt: new Date().toISOString(),
    method: sendMethod.value
  }
  
  sentForms.push(record)
  localStorage.setItem('casemanage_sent_forms', JSON.stringify(sentForms))
}

const closeDialog = () => {
  emit('close')
}

// Initialize
onMounted(() => {
  // Reset state
  selectedFormId.value = ''
  selectedTeachers.value = []
  sendMethod.value = 'copy'
  statusMessage.value = ''
})
</script>

<style scoped>
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

.student-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #2a79c9;
}

.student-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.case-manager-info {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
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

.no-forms-message {
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
}

.no-forms-message p {
  margin: 0.5rem 0;
}

.form-selection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.form-option:hover {
  border-color: #2a79c9;
  background: #f8f9fa;
}

.form-option input[type="radio"] {
  margin-top: 0.25rem;
}

.form-option-label {
  flex: 1;
  cursor: pointer;
  margin: 0;
}

.form-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.form-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-templates, .form-date {
  font-size: 0.9rem;
  color: #666;
}

.teacher-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

.no-teachers-message {
  color: #666;
  font-style: italic;
}

.teacher-checkboxes {
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

.teacher-email {
  color: #666;
  font-size: 0.9rem;
}

.send-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-item input[type="radio"] {
  margin: 0;
}

.option-item label {
  margin: 0;
  cursor: pointer;
}

.status-message {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  margin-top: 1rem;
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

.primary-btn, .secondary-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
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

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 