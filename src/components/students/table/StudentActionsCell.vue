<template>
  <td>
    <div class="action-buttons">
      <button class="edit-btn" @click="$emit('edit', student.id)" title="Edit Student">✏️</button>
      <button class="email-btn" @click="$emit('email', student.id)" title="Email Student">✉️</button>
      <button v-if="currentUser?.role === 'case_manager'" 
              class="teacher-feedback-btn" 
              @click="$emit('teacher-feedback', student.id)" 
              title="Send Teacher Feedback Form">📝</button>
    </div>
    <div v-if="student?.updatedAt?.seconds" class="updated-date" :title="'Last Updated: ' + formatDate(student.updatedAt)">
      {{ formatDate(student.updatedAt, true) }}
    </div>
  </td>
</template>

<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    required: false
  }
})

const emit = defineEmits(['edit', 'email', 'teacher-feedback'])

function formatDate(timestamp, shortFormat = false) {
  if (!timestamp?.seconds) return '';
  
  const date = new Date(timestamp.seconds * 1000);
  
  if (shortFormat) {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit'
    });
  }

  // Format: "July 10, 2025 at 9:56:30 PM UTC-7"
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
}
</script>

<style scoped>
td {
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  padding: 0.5rem !important;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  border: initial;
  background: none;
  padding: 0;
  margin: 0 auto;
}

.action-buttons button {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: solid #bfc7d1 1px;
}

.updated-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding: 0.2rem 0.4rem;
  border-radius: var(--border-radius-sm);
  background: #f5f5f5;
  cursor: help;
  transition: all var(--transition-base);
  margin-top: auto;
}

.updated-date:hover {
  background: #e3eaf6;
  color: var(--primary-color);
}
</style> 