// /Users/rd/CaseManageVue/src/components/students/StudentFilters.vue
<template>
  <div id="student-filters" class="student-filters-pro">
    <div class="filters-left">
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
    <div class="filters-right">
      <!-- Provider View Radio Buttons (for case managers) -->
      <div v-if="showProviderView" class="radio-group">
        <label class="radio-btn" :class="{ active: filters.providerView === 'all' }">
          <input type="radio" v-model="filters.providerView" value="all" @change="emitFilters">
          Show All
        </label>
        <label class="radio-btn" :class="{ active: filters.providerView === 'case_manager' }">
          <input type="radio" v-model="filters.providerView" value="case_manager" @change="emitFilters">
          Case Manager
        </label>
        <label class="radio-btn" :class="{ active: filters.providerView === 'service_provider' }">
          <input type="radio" v-model="filters.providerView" value="service_provider" @change="emitFilters">
          Service Provider
        </label>
        <span class="separator">|</span>
      </div>
      
      <!-- View Mode Radio Buttons -->
      <div class="radio-group">
        <span class="radio-label">View:</span>
        <label class="radio-btn" :class="{ active: filters.viewMode === 'list' }">
          <input type="radio" v-model="filters.viewMode" value="list" @change="emitFilters">
          List
        </label>
        <label class="radio-btn" :class="{ active: filters.viewMode === 'class' }">
          <input type="radio" v-model="filters.viewMode" value="class" @change="emitFilters">
          By Class
        </label>
        <label class="radio-btn" :class="{ active: filters.viewMode === 'testing' }">
          <input type="radio" v-model="filters.viewMode" value="testing" @change="emitFilters">
          Testing
        </label>
      </div>
      
      <button @click="printPage" class="print-btn">
        <span>🖨️</span> Print
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

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
  search: '',
  providerView: 'all',
  viewMode: 'list'
  // ... other filter properties
})

// Check if provider view should be shown
const showProviderView = computed(() => {
  return ['case_manager', 'administrator_504_CM', 'sped_chair'].includes(props.currentUserRole)
})

function emitFilters() {
  emit('filter', filters)
}

function clearFilters() {
  filters.sortBy = 'first_name'
  filters.cm = 'all'
  filters.teacher = 'all'
  filters.search = ''
  filters.providerView = 'all'
  filters.viewMode = 'list'
  emitFilters()
}

function printPage() {
  window.print()
}
</script>

<style scoped>
/* Professional, readable font and spacing for filters */
.student-filters-pro {
  font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
  font-size: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.filters-left {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filters-right {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.print-btn {
  background: #28a745 !important;
  color: white !important;
  border-color: #28a745 !important;
}

.print-btn:hover {
  background: #218838 !important;
}

/* Radio Button Styles */
.radio-group {
  display: flex;
  align-items: center;
  gap: 0;
}

.radio-label {
  font-weight: 500;
  color: #333;
  margin-right: 0.5rem;
}

.radio-btn {
  position: relative;
  display: inline-block;
  padding: 0.35em 0.8em;
  border: 1px solid #bfc7d1;
  border-radius: 0;
  background: #f8fafc;
  color: #666;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
  user-select: none;
  margin-left: -1px;
}

.radio-btn:first-child {
  border-radius: 5px 0 0 5px;
  margin-left: 0;
}

.radio-btn:last-child {
  border-radius: 0 5px 5px 0;
}

.radio-btn:hover {
  background: #e3eaf6;
  color: #1976d2;
  border-color: #1976d2;
  z-index: 1;
}

.radio-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
  z-index: 2;
}

.radio-btn input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.separator {
  color: #bfc7d1;
  font-weight: bold;
  margin: 0 0.5rem;
}
</style>