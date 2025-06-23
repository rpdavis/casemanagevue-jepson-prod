// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import AdminView from '../views/AdminView.vue'
import { guards } from '@/router/guardPage'




const routes = [
  { path: '/login', name: 'Login', component: LoginView },
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
{
  path: '/admin',
  name: 'Admin',
  component: AdminView,
  beforeEnter: (to, from, next) =>
    guardPage(['admin', 'sped_chair'], router, next)
}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Protect routes that require authentication
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
      const removeListener = onAuthStateChanged(auth, user => {
        removeListener()
        resolve(user)
      }, reject)
    })
  }

  if (requiresAuth) {
    const user = await getCurrentUser()
    if (user) {
      next()
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
