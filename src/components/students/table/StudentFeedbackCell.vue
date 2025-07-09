<template>
  <td class="feedback-cell">
    <div v-if="feedbackForms.length > 0" class="feedback-list">
      <div v-for="form in feedbackForms" :key="form.id" class="feedback-item">
        <div class="feedback-header">
          <span class="feedback-title">{{ form.title }}</span>
          <span class="feedback-date">{{ formatDate(form.createdAt) }}</span>
        </div>
        <div class="feedback-details">
          <span class="feedback-templates">{{ form.templates.join(', ') }}</span>
          <span class="feedback-responses">{{ form.responseCount || 0 }} responses</span>
        </div>
        <div class="feedback-actions">
          <button @click="openForm(form.responseUrl)" class="feedback-btn view-btn" title="View Form">
            📋
          </button>
          <button @click="openForm(form.sheetUrl)" class="feedback-btn responses-btn" title="View Responses">
            📊
          </button>
        </div>
      </div>
    </div>
    <div v-else class="no-feedback">
      <span class="no-feedback-text">No feedback forms</span>
      <button @click="$emit('create-feedback', student.id)" class="create-feedback-btn" title="Create Feedback Form">
        ➕
      </button>
    </div>
  </td>
</template>

<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  feedbackForms: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['create-feedback'])

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
}

const openForm = (url) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.feedback-cell {
  min-width: 200px;
  max-width: 300px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feedback-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  background: #f9f9f9;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.feedback-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: #333;
  line-height: 1.2;
  flex: 1;
}

.feedback-date {
  font-size: 0.7rem;
  color: #666;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.feedback-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}

.feedback-templates {
  font-size: 0.75rem;
  color: #555;
}

.feedback-responses {
  font-size: 0.7rem;
  color: #777;
}

.feedback-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.feedback-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.view-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.view-btn:hover {
  background: #bbdefb;
}

.responses-btn {
  background: #e8f5e8;
  color: #2e7d32;
}

.responses-btn:hover {
  background: #c8e6c9;
}

.no-feedback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #666;
  text-align: center;
}

.no-feedback-text {
  font-size: 0.8rem;
  color: #888;
}

.create-feedback-btn {
  padding: 0.5rem;
  border: 2px dashed #ccc;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.2s;
}

.create-feedback-btn:hover {
  border-color: #2a79c9;
  color: #2a79c9;
  background: #f8f9fa;
}
</style> 