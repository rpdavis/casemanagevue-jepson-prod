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
import ServiceSelect from './ServiceSelect.vue'
const props = defineProps({
  form: Object, serviceProviders: Array, customServiceProviders: Array,
  userRoles: Object, getProviderLabel: Function, getProviderUsers: Function, providerFieldMap: Object
})
</script> 