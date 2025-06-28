// /Users/rd/CaseManageVue/src/App.vue

<template>
  <div id="app">
    <NavBar /> <!-- Always show navbar -->
    <div id="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
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