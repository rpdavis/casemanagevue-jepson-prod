<template>
  <div class="user-role-sync">
    <h3>User Role Sync</h3>
    
    <div v-if="authStore.isLoading" class="loading">
      Loading authentication state...
    </div>
    
    <div v-else-if="!authStore.currentUser" class="not-authenticated">
      <p>❌ Not logged in</p>
      <p>Please log in to use this feature.</p>
    </div>
    
    <div v-else class="authenticated">
      <p><strong>Current User ID:</strong> {{ authStore.currentUser.uid }}</p>
      <p><strong>Current Role:</strong> {{ authStore.currentUser.role || 'Unknown' }}</p>
      <p><strong>Email:</strong> {{ authStore.currentUser.email }}</p>
      
      <button 
        @click="triggerSync" 
        :disabled="isTriggering"
        class="sync-btn"
      >
        {{ isTriggering ? 'Triggering...' : 'Trigger Claims Sync' }}
      </button>
      
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/authStore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const authStore = useAuthStore()

const isTriggering = ref(false)
const message = ref('')
const messageType = ref('info')

const triggerSync = async () => {
  if (!authStore.currentUser?.uid) {
    message.value = 'No user logged in'
    messageType.value = 'error'
    return
  }

  isTriggering.value = true
  message.value = 'Triggering sync...'
  messageType.value = 'info'

  try {
    const functions = getFunctions()
    const triggerSyncFunction = httpsCallable(functions, 'triggerUserClaimsSync')
    
    const result = await triggerSyncFunction({
      userId: authStore.currentUser.uid
    })
    
    message.value = result.data.message
    messageType.value = 'success'
    
    // Wait a moment for the sync to complete
    setTimeout(() => {
      message.value = 'Sync triggered! You may need to sign out and sign back in for changes to take effect.'
      messageType.value = 'info'
    }, 2000)
    
  } catch (error) {
    console.error('Error triggering sync:', error)
    message.value = `Error: ${error.message}`
    messageType.value = 'error'
  } finally {
    isTriggering.value = false
  }
}
</script>

<style scoped>
.user-role-sync {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 1rem 0;
  background: #f9f9f9;
}

.loading {
  color: #666;
  font-style: italic;
}

.not-authenticated {
  color: #721c24;
  background: #f8d7da;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}

.authenticated {
  background: #d4edda;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #c3e6cb;
}

.sync-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 0.5rem 0;
}

.sync-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.sync-btn:hover:not(:disabled) {
  background: #0056b3;
}

.message {
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.5rem 0;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
</style> 