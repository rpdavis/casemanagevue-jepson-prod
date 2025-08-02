// Users/rd/CaseManageVue/src/components/students/StudentEditDialog.vue

<template>
  <div v-if="student && Object.keys(student).length > 0">
    <StudentForm
      :student="student"
      :users="users"
      mode="edit"
      @close="$emit('close')"
      @saved="handleSaved"
    />
  </div>
  <div v-else class="loading-dialog">
    <div class="dialog">
      <header>
        <h2>Loading Student Data...</h2>
      </header>
      <div class="content">
        <p>Please wait while we load the student information.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import useStudents from '@/composables/useStudents'
import StudentForm from './StudentForm.vue'

const props = defineProps({
  studentId: { type: String, required: true },
  users: { type: Object, required: true }
})

const emit = defineEmits(['close', 'saved'])

const { students, fetchStudents } = useStudents()

// Get student data from the students list
const student = computed(() => {
  const foundStudent = students.value.find(s => s.id === props.studentId)
  console.log('📋 StudentEditDialog - studentId:', props.studentId)
  console.log('📋 StudentEditDialog - students count:', students.value.length)
  console.log('📋 StudentEditDialog - found student:', foundStudent ? 
    { id: foundStudent.id, hasApp: !!foundStudent.app, keys: Object.keys(foundStudent) } : 
    'NOT FOUND')
  
  if (foundStudent) {
    console.log('📋 StudentEditDialog - student data preview:', {
      id: foundStudent.id,
      firstName: foundStudent.app?.studentData?.firstName,
      lastName: foundStudent.app?.studentData?.lastName,
      plan: foundStudent.app?.studentData?.plan,
      caseManagerId: foundStudent.app?.studentData?.caseManagerId
    })
  }
  
  return foundStudent || {}
})

// Fetch students if not already loaded
onMounted(async () => {
  if (students.value.length === 0) {
    console.log('StudentEditDialog - fetching students...')
    await fetchStudents()
  }
})

function handleSaved(studentData) {
  console.log('StudentEditDialog - student saved:', studentData)
  emit('saved', studentData)
}
</script>

<style scoped>
.loading-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 400px;
  max-width: 90%;
}

header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

header h2 {
  margin: 0;
  color: #333;
  text-align: center;
}

.content {
  padding: 20px;
  text-align: center;
}

.content p {
  margin: 0;
  color: #666;
}
</style>