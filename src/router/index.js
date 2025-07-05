// /Users/rd/CaseManageVue/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import AdminView from '@/views/AdminView.vue';
import AdminAideAssignment from '@/views/AdminAideAssignment.vue';
import AdminTimeTable from '@/views/AdminTimeTable.vue';
import AideScheduleView from '@/views/AideScheduleView.vue';
import StudentsView from '@/views/StudentsView.vue';
import AdminAideSchedule from '@/views/AdminAideSchedule.vue';
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
    component: StudentsView,
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
  {
    path: '/admin/aide-assignment',
    name: 'AdminAideAssignment',
    component: AdminAideAssignment,
    meta: {
      requiresAuth: true,
      allowedRoles: ADMIN_ONLY,
    },
  },
  {
    path: '/admin/time-table',
    name: 'AdminTimeTable',
    component: AdminTimeTable,
    meta: {
      requiresAuth: true,
      allowedRoles: ADMIN_ONLY,
    },
  },
  {
    path: '/admin/aide-schedule',
    name: 'AdminAideSchedule',
    component: AdminAideSchedule,
    meta: {
      requiresAuth: true,
      allowedRoles: ADMIN_ONLY,
    },
  },
  {
    path: '/aide-schedule',
    name: 'AideSchedule',
    component: AideScheduleView,
    meta: {
      requiresAuth: true,
      allowedRoles: ['paraeducator'],
    },
  },
  {
    path: '/testing',
    name: 'Testing',
    component: () => import('@/views/TestingView.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'administrator', 'sped_chair', 'administrator_504_CM'],
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