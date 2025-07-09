<template>
  <div class="preview-section">
    <h6>Preview ({{ filteredStudents.length }} students)</h6>
    <div class="preview-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Grade</th>
            <th>Period</th>
            <th>Teacher</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in displayedStudents" :key="student.id">
            <td>{{ getStudentName(student) }}</td>
            <td>{{ getStudentGrade(student) }}</td>
            <td>
              <span v-for="(period, idx) in getStudentPeriods(student)" :key="idx">
                {{ period.period }}<span v-if="idx < getStudentPeriods(student).length - 1">, </span>
              </span>
            </td>
            <td>
              <span v-for="(period, idx) in getStudentPeriods(student)" :key="idx">
                {{ period.teacherName }}<span v-if="idx < getStudentPeriods(student).length - 1">, </span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="filteredStudents.length > maxDisplayed" class="preview-note">
        ... and {{ filteredStudents.length - maxDisplayed }} more students
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getDisplayValue } from '@/utils/studentUtils'

const props = defineProps({
  filteredStudents: {
    type: Array,
    required: true
  },
  selectedTeachers: {
    type: Array,
    required: true
  },
  selectedExcludedPeriods: {
    type: Array,
    required: true
  },
  getStudentTeacherPeriods: {
    type: Function,
    required: true
  }
})

const maxDisplayed = 5

const displayedStudents = computed(() => {
  return props.filteredStudents.slice(0, maxDisplayed)
})

const getStudentName = (student) => {
  const firstName = getDisplayValue(student, 'firstName') || ''
  const lastName = getDisplayValue(student, 'lastName') || ''
  return `${firstName} ${lastName}`.trim()
}

const getStudentGrade = (student) => {
  return getDisplayValue(student, 'grade') || ''
}

const getStudentPeriods = (student) => {
  return props.getStudentTeacherPeriods(student, props.selectedTeachers, props.selectedExcludedPeriods)
}
</script>

<style scoped>
.preview-section {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.preview-table {
  overflow-x: auto;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.preview-table th,
.preview-table td {
  border: 1px solid #dee2e6;
  padding: 0.5rem;
  text-align: left;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.preview-note {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  font-style: italic;
}
</style> 