<template>
  <div class="login-container">
    <h1>Case Manager Portal</h1>
    <p>Please sign in with your district Google account:</p>
    
    <!-- Show current Google account if signed in -->
    <div v-if="currentGoogleAccount" class="current-account-info">
      <p class="current-account">Currently signed in as: <strong>{{ currentGoogleAccount }}</strong></p>
      <p v-if="!isDistrictAccount(currentGoogleAccount)" class="account-warning">
        ⚠️ This appears to be a personal account. Please use your district account.
      </p>
    </div>
    
    <!-- Error message display -->
    <div v-if="errorMessage" class="error-message">
      <h3>{{ errorTitle }}</h3>
      <p>{{ errorMessage }}</p>
      <div v-if="suggestedActions.length > 0" class="suggested-actions">
        <p><strong>Try these steps:</strong></p>
        <ul>
          <li v-for="action in suggestedActions" :key="action">{{ action }}</li>
        </ul>
      </div>
      <button @click="clearError" class="secondary-btn">Try Again</button>
    </div>
    
    <button @click="handleGoogleLogin" class="primary-btn" :disabled="isLoading">
      {{ isLoading ? 'Signing in...' : 'Sign in with Google' }}
    </button>
    
    <!-- Help text -->
    <div class="help-text">
      <p><small>Need help? Contact IT support if you continue having issues.</small></p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Import our centralized firebase services
import { auth, db, googleProvider } from '@/firebase';
import { useSystemSecurity } from '@/composables/useSystemSecurity';

const router = useRouter();

// System security settings for domain validation
const { securitySettings, loadSecuritySettings, isEmailAllowed, getEnabledDomains, getEmailExceptions } = useSystemSecurity();

// Reactive state
const isLoading = ref(false);
const errorMessage = ref('');
const errorTitle = ref('');
const suggestedActions = ref([]);
const currentGoogleAccount = ref('');

// Check if email is allowed based on system security settings
const isDistrictAccount = (email) => {
  return isEmailAllowed(email);
};

// Clear error state
const clearError = () => {
  errorMessage.value = '';
  errorTitle.value = '';
  suggestedActions.value = [];
};

// Enhanced error handling with specific messages
const handleAuthError = (error, userEmail = null) => {
  console.error('Login failed:', error);
  
  // Clear previous errors
  clearError();
  
  if (userEmail && !isDistrictAccount(userEmail)) {
    // Wrong account type
    errorTitle.value = 'Wrong Google Account';
    
    // Get enabled domains and exceptions for error message
    const enabledDomains = getEnabledDomains();
    const enabledExceptions = getEmailExceptions();
    
    let domainText = 'approved accounts';
    if (enabledDomains.length > 0) {
      domainText = `approved domains: ${enabledDomains.join(', ')}`;
    }
    
    errorMessage.value = `You signed in with ${userEmail}, but this system requires ${domainText}.`;
    
    const suggestions = [
      'Sign out of your personal Google account in this browser',
      'Or open an incognito/private window and sign in with your approved account'
    ];
    
    if (enabledDomains.length > 0) {
      suggestions.splice(1, 0, `Sign in with your district account (${enabledDomains.length > 0 ? `@${enabledDomains[0]}` : '@yourdomain.edu'})`);
    }
    
    if (enabledExceptions.length > 0) {
      suggestions.push('If you are IT staff, ensure you are using your approved exception email');
    }
    
    suggestedActions.value = suggestions;
  } else if (error.code === 'auth/popup-blocked') {
    errorTitle.value = 'Popup Blocked';
    errorMessage.value = 'Your browser blocked the Google sign-in popup.';
    suggestedActions.value = [
      'Allow popups for this site in your browser settings',
      'Try signing in again'
    ];
  } else if (error.code === 'auth/popup-closed-by-user') {
    errorTitle.value = 'Sign-in Cancelled';
    errorMessage.value = 'You closed the sign-in window before completing authentication.';
    suggestedActions.value = [
      'Click "Sign in with Google" again',
      'Complete the sign-in process in the popup window'
    ];
  } else if (error.message?.includes('insufficient permissions') || error.message?.includes('not found')) {
    errorTitle.value = 'Account Not Found';
    errorMessage.value = userEmail 
      ? `Your account (${userEmail}) is not set up in this system.`
      : 'Your account is not set up in this system.';
    suggestedActions.value = [
      'Contact your administrator to add your account',
      'Verify you\'re using your district Google account',
      'Check that you\'re signing in with the correct email address'
    ];
  } else {
    // Generic error
    errorTitle.value = 'Sign-in Failed';
    errorMessage.value = error.message || 'An unexpected error occurred during sign-in.';
    suggestedActions.value = [
      'Check your internet connection',
      'Try signing in again',
      'Contact IT support if the problem persists'
    ];
  }
};

const handleGoogleLogin = async () => {
  try {
    isLoading.value = true;
    clearError();
    
    const { user } = await signInWithPopup(auth, googleProvider);
    
    // Validate domain before proceeding
    if (!isDistrictAccount(user.email)) {
      // Sign out the wrong account immediately
      await auth.signOut();
      handleAuthError(new Error('Wrong account domain'), user.email);
      return;
    }

    // Check if the user exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // User doesn't exist in system - don't auto-create, show helpful error
      await auth.signOut();
      handleAuthError(new Error('Account not found in system'), user.email);
      return;
    }

    // Success - redirect to home
    router.push({ name: 'Home' });

  } catch (err) {
    handleAuthError(err, err.customData?.email);
  } finally {
    isLoading.value = false;
  }
};

// Monitor auth state to show current account
onMounted(async () => {
  // Load system security settings for domain validation
  await loadSecuritySettings();
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentGoogleAccount.value = user.email;
    } else {
      currentGoogleAccount.value = '';
    }
  });
});
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

.current-account-info {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.current-account {
  margin: 0;
  color: #495057;
}

.account-warning {
  margin: 0.5rem 0 0 0;
  color: #d63384;
  font-weight: 500;
}

.error-message {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  color: #721c24;
  text-align: left;
}

.error-message h3 {
  margin: 0 0 1rem 0;
  color: #721c24;
  font-size: 1.2rem;
}

.suggested-actions {
  margin-top: 1rem;
}

.suggested-actions ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.suggested-actions li {
  margin: 0.5rem 0;
}

.primary-btn {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.primary-btn:hover:not(:disabled) {
  background-color: #357ae8;
}

.primary-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 1rem;
}

.secondary-btn:hover {
  background-color: #5a6268;
}

.help-text {
  margin-top: 2rem;
  color: #6c757d;
}
</style>