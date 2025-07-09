<template>
  <td class="feedback-cell">
    <div v-if="sentForms.length > 0" class="feedback-list">
      <div v-for="record in sentForms" :key="record.id" class="feedback-item">
        <div class="feedback-header">
          <span class="feedback-title">{{ record.formTitle }}</span>
          <span class="feedback-date">{{ formatDate(record.sentAt) }}</span>
        </div>
        <div class="feedback-details">
          <span class="feedback-method">{{ record.method === 'copy' ? 'Link copied' : 'Email sent' }}</span>
          <span class="feedback-teachers">To: {{ record.teachers.map(t => t.name || t.email).join(', ') }}</span>
        </div>
        <div class="feedback-actions">
          <button @click="showDetails(record)" class="feedback-btn details-btn" title="View Details">
            👁️
          </button>
        </div>
      </div>
    </div>
    <div v-else class="no-feedback">
      <span class="no-feedback-text">No forms sent</span>
    </div>
  </td>
</template>

<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  sentForms: {
    type: Array,
    default: () => []
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
}

const showDetails = (record) => {
  // Show details in an alert for now (could be enhanced with a modal)
  const details = `
Form: ${record.formTitle}
Sent: ${formatDate(record.sentAt)}
Method: ${record.method === 'copy' ? 'Link copied to clipboard' : 'Email generated'}
Case Manager: ${record.caseManagerName}
Teachers: ${record.teachers.map(t => `${t.name || t.email} (${t.email})`).join(', ')}
  `.trim()
  
  alert(details)
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

.feedback-method, .feedback-teachers {
  font-size: 0.75rem;
  color: #555;
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

.details-btn {
  background: #f3e5f5;
  color: #7b1fa2;
}

.details-btn:hover {
  background: #e1bee7;
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