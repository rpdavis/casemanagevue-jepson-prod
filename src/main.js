import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/bass/style.css'
import './assets/bass/table.css'
// import './assets/bass/admin-panel.css' // Only include in admin section
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)

app.mount('#app')