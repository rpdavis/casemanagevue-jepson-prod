<template>
  <div class="student-form-container">
    <h2>{{ mode === 'new' ? 'Add New Student' : 'Edit Student' }}</h2>
    <form @submit="onSubmit">
      <div class="form-row">
        <div class="form-col">
          <StudentBasicInfo
            :student="form.student"
            :mode="mode"
            :users="users"
            @update:student="form.student = $event"
            @update:caseManagerId="form.caseManagerId = $event"
          />
        </div>
        <div class="form-col">
          <StudentSchedule
            :schedule="form.schedule"
            :periods="periods"
            :gradeOptions="gradeOptions"
            @update:schedule="form.schedule = $event"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-col">
          <StudentClassServices
            :services="form.services"
            :availableClassServices="availableClassServices"
            :serviceProviders="serviceProviders"
            :customServiceProviders="customServiceProviders"
            :providerFieldMap="providerFieldMap"
            :getProviderLabel="getProviderLabel"
            :getProviderUsers="getProviderUsers"
            @update:services="form.services = $event"
          />
        </div>
        <div class="form-col">
          <StudentProviders
            :providers="form.providers"
            :serviceProviders="serviceProviders"
            :customServiceProviders="customServiceProviders"
            :providerFieldMap="providerFieldMap"
            :getProviderLabel="getProviderLabel"
            :getProviderUsers="getProviderUsers"
            @update:providers="form.providers = $event"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-col">
          <StudentDocuments
            :files="form.files"
            :onFileChange="onFileChange"
            :removeBipFile="removeBipFile"
            :removeAtaglanceFile="removeAtaglanceFile"
          />
        </div>
        <div class="form-col">
          <StudentAccommodations
            :accommodations="form.accommodations"
            @update:accommodations="form.accommodations = $event"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-col">
          <StudentFlags
            :flags="form.flags"
            @update:flags="form.flags = $event"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save Student' }}
        </button>
        <button type="button" @click="$emit('close')">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentForm } from './useStudentForm'
import StudentBasicInfo from './StudentBasicInfo.vue'
import StudentSchedule from './StudentSchedule.vue'
import StudentClassServices from './StudentClassServices.vue'
import StudentProviders from './StudentProviders.vue'
import StudentDocuments from './StudentDocuments.vue'
import StudentAccommodations from './StudentAccommodations.vue'
import StudentFlags from './StudentFlags.vue'

// Debug helper
const debugForm = (operation, data) => {
  console.log(`🔍 DEBUG: StudentForm - ${operation}:`, data)
}

const props = defineProps({
  student: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'new' },
  users: { type: Object, required: true }
})

const emit = defineEmits(['saved', 'close'])

// Initialize form composable
const {
  form,
  isSaving,
  appSettings,
  appSettingsLoading,
  appSettingsError,
  periods,
  gradeOptions,
  availableClassServices,
  serviceProviders,
  customServiceProviders,
  userRoles,
  onFileChange,
  removeBipFile,
  removeAtaglanceFile,
  providerFieldMap,
  getProviderLabel,
  getProviderUsers,
  handleSubmit,
  validateForm
} = useStudentForm(props, emit)

// Track form state changes
const formState = computed(() => ({
  hasSchedule: !!form.schedule && Object.keys(form.schedule).length > 0,
  scheduleFormat: typeof form.schedule,
  periodKeys: form.schedule ? Object.keys(form.schedule) : [],
  services: form.services,
  caseManagerId: form.caseManagerId
}))

// Watch for form state changes
watch(formState, (newState, oldState) => {
  debugForm('Form state changed', {
    old: oldState,
    new: newState,
    diff: {
      scheduleChanged: JSON.stringify(oldState.periodKeys) !== JSON.stringify(newState.periodKeys),
      servicesChanged: JSON.stringify(oldState.services) !== JSON.stringify(newState.services),
      caseManagerChanged: oldState.caseManagerId !== newState.caseManagerId
    }
  })
})

// Enhanced submit handler with debugging
const onSubmit = async (event) => {
  event.preventDefault()
  debugForm('Submit started', {
    formState: formState.value,
    mode: props.mode,
    studentId: props.student?.id
  })

  try {
    await handleSubmit()
    debugForm('Submit successful')
  } catch (error) {
    debugForm('Submit failed', { error })
    console.error('Form submission failed:', error)
  }
}

// Track component lifecycle
onMounted(() => {
  debugForm('Component mounted', {
    mode: props.mode,
    hasStudent: !!props.student,
    studentId: props.student?.id
  })
})
</script>

<style scoped>
/* Add your styles here */
</style> 