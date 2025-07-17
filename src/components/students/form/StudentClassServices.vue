<template>
  <fieldset class="form-col">
    <legend>Services: classes</legend>
    <div class="inner-grid-3">
      <!-- Loading state -->
      <template v-if="appSettingsLoading">
        <div class="loading-message">
          <span class="loading-spinner">⏳</span> Loading app settings...
        </div>
      </template>
      
      <!-- Error state -->
      <template v-else-if="appSettingsError">
        <div class="error-message">
          <span class="error-icon">⚠️</span> Error loading app settings: {{ appSettingsError }}
        </div>
      </template>
      
      <!-- Success state -->
      <template v-else-if="availableClassServices.length > 0">
        <ServiceCheckboxGroup
          v-for="service in visibleClassServices"
          :key="service.name"
          :label="service.name"
          :items="service.enabledSubcategories"
          v-model="form.services"
        />
        
        <!-- Hidden co-teaching checkboxes (auto-populated from schedule) -->
        <div style="display: none;">
          <ServiceCheckboxGroup
            v-for="service in hiddenCoTeachingServices"
            :key="service.name"
            :label="service.name"
            :items="service.enabledSubcategories"
            v-model="form.services"
          />
        </div>
      </template>
      
      <!-- No services state -->
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
import { computed } from 'vue'
import ServiceCheckboxGroup from '../ServiceCheckboxGroup.vue'

// Props
const props = defineProps({
  form: { type: Object, required: true },
  availableClassServices: { type: Array, required: true },
  appSettingsLoading: { type: Boolean, default: false },
  appSettingsError: { type: String, default: null }
})

// Separate visible services from hidden co-teaching services
const visibleClassServices = computed(() => {
  return props.availableClassServices.filter(service => service.name !== 'Co-teach')
})

const hiddenCoTeachingServices = computed(() => {
  return props.availableClassServices.filter(service => service.name === 'Co-teach')
})
</script>

<style scoped>
/* App Settings Integration Styles */
.loading-message, .error-message, .no-services-message {
  grid-column: span 3;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.loading-message {
  background-color: #f0f8ff;
  color: #0066cc;
  border: 1px solid #b3d9ff;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.error-message {
  background-color: #fff5f5;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.error-icon {
  font-size: 16px;
}

.no-services-message {
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 