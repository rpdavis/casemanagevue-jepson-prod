<template>
  <div class="admin-permissions">
    <PermissionsOverview />
  </div>
</template>

<script setup>
import PermissionsOverview from '../components/PermissionsOverview.vue'
</script>

<style scoped>
.admin-permissions {
  /* No padding needed - PermissionsOverview handles its own layout */
}
</style>
