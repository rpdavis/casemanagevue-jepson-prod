<!-- src/views/AdminView.vue -->
<template>
  <div>
    <div class="admin-header">
      <h1>Admin Panel</h1>
      <button @click="goToStudents" class="return-btn">
        <span>←</span> Return to Students
      </button>
    </div>
    
    <!-- Tab Bar -->
    <TabBar 
      :tabs="tabs" 
      :active-tab="activeTab" 
      @tab-change="handleTabChange" 
    />

    <!-- Tab Content -->
    <div class="admin-section">
      <!-- Add Users Tab -->
      <div v-if="activeTab === 'usersAdd'" class="admin-section">
        <UserAddForm />
      </div>

      <!-- Edit Users Tab -->
      <div v-if="activeTab === 'usersEdit'" class="admin-section">
        <UserTable />
      </div>

      <!-- Students Tab -->
      <div v-if="activeTab === 'students'" class="admin-section">
        <AdminStudents />
      </div>

      <!-- Permissions Tab -->
      <div v-if="activeTab === 'permissions'" class="admin-section">
        <AdminPermissions />
      </div>

      <!-- Aide Assignment Tab -->
      <div v-if="activeTab === 'aide-assignment'" class="admin-section">
        <AdminAideAssignment />
      </div>

      <!-- Aide Schedule Tab -->
      <div v-if="activeTab === 'aide-schedule'" class="admin-section">
        <AdminAideSchedule />
      </div>

      <!-- Time Table Tab -->
      <div v-if="activeTab === 'time-table'" class="admin-section">
        <AdminTimeTable />
      </div>

      <!-- SEIS Import Tab -->
      <div v-if="activeTab === 'seis'" class="admin-section">
        <SeisImport />
      </div>

      <!-- Aeries Import Tab -->
      <div v-if="activeTab === 'aeries'" class="admin-section">
        <AeriesAPIConnector />
        <hr style="margin: 2rem 0; border: 1px solid #ddd;">
        <AeriesImport />
      </div>

      <!-- App Settings Tab -->
      <div v-if="activeTab === 'settings'" class="admin-section">
        <AppSettings />
      </div>

      <!-- Backup & Restore Tab -->
      <div v-if="activeTab === 'backup-restore'" class="admin-section">
        <AdminBackupRestore />
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/bass/admin-panel.css'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'
import UserAddForm from '../components/UserAddForm.vue'
import UserTable from '../components/UserTable.vue'
import PermissionsMatrix from '../components/PermissionsMatrix.vue'
import AdminStudents from './AdminStudents.vue'

import AdminPermissions from './AdminPermissions.vue'
import SeisImport from '../components/SeisImport.vue'
import AeriesImport from '../components/AeriesImport.vue'
import AeriesAPIConnector from '../components/AeriesAPIConnector.vue'

import AppSettings from './AppSettings.vue'
import AdminAideAssignment from './AdminAideAssignment.vue'
import AdminTimeTable from './AdminTimeTable.vue'
import AdminAideSchedule from './AdminAideSchedule.vue'
import AdminBackupRestore from './AdminBackupRestore.vue'

export default {
  name: 'AdminView',
  components: {
    TabBar,
    UserAddForm,
    UserTable,
    PermissionsMatrix,
    AdminStudents,

    AdminPermissions,
    SeisImport,
    AeriesImport,
    AeriesAPIConnector,
    AppSettings,
    AdminAideAssignment,
    AdminTimeTable,
    AdminAideSchedule,
    AdminBackupRestore
  },
  setup() {
    const router = useRouter()
    const activeTab = ref('usersAdd')

    const tabs = [
      { key: 'usersAdd', label: 'Add Users', category: 'users-students' },
      { key: 'usersEdit', label: 'Manage Users', category: 'users-students' },
      { key: 'students', label: 'Students', category: 'users-students' },
      { key: 'aide-assignment', label: 'Aide Assignment', category: 'aide-management' },
      { key: 'aide-schedule', label: 'Aide Schedule', category: 'aide-management' },
      { key: 'time-table', label: 'Time Table', category: 'aide-management' },
      { key: 'permissions', label: 'Permissions', category: 'system-config' },
      { key: 'seis', label: 'SEIS Import', category: 'system-config' },
      { key: 'aeries', label: 'Aeries API & Import', category: 'system-config' },
      { key: 'settings', label: 'App Settings', category: 'system-config' },
      { key: 'backup-restore', label: 'Backup & Restore', category: 'system-config' }
    ]

    const handleTabChange = (tabKey) => {
      activeTab.value = tabKey
    }

    const goToStudents = () => {
      router.push('/students')
    }

    return {
      activeTab,
      tabs,
      handleTabChange,
      goToStudents
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.admin-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.return-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 1rem;
}

.return-btn:hover {
  background: #545b62;
}

.return-btn span {
  font-size: 1.2rem;
}
</style>
