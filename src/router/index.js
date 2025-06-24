import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import AdminView from '@/views/AdminView.vue';
import StudentsView from '@/views/StudentsView.vue';
import { setupGuards } from './guards';
import { STUDENT_ACCESS_ROLES, ADMIN_ONLY } from '@/config/roles';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      allowedRoles: STUDENT_ACCESS_ROLES,
    },
  },
  {
    path: '/students',
    name: 'Students',
    component: StudentsView,
    meta: {
      requiresAuth: true,
      allowedRoles: STUDENT_ACCESS_ROLES,
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      allowedRoles: ADMIN_ONLY,
    },
  },
  // ... add other routes here with their own meta fields
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Set up the navigation guards
setupGuards(router);

export default router;