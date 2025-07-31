<template>
  <td>
    <div class="action-buttons">
      <!-- Only show Edit for admins/sped_chair or case managers on their own caseload -->
      <button
        v-if="canEditStudent"
        class="edit-btn"
        @click="$emit('edit', student.id)"
        title="Edit Student"
      >✏️</button>
      <button class="email-btn" @click="$emit('email', student.id)" title="Email Student">✉️</button>
      <button v-if="canSendFeedback" 
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
import { computed } from 'vue'
import { RoleUtils } from '@/composables/roles/roleConfig'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    required: false
  },
  studentData: {
    type: Object,
    required: false
  }
})

const emit = defineEmits(['edit', 'email', 'teacher-feedback'])

// Determine if current user can edit this student
const canEditStudent = computed(() => {
  if (!props.currentUser?.role || !props.student) return false
  
  const role = props.currentUser.role
  const userId = props.currentUser.uid
  
  // Hide edit button for paraeducators and teachers
  if (role === 'paraeducator' || role === 'teacher') {
    return false
  }
  
  // Case managers can only edit students in their own caseload
  if (role === 'case_manager') {
    return props.student.app?.studentData?.caseManagerId === userId
  }
  
  // Admin roles (admin, administrator, sped_chair, administrator_504_CM, service_provider) can edit all students
  const adminRoles = ['admin', 'administrator', 'sped_chair', 'administrator_504_CM', 'service_provider']
  return adminRoles.includes(role)
})

// Determine if current user can send feedback forms for this student
const canSendFeedback = computed(() => {
  if (!props.currentUser?.role || !props.student || !props.studentData) return false
  
  return RoleUtils.canSendFeedback(
    props.currentUser.uid,
    props.currentUser.role,
    props.student,
    props.studentData
  )
})

// Helper function removed - now using centralized RoleUtils.canSendFeedback()

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