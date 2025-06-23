<script setup>
import { useAuthStore } from '../store/authStore'

const auth = useAuthStore()
</script>

<template>
  <button @click="auth.logout">Logout</button>
</template>
