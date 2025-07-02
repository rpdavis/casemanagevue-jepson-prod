<!-- src/views/AdminView.vue -->
<template>
  <div>
    <h1>Admin Panel</h1>
    
    <!-- Temporary: User Role Sync Component -->
    <UserRoleSync />
    
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
        <PermissionsMatrix />
      </div>

      <!-- Periods Tab -->
      <div v-if="activeTab === 'periods'" class="admin-section">
        <AdminPeriods />
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
      <div v-if="activeTab === 'appSettings'" class="admin-section">
        <AppSettings />
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/bass/admin-panel.css'
import { ref } from 'vue'
import TabBar from '../components/TabBar.vue'
import UserAddForm from '../components/UserAddForm.vue'
import UserTable from '../components/UserTable.vue'
import PermissionsMatrix from '../components/PermissionsMatrix.vue'
import AdminPeriods from './AdminPeriods.vue'
import AdminStudents from './AdminStudents.vue'
import SeisImport from '../components/SeisImport.vue'
import AeriesImport from '../components/AeriesImport.vue'
import AeriesAPIConnector from '../components/AeriesAPIConnector.vue'
import UserRoleSync from '../components/UserRoleSync.vue'
import AppSettings from './AppSettings.vue'

export default {
  name: 'AdminView',
  components: {
    TabBar,
    UserAddForm,
    UserTable,
    PermissionsMatrix,
    AdminPeriods,
    AdminStudents,
    SeisImport,
    AeriesImport,
    AeriesAPIConnector,
    UserRoleSync,
    AppSettings
  },
  setup() {
    const activeTab = ref('usersAdd')

    const tabs = [
      { key: 'usersAdd', label: 'Add Users' },
      { key: 'usersEdit', label: 'Edit Users' },
      { key: 'students', label: 'Students' },
      { key: 'permissions', label: 'Permissions' },
      { key: 'periods', label: 'Periods' },
      { key: 'seis', label: 'SEIS Import' },
      { key: 'aeries', label: 'Aeries API & Import' },
      { key: 'appSettings', label: 'App Settings' }
    ]

    const handleTabChange = (tabKey) => {
      activeTab.value = tabKey
    }

    return {
      activeTab,
      tabs,
      handleTabChange
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
