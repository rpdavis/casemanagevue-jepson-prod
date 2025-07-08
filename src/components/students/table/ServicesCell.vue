<template>
  <td>
    <template v-if="getClassServices(student).length > 0 || getOtherServices(student).length > 0 || hasServiceProviders(student)">
      <div v-if="getClassServices(student).length > 0">
        <strong>Class Services:</strong>
        <span v-for="service in getClassServices(student)" :key="service" class="service-pill">{{ service }}</span>
      </div>
      <div v-if="getOtherServices(student).length > 0 || hasServiceProviders(student)">
        <strong>Related Services:</strong>
        <span v-for="other in getOtherServices(student)" :key="other" class="service-pill">{{ other }}</span>
        <template v-if="appSettings && appSettings.value && appSettings.value.serviceProviders">
          <span v-for="abbr in appSettings.value.serviceProviders" :key="abbr" 
                v-if="getServiceProviderId(student, getProviderFieldName(abbr))" 
                class="service-pill">
            {{ abbr }} ({{ getUserInitials(getServiceProviderId(student, getProviderFieldName(abbr))) }})
          </span>
        </template>
        <template v-else>
          <!-- Fallback to hardcoded providers if app settings not available -->
          <span v-if="getServiceProviderId(student, 'speechId')" class="service-pill">SP ({{ getUserInitials(getServiceProviderId(student, 'speechId')) }})</span>
          <span v-if="getServiceProviderId(student, 'mhId')" class="service-pill">MH ({{ getUserInitials(getServiceProviderId(student, 'mhId')) }})</span>
          <span v-if="getServiceProviderId(student, 'otId')" class="service-pill">OT ({{ getUserInitials(getServiceProviderId(student, 'otId')) }})</span>
          <span v-if="getServiceProviderId(student, 'ptId')" class="service-pill">PT ({{ getUserInitials(getServiceProviderId(student, 'ptId')) }})</span>
          <span v-if="getServiceProviderId(student, 'scId')" class="service-pill">SC ({{ getUserInitials(getServiceProviderId(student, 'scId')) }})</span>
          <span v-if="getServiceProviderId(student, 'trId')" class="service-pill">TR ({{ getUserInitials(getServiceProviderId(student, 'trId')) }})</span>
        </template>
      </div>
    </template>
    <template v-else>
      —
    </template>
  </td>
</template>

<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  appSettings: {
    type: Object,
    default: null
  },
  // Functions from parent composable
  getClassServices: {
    type: Function,
    required: true
  },
  getOtherServices: {
    type: Function,
    required: true
  },
  hasServiceProviders: {
    type: Function,
    required: true
  },
  getServiceProviderId: {
    type: Function,
    required: true
  },
  getProviderFieldName: {
    type: Function,
    required: true
  },
  getUserInitials: {
    type: Function,
    required: true
  }
})
</script> 