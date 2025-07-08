<template>
  <td>
    <button class="edit-btn" @click="$emit('edit', student.id)" title="Edit Student">✏️</button>
    <button class="email-btn" @click="$emit('email', student.id)" title="Email Student">✉️</button>
    <button v-if="currentUser?.role === 'teacher'" 
            class="teacher-feedback-btn" 
            @click="$emit('teacher-feedback', student.id)" 
            title="Teacher Feedback">📝</button>
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
</script> 