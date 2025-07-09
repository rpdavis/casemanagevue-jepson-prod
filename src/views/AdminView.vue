<!-- src/views/AdminView.vue -->
<template>
  <div>
    <div class="admin-header">
      <h1>Admin Panel</h1>
      <div class="admin-nav">
        <button 
          @click="setActiveCategory('users-students')" 
          :class="{ active: activeCategory === 'users-students' }"
          class="category-btn"
        >
          User & Student Management
        </button>
        <button 
          @click="setActiveCategory('aide-management')" 
          :class="{ active: activeCategory === 'aide-management' }"
          class="category-btn"
        >
          Aide Management
        </button>
        <button 
          @click="setActiveCategory('data-integration')" 
          :class="{ active: activeCategory === 'data-integration' }"
          class="category-btn"
        >
          Data & Integration
        </button>
        <button 
          @click="setActiveCategory('system-config')" 
          :class="{ active: activeCategory === 'system-config' }"
          class="category-btn"
        >
          System Configuration
        </button>
      </div>
      <button @click="goToStudents" class="return-btn">
        <span>←</span> Return to Students
      </button>
    </div>
    
    <!-- Sub Tab Bar - Only show when a category is selected -->
    <div v-if="activeCategory" class="sub-tab-container">
      <TabBar 
        :tabs="getTabsForCategory(activeCategory)" 
        :active-tab="activeTab" 
        @tab-change="handleTabChange" 
      />
    </div>

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

      <!-- Testing Links Tab -->
      <div v-if="activeTab === 'testing-links'" class="admin-section">
        <TestingLinks :students="students" :userMap="userMap" />
      </div>

      <!-- Teacher Feedback Forms Tab -->
      <div v-if="activeTab === 'teacher-feedback'" class="admin-section">
        <AdminTeacherFeedback />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
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
import AdminTeacherFeedback from './AdminTeacherFeedback.vue'
import TestingLinks from '../components/TestingLinks.vue'

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
    AdminBackupRestore,
    AdminTeacherFeedback,
    TestingLinks
  },
  setup() {
    const router = useRouter()
    const activeTab = ref('usersAdd')
    const activeCategory = ref('users-students')
    
    // Load students and users data
    const { students, fetchStudents } = useStudents()
    const { users: userMap, fetchUsers } = useUsers()
    
    // Fetch data on mount
    onMounted(async () => {
      try {
        await Promise.all([fetchStudents(), fetchUsers()])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    })

    const tabs = [
      { key: 'usersAdd', label: 'Add Users', category: 'users-students' },
      { key: 'usersEdit', label: 'Manage Users', category: 'users-students' },
      { key: 'students', label: 'Students', category: 'users-students' },
      { key: 'aide-assignment', label: 'Aide Assignment', category: 'aide-management' },
      { key: 'aide-schedule', label: 'Aide Schedule', category: 'aide-management' },
      { key: 'time-table', label: 'Time Table', category: 'aide-management' },
      { key: 'seis', label: 'SEIS Import', category: 'data-integration' },
      { key: 'aeries', label: 'Aeries API & Import', category: 'data-integration' },
      { key: 'testing-links', label: 'Testing Links', category: 'data-integration' },
      { key: 'teacher-feedback', label: 'Teacher Feedback Forms', category: 'data-integration' },
      { key: 'backup-restore', label: 'Backup & Restore', category: 'data-integration' },
      { key: 'permissions', label: 'Permissions', category: 'system-config' },
      { key: 'settings', label: 'App Settings', category: 'system-config' }
    ]

    const getTabsForCategory = (categoryKey) => {
      return tabs.filter(tab => tab.category === categoryKey)
    }

    const setActiveCategory = (categoryKey) => {
      activeCategory.value = categoryKey
      // Set the first tab of the selected category as active
      const categoryTabs = getTabsForCategory(categoryKey)
      if (categoryTabs.length > 0) {
        activeTab.value = categoryTabs[0].key
      }
    }

    const handleTabChange = (tabKey) => {
      activeTab.value = tabKey
    }

    const goToStudents = () => {
      router.push('/students')
    }

    return {
      activeTab,
      activeCategory,
      tabs,
      students,
      userMap,
      getTabsForCategory,
      setActiveCategory,
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

.admin-nav {
  display: flex;
  gap: 1rem;
}

.category-btn {
  padding: 12px 20px;
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  text-transform: none;
  letter-spacing: normal;
}

.category-btn:hover {
  background: #e9ecef;
  border-color: #dee2e6;
  color: #212529;
}

.category-btn.active {
  background: #2a79c9;
  border-color: #2a79c9;
  color: white;
  box-shadow: 0 2px 4px rgba(42, 121, 201, 0.3);
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

.sub-tab-container {
  margin-bottom: 1.5em;
}

.placeholder-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 1rem;
}

.placeholder-content h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.placeholder-content ul {
  margin-left: 1.5rem;
}

.placeholder-content li {
  margin-bottom: 0.5rem;
  color: #6c757d;
}
</style>
