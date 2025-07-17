<template>
  <td class="services-cell">
    <!-- Class Services -->
    <div v-if="hasClassServices" class="service-section">
      <div class="section-header">Class Services</div>
      <div class="service-list">
        <div
          v-for="service in getClassServices(student)"
          :key="service"
          class="service-item"
        >
          {{ service }}
        </div>
      </div>
    </div>

    <!-- Related Services Section -->
    <div v-if="hasRelatedServices" class="services-section">
      <div class="section-title">RELATED SERVICES</div>
      <div class="service-list">
        <div 
          v-for="abbr in effectiveProviders.filter(p => shouldShowProvider(p))"
          :key="abbr"
          class="service-item"
        >
          <span class="service-abbr">{{ abbr }}:</span>
          <span class="service-provider">{{ getProviderName(abbr) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasAnyServices" class="empty-services">—</div>
  </td>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  appSettings: { type: Object, required: false },
  getClassServices: { type: Function, required: true },
  getOtherServices: { type: Function, required: true },
  hasServiceProviders: { type: Function, required: true },
  getServiceProviderId: { type: Function, required: true },
  getProviderFieldName: { type: Function, required: true },
  getUserInitialLastName: { type: Function, required: true }
})

// Provider configuration
const defaultProviders = ['SP', 'MH', 'OT', 'PT', 'SC', 'TR']
const providerFieldMap = {
  SP: 'speechId',
  MH: 'mhId',
  OT: 'otId',
  PT: 'ptId',
  SC: 'scId',
  TR: 'trId'
}
const providerTitles = {
  SP: 'Speech Pathologist',
  MH: 'Mental Health Specialist',
  OT: 'Occupational Therapist',
  PT: 'Physical Therapist',
  SC: 'School Counselor',
  TR: 'Transition Specialist'
}

// Computed and helper functions
const effectiveProviders = computed(() => {
  const custom = props.appSettings?.value?.serviceProviders || []
  return custom.length > 0 ? custom : defaultProviders
})

function providerField(abbr) {
  if (props.appSettings?.value?.serviceProviders?.length) {
    return props.getProviderFieldName(abbr)
  }
  return providerFieldMap[abbr] || null
}

function providerTitle(abbr) {
  return providerTitles[abbr] || abbr
}

function shouldShowProvider(abbr) {
  const field = providerField(abbr)
  return field && props.getServiceProviderId(props.student, field)
}

function getProviderName(abbr) {
  const field = providerField(abbr)
  if (!field) return abbr
  return props.getUserInitialLastName(props.getServiceProviderId(props.student, field))
}

// State tracking
const hasClassServices = computed(() => {
  const services = props.getClassServices(props.student)
  return Array.isArray(services) && services.length > 0
})

const hasRelatedServices = computed(() => {
  const otherServices = props.getOtherServices(props.student)
  const hasOtherServices = Array.isArray(otherServices) && otherServices.length > 0
  
  // Check if any service providers should actually be shown
  const hasVisibleProviders = effectiveProviders.value.some(abbr => shouldShowProvider(abbr))
  
  return hasOtherServices || hasVisibleProviders
})

const hasAnyServices = computed(() => hasClassServices.value || hasRelatedServices.value)
</script> 

<style scoped>
.student-services-cell {
  padding: 8px;
  font-size: 0.875rem;
}

.services-section {
  margin-bottom: 12px;
}

.services-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}

.service-abbr {
  font-weight: 500;
  color: #2d3748;
  min-width: 30px;
}

.service-provider {
  color: #4a5568;
}

.provider-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.provider-abbr {
  font-weight: 500;
  cursor: help;
}

.provider-name {
  color: #4a5568;
}

.other-service-item {
  padding: 2px 4px;
  background-color: #f7fafc;
  border-radius: 4px;
  margin-bottom: 2px;
  font-size: 0.813rem;
}
</style> 