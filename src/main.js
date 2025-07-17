import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { createPinia } from 'pinia'
import { initializeFirebase } from './firebase'

// Create Vue app instance but don't mount yet
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Initialize Firebase first, then mount the app
initializeFirebase()
  .then(() => {
    console.log('🚀 Firebase initialized, mounting app...')
    
    // Use plugins
    app.use(router)
    app.use(pinia)
    
    // Mount the app
    app.mount('#app')
    
    console.log('✨ App mounted successfully')
  })
  .catch(error => {
    console.error('❌ Failed to initialize Firebase:', error)
    // You might want to show an error message to the user here
  })