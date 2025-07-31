<template>
  <div class="user-role-sync">
    <h3>🔍 User Role Debug</h3>
    
    <div v-if="authStore.isLoading" class="loading">
      Loading authentication state...
    </div>
    
    <div v-else-if="!authStore.currentUser" class="not-authenticated">
      <p>❌ Not logged in</p>
      <p>Please log in to use this feature.</p>
    </div>
    
    <div v-else class="authenticated">
      <div class="user-info">
        <h4>👤 User Information</h4>
        <p><strong>UID:</strong> {{ authStore.currentUser.uid }}</p>
        <p><strong>Email:</strong> {{ authStore.currentUser.email }}</p>
        <p><strong>Role (from Firestore):</strong> {{ authStore.currentUser.role || 'Unknown' }}</p>
        <p><strong>Name:</strong> {{ authStore.currentUser.name || 'Unknown' }}</p>
      </div>
      
      <div class="token-info" v-if="tokenInfo">
        <h4>🔑 Token Information</h4>
        <p><strong>Token Role:</strong> {{ tokenInfo.role || 'None' }}</p>
        <p><strong>Token Claims:</strong></p>
        <pre>{{ JSON.stringify(tokenInfo, null, 2) }}</pre>
      </div>
      
      <div class="action-buttons">
        <button 
          @click="checkToken" 
          :disabled="isChecking"
          class="btn btn-primary"
        >
          {{ isChecking ? '🔍 Checking...' : '🔍 Check Token Claims' }}
        </button>
        
        <button 
          @click="triggerSync" 
          :disabled="isTriggering"
          class="btn btn-warning"
        >
          {{ isTriggering ? '🔄 Syncing...' : '🔄 Force Sync Claims' }}
        </button>
        
        <button 
          @click="refreshToken" 
          :disabled="isRefreshing"
          class="btn btn-info"
        >
          {{ isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Token' }}
        </button>
      </div>
      
      <div v-if="error" class="error">
        <h4>❌ Error</h4>
        <p>{{ error }}</p>
      </div>
      
      <div v-if="success" class="success">
        <h4>✅ Success</h4>
        <p>{{ success }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/store/authStore'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

const authStore = useAuthStore()
const tokenInfo = ref(null)
const error = ref('')
const success = ref('')
const isChecking = ref(false)
const isTriggering = ref(false)
const isRefreshing = ref(false)

const checkToken = async () => {
  isChecking.value = true
  error.value = ''
  success.value = ''
  
  try {
    if (!auth.currentUser) {
      throw new Error('No user authenticated')
    }
    
    const token = await getIdToken(auth.currentUser, true)
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    tokenInfo.value = {
      role: payload.role,
      email: payload.email,
      email_verified: payload.email_verified,
      auth_time: new Date(payload.auth_time * 1000).toISOString(),
      iat: new Date(payload.iat * 1000).toISOString(),
      exp: new Date(payload.exp * 1000).toISOString(),
      full_payload: payload
    }
    
    success.value = 'Token claims retrieved successfully'
    console.log('Token payload:', payload)
  } catch (err) {
    error.value = `Error checking token: ${err.message}`
    console.error('Error checking token:', err)
  } finally {
    isChecking.value = false
  }
}

const triggerSync = async () => {
  isTriggering.value = true
  error.value = ''
  success.value = ''
  
  try {
    const syncUserClaims = httpsCallable(functions, 'syncUserClaims')
    const result = await syncUserClaims()
    
    success.value = 'User claims synced successfully'
    console.log('Sync result:', result)
    
    // Refresh the token to get updated claims
    await refreshToken()
  } catch (err) {
    error.value = `Error syncing claims: ${err.message}`
    console.error('Error syncing claims:', err)
  } finally {
    isTriggering.value = false
  }
}

const refreshToken = async () => {
  isRefreshing.value = true
  error.value = ''
  success.value = ''
  
  try {
    if (!auth.currentUser) {
      throw new Error('No user authenticated')
    }
    
    await getIdToken(auth.currentUser, true)
    success.value = 'Token refreshed successfully'
    
    // Re-check token claims
    await checkToken()
  } catch (err) {
    error.value = `Error refreshing token: ${err.message}`
    console.error('Error refreshing token:', err)
  } finally {
    isRefreshing.value = false
  }
}
</script>

<style scoped>
.user-role-sync {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.user-info, .token-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
}

pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  font-size: 12px;
}

.loading, .not-authenticated {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style> 