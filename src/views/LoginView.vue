<template>
  <div class="login-page">
    <h1>Login</h1>
    <button @click="auth.loginWithGoogle">Sign in with Google</button>
    <p v-if="auth.errorMsg" class="error">❌ {{ auth.errorMsg }}</p>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/authStore'

const auth = useAuthStore()
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 5rem auto;
  text-align: center;
}

.error {
  margin-top: 1rem;
  color: red;
  font-weight: bold;
}
</style>
