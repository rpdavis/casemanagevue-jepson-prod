// /Users/rd/CaseManageVue/src/components/students/StudentFilters.vue
<template>
  <div id="student-filters" class="student-filters-pro">
    <select v-model="filters.sortBy" @change="emitFilters">
      <option value="first_name">First Name</option>
      <option value="last_name">Last Name</option>
      <!-- other sort options -->
    </select>
    <select v-model="filters.cm" @change="emitFilters">
      <option value="all">All Case Managers</option>
      <option v-for="cm in caseManagers" :key="cm.id" :value="cm.id">{{ cm.name || cm.email || cm.id }}</option>
    </select>
    <select v-model="filters.teacher" @change="emitFilters">
      <option value="all">All Teachers</option>
      <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name || t.email || t.id }}</option>
    </select>
    <input type="text" v-model="filters.search" @input="emitFilters" placeholder="Search students...">
    <button @click="clearFilters">Clear Filters</button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  caseManagers: Array,
  teachers: Array,
  currentUserRole: String,
  currentUserId: String
})

const emit = defineEmits(['filter'])

const filters = reactive({
  sortBy: 'first_name',
  cm: 'all',
  teacher: 'all',
  search: ''
  // ... other filter properties
})

function emitFilters() {
  emit('filter', filters)
}

function clearFilters() {
  filters.sortBy = 'first_name'
  filters.cm = 'all'
  filters.teacher = 'all'
  filters.search = ''
  emitFilters()
}
</script>

<style scoped>
/* Professional, readable font and spacing for filters */
.student-filters-pro {
  font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
  font-size: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.2rem;
}
.student-filters-pro select, .student-filters-pro input {
  font-family: inherit;
  font-size: 1rem;
  padding: 0.35em 0.7em;
  border-radius: 5px;
  border: 1px solid #bfc7d1;
  background: #f8fafc;
  color: #222;
}
.student-filters-pro select:focus, .student-filters-pro input:focus {
  outline: 2px solid #1976d2;
  border-color: #1976d2;
}
.student-filters-pro button {
  font-family: inherit;
  font-size: 1rem;
  padding: 0.35em 1em;
  border-radius: 5px;
  border: 1px solid #bfc7d1;
  background: #e3eaf6;
  color: #1976d2;
  cursor: pointer;
  transition: background 0.15s;
}
.student-filters-pro button:hover {
  background: #d0e3fa;
}
</style>