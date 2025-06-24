import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import AdminView from '@/views/AdminView.vue'
import CaseView from '@/views/CaseView.vue'
import ClientView from '@/views/ClientView.vue'
import DocumentView from '@/views/DocumentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
    },
    {
      path: '/case',
      name: 'case',
      component: CaseView
    },
    {
      path: '/client',
      name: 'client',
      component: ClientView
    },
    {
      path: '/document',
      name: 'document',
      component: DocumentView
    },
  ]
})

export default router