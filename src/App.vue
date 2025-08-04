// /Users/rd/CaseManageVue/src/App.vue

<template>
  <div id="app">
    <div id="main-content">
      <router-view />
    </div>
    <!-- Debug Role Switcher - Hidden by default, show with Ctrl+Shift+D -->
    <UserRoleSwitcher v-if="showDebugRoleSwitcher" />
    <!-- Debug Access Info - Shows admin users how to access debug tools -->
    <DebugAccessInfo />
    <SessionTimeoutDialog />
    <!-- Token Debugger for monitoring auth issues -->
    <TokenDebugger />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import UserRoleSwitcher from '@/components/UserRoleSwitcher.vue'
import DebugAccessInfo from '@/components/DebugAccessInfo.vue'
import SessionTimeoutDialog from '@/components/SessionTimeoutDialog.vue'
import TokenDebugger from '@/components/TokenDebugger.vue'
import { useThemeInitializer } from '@/composables/useThemeInitializer'

const showDebugRoleSwitcher = ref(false)

// Initialize theme
useThemeInitializer()

// Keyboard shortcut to show/hide debug role switcher: Ctrl+Shift+D
const handleKeydown = (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showDebugRoleSwitcher.value = !showDebugRoleSwitcher.value
    console.log('Debug Role Switcher:', showDebugRoleSwitcher.value ? 'Shown' : 'Hidden')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
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