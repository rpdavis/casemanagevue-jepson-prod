<template>
  <fieldset class="form-col">
    <legend>Services: classes</legend>
    <div class="inner-grid-3">
      <template v-if="appSettingsLoading">
        <div class="loading-message"><span class="loading-spinner">⏳</span> Loading app settings...</div>
      </template>
      <template v-else-if="appSettingsError">
        <div class="error-message"><span class="error-icon">⚠️</span> Error loading app settings: {{ appSettingsError }}</div>
      </template>
      <template v-else-if="availableClassServices.length > 0">
        <ServiceCheckboxGroup
          v-for="service in availableClassServices"
          :key="service.name"
          :label="service.name"
          :items="service.enabledSubcategories"
          v-model="form.services"
        />
      </template>
      <template v-else>
        <div class="no-services-message">
          <span class="info-icon">ℹ️</span> No class services configured.
          <a href="/admin" class="settings-link">Configure in App Settings</a>
        </div>
      </template>
    </div>
  </fieldset>
</template>
<script setup>
import ServiceCheckboxGroup from './ServiceCheckboxGroup.vue'
const props = defineProps({ form: Object, availableClassServices: Array, appSettingsLoading: Boolean, appSettingsError: String })
</script> 