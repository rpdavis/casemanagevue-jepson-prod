<template>
  <div class="admin-users">
    <h2>Manage Users</h2>
    <UserTable />
  </div>
</template>

<script setup>
import UserTable from '../components/UserTable.vue'
</script>

<style scoped>
.admin-users {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
