<template>
  <div class="admin-permissions">
    <h2>Role Permissions Matrix</h2>
    <PermissionsMatrix />
  </div>
</template>

<script setup>
import PermissionsMatrix from '../components/PermissionsMatrix.vue'
</script>

<style scoped>
.admin-permissions {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
