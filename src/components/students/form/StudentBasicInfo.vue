<template>
  <fieldset class="form-col">
    <legend>Student Info</legend>
    <div class="inner-grid-3">
      <label v-if="mode === 'new'" class="ssid-field">
        <span class="field-label">SSID (State Student ID) *</span>
        <input v-model="form.ssid" type="text" required placeholder="Enter student SSID" class="ssid-input" />
        <div class="field-help">
          <strong>Required:</strong> This can be found in your Student Information System (SIS) such as Aeries, or in SEIS.
        </div>
      </label>
      <label>First Name: <input v-model="form.firstName" type="text" required /></label>
      <label>Last Name: <input v-model="form.lastName" type="text" required /></label>
      <label>Grade:
        <select v-model="form.grade">
          <option v-for="grade in gradeOptions" :key="grade" :value="grade">{{ grade }}</option>
        </select>
      </label>
      <label>Plan Type:
        <select v-model="form.plan">
          <option value="IEP">IEP</option>
          <option value="504">504</option>
        </select>
      </label>
      <label>Review Date: <input v-model="form.reviewDate" type="date" /></label>
      <label>Reevaluation Date: <input v-model="form.reevalDate" type="date" /></label>
      <label>Meeting Date: <input v-model="form.meetingDate" type="date" /></label>
      <label>Case Manager:
        <select v-model="form.caseManagerId">
          <option v-for="cm in userRoles.caseManagers" :key="cm.id" :value="cm.id">
            {{ cm.name || cm.email || cm.id }}
          </option>
        </select>
      </label>
    </div>
  </fieldset>
</template>
<script setup>
import { computed } from 'vue'
import { useAppSettings } from '@/composables/useAppSettings'
const props = defineProps({ form: Object, mode: String, userRoles: Object })
const { appSettings } = useAppSettings()
const gradeOptions = computed(() => appSettings.value?.grades?.length ? appSettings.value.grades : ['7','8'])
</script> 