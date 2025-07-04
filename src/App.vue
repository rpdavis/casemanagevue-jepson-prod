// /Users/rd/CaseManageVue/src/App.vue

<template>
  <div id="app">
    <div id="main-content">
      <router-view />
    </div>
    <UserRoleSwitcher />
  </div>
</template>

<script setup>
import UserRoleSwitcher from '@/components/UserRoleSwitcher.vue'
</script>

<style>
/* Global styles */
#app {
  min-height: 100vh;
  background: #f4f6f9;
}

#main-content {
  padding: 0 2rem;
}

/* Hide navbar in print */
@media print {
  #nav {
    display: none !important;
  }
}
</style>