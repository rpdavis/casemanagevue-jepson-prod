<template>
  <div class="custom-tabs-config">
    <h5>Custom Teacher Tabs</h5>
    <p>Create custom tabs with data filtered by specific teachers</p>
    
    <!-- Add Tab Button -->
    <div class="add-tab-controls">
      <button 
        @click="$emit('toggleAddTabForm')" 
        :disabled="customTabs.length >= maxCustomTabs"
        class="btn-primary"
      >
        + Add Custom Tab
      </button>
      <span v-if="customTabs.length >= maxCustomTabs" class="max-tabs-warning">
        Maximum of {{ maxCustomTabs }} custom tabs allowed
      </span>
    </div>
    
    <!-- Add Tab Form -->
    <div v-if="showAddTabForm" class="add-tab-form">
      <div class="form-group">
        <label>Tab Name</label>
        <input 
          :value="newTabName"
          @input="$emit('update:newTabName', $event.target.value)"
          type="text" 
          class="form-input" 
          placeholder="e.g., Math Teachers"
          maxlength="30"
        >
      </div>
      
      <div class="form-group">
        <label>Select Teachers</label>
        <div class="teacher-checkboxes">
          <label 
            v-for="teacher in availableTeachers" 
            :key="teacher.id"
            class="checkbox-label"
          >
            <input 
              type="checkbox" 
              :value="teacher.id"
              :checked="selectedTeachers.includes(teacher.id)"
              @change="$emit('updateSelectedTeachers', teacher.id, $event.target.checked)"
            >
            {{ teacher.name }}
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label>Exclude Periods (Optional)</label>
        <div class="period-checkboxes">
          <label 
            v-for="period in availablePeriods" 
            :key="period.value"
            class="checkbox-label"
          >
            <input 
              type="checkbox" 
              :value="period.value"
              :checked="selectedExcludedPeriods.includes(period.value)"
              @change="$emit('updateSelectedExcludedPeriods', period.value, $event.target.checked)"
            >
            {{ period.label }}
          </label>
        </div>
      </div>
      
      <!-- Preview -->
      <StudentPreview 
        v-if="selectedTeachers.length > 0"
        :filtered-students="filteredStudentsPreview"
        :selected-teachers="selectedTeachers"
        :selected-excluded-periods="selectedExcludedPeriods"
        :get-student-teacher-periods="getStudentTeacherPeriods"
      />
      
      <div class="form-actions">
        <button @click="$emit('addCustomTab')" class="btn-primary">
          Create Tab
        </button>
        <button @click="$emit('resetForm')" class="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
    
    <!-- Existing Tabs -->
    <div v-if="customTabs.length > 0" class="existing-tabs">
      <h6>Current Custom Tabs</h6>
      <div v-for="tab in customTabs" :key="tab.id" class="tab-item">
        <div>
          <strong>{{ tab.name }}</strong>
          <span class="tab-teachers">
            {{ tab.teachers.length }} teacher(s), {{ tab.studentCount }} students
          </span>
        </div>
        <button @click="$emit('removeCustomTab', tab.id)" class="btn-danger btn-small">
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import StudentPreview from './StudentPreview.vue'

defineProps({
  customTabs: {
    type: Array,
    required: true
  },
  showAddTabForm: {
    type: Boolean,
    required: true
  },
  newTabName: {
    type: String,
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
  maxCustomTabs: {
    type: Number,
    required: true
  },
  availableTeachers: {
    type: Array,
    required: true
  },
  availablePeriods: {
    type: Array,
    required: true
  },
  filteredStudentsPreview: {
    type: Array,
    required: true
  },
  getStudentTeacherPeriods: {
    type: Function,
    required: true
  }
})

defineEmits([
  'toggleAddTabForm',
  'update:newTabName',
  'updateSelectedTeachers',
  'updateSelectedExcludedPeriods',
  'addCustomTab',
  'removeCustomTab',
  'resetForm'
])
</script>

<style scoped>
.custom-tabs-config {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.add-tab-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.max-tabs-warning {
  color: #dc3545;
  font-size: 0.9rem;
}

.add-tab-form {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.teacher-checkboxes,
.period-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.period-checkboxes {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.existing-tabs {
  margin-top: 1.5rem;
}

.tab-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.tab-teachers {
  color: #6c757d;
  font-size: 0.9rem;
  margin-left: 1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style> 