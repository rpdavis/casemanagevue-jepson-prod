<template>
  <div id="student-filters">
    <select v-model="filters.sortBy" @change="emitFilters">
      <option value="first_name">First Name</option>
      <option value="last_name">Last Name</option>
      <!-- other sort options -->
    </select>
    <select v-model="filters.cm" @change="emitFilters">
      <option value="all">All Case Managers</option>
      <option v-for="cm in caseManagers" :key="cm.id" :value="cm.id">{{ cm.initials }}</option>
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
  search: ''
  // ... other filter properties
})

function emitFilters() {
  emit('filter', filters)
}

function clearFilters() {
  filters.sortBy = 'first_name'
  filters.cm = 'all'
  filters.search = ''
  emitFilters()
}
</script>