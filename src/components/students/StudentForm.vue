<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>{{ mode === 'edit' ? 'Edit Student' : 'Add Student' }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </header>
      
      <form @submit.prevent="handleSubmit" id="student-form">
        <!-- Student Basic Info -->
        <StudentBasicInfo
          :form="form"
          :mode="mode"
          :grade-options="gradeOptions"
          :user-roles="userRoles"
        />

        <!-- Student Schedule -->
        <StudentSchedule
          :form="form"
          :periods="periods"
          :user-roles="userRoles"
          :app-settings="appSettings"
        />

        <!-- Class Services -->
        <StudentClassServices
          :form="form"
          :available-class-services="availableClassServices"
          :app-settings-loading="appSettingsLoading"
          :app-settings-error="appSettingsError"
        />

        <!-- Service Providers -->
        <StudentProviders
          :form="form"
          :service-providers="serviceProviders"
          :custom-service-providers="customServiceProviders"
          :provider-field-map="providerFieldMap"
          :get-provider-label="getProviderLabel"
          :get-provider-users="getProviderUsers"
        />

        <!-- Documents -->
        <StudentDocuments
          :form="form"
          :student="student"
          :mode="mode"
          :on-file-change="onFileChange"
          :remove-bip-file="removeBipFile"
          :remove-ataglance-file="removeAtaglanceFile"
          @loading-change="onFileLoadingChange"
        />

        <!-- Accommodations -->
        <StudentAccommodations
          :form="form"
        />

        <!-- Flags -->
        <StudentFlags
          :form="form"
        />

        <!-- Form Actions -->
        <footer>
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isFormBusy">
            {{ saveButtonText }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStudentForm } from './form/useStudentForm.js'
import StudentBasicInfo from './form/StudentBasicInfo.vue'
import StudentSchedule from './form/StudentSchedule.vue'
import StudentClassServices from './form/StudentClassServices.vue'
import StudentProviders from './form/StudentProviders.vue'
import StudentDocuments from './form/StudentDocuments.vue'
import StudentAccommodations from './form/StudentAccommodations.vue'
import StudentFlags from './form/StudentFlags.vue'

// Props
const props = defineProps({
  student: { type: Object, default: () => ({}) },
  users: { type: Object, required: true },
  mode: { type: String, default: 'new' }
})

// Emits
const emit = defineEmits(['close', 'saved'])

// Use the composable for all business logic
const {
  // Form state
  form,
  isSaving,
  
  // App settings
  appSettings,
  appSettingsLoading,
  appSettingsError,
  
  // Computed properties
  periods,
  gradeOptions,
  availableClassServices,
  serviceProviders,
  customServiceProviders,
  userRoles,
  
  // File handling
  onFileChange,
  removeBipFile,
  removeAtaglanceFile,
  
  // Provider utilities
  providerFieldMap,
  getProviderLabel,
  getProviderUsers,
  
  // Form submission
  handleSubmit,
  validateForm
} = useStudentForm(props, emit)

// File loading state
const isLoadingFiles = ref(false)

// Combined loading state
const isFormBusy = computed(() => {
  return isSaving.value || isLoadingFiles.value
})

// Loading button text
const saveButtonText = computed(() => {
  if (isLoadingFiles.value) {
    return 'Loading files...'
  } else if (isSaving.value) {
    return 'Saving...'
  } else {
    return props.mode === 'edit' ? 'Save' : 'Add Student'
  }
})

// Handle file loading changes from StudentDocuments
const onFileLoadingChange = (loading) => {
  isLoadingFiles.value = loading
}
</script>

<style scoped>
/* Keep existing styles from the original component */
.dialog-backdrop {
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
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.dialog header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

#student-form {
  padding: 20px;
}

fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
}

legend {
  font-weight: bold;
  color: #333;
  padding: 0 8px;
}

.form-col {
  display: block;
}

.inner-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.inner-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 500;
}

input, select, textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
