<template>
  <fieldset>
    <legend>Services: providers</legend>
    <div class="inner-grid-3">
      <template v-if="serviceProviders.length > 0">
        <ServiceSelect
          v-for="abbr in serviceProviders"
          :key="abbr"
          :id="abbr"
          :label="getProviderLabel(abbr)"
          :list="getProviderUsers(abbr)"
          v-model="form[providerFieldMap[abbr] || `${abbr.toLowerCase()}Id`]"
        />
        <ServiceSelect
          v-for="custom in customServiceProviders"
          :key="custom"
          :id="custom"
          :label="custom"
          :list="[]"
          v-model="form[`${custom.toLowerCase()}Id`]"
        />
      </template>
      <template v-else>
        <div class="no-services-message">
          <span class="info-icon">ℹ️</span> No service providers configured. 
          <a href="/admin" class="settings-link">Configure in App Settings</a>
        </div>
      </template>
    </div>
  </fieldset>
</template>

<script setup>
import ServiceSelect from '../ServiceSelect.vue'

// Props
const props = defineProps({
  form: { type: Object, required: true },
  serviceProviders: { type: Array, required: true },
  customServiceProviders: { type: Array, required: true },
  providerFieldMap: { type: Object, required: true },
  getProviderLabel: { type: Function, required: true },
  getProviderUsers: { type: Function, required: true }
})

// No local state needed - all data flows through props
</script>

<style scoped>
.no-services-message {
  grid-column: span 3;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.info-icon {
  font-size: 16px;
}

.settings-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.settings-link:hover {
  text-decoration: underline;
}
</style> 