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
import AdminBackupRestore from '@/views/AdminBackupRestore.vue';
import TestingView from '@/views/TestingView.vue';
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
    redirect: '/students',
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
    path: '/admin/backup-restore',
    name: 'AdminBackupRestore',
    component: AdminBackupRestore,
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
    component: TestingView,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin', 'school_admin', 'sped_chair', 'admin_504'],
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Set up the navigation guards
setupGuards(router);

export default router;