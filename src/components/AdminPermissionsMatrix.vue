<template>
  <div class="admin-permissions-matrix">
    <div class="matrix-header">
      <h2>🔐 Admin Panel Permissions Matrix</h2>
      <p class="matrix-description">
        Control which admin panel pages different admin roles can access. Changes are saved automatically.
      </p>
    </div>

    <div class="matrix-container">
      <div v-if="isLoading" class="loading-state">
        <p>Loading permissions...</p>
      </div>
      <table v-else class="permissions-table">
        <thead>
          <tr>
            <th class="page-column">Admin Panel Page</th>
            <th class="role-column">School Admin</th>
            <th class="role-column">504 Coordinator</th>
            <th class="role-column">SPED Chair</th>
          </tr>
        </thead>
        <tbody v-if="isReady">
          <tr v-for="page in adminPages" :key="page.key" class="permission-row">
            <td class="page-info">
              <div class="page-name">{{ page.label }}</div>
              <div class="page-category">{{ page.category }}</div>
              <div class="page-description">{{ page.description }}</div>
            </td>
            <td class="permission-cell">
              <label class="permission-toggle" :class="{ disabled: isPageDisabledForRole(page.key, 'school_admin') }">
                <input 
                  type="checkbox" 
                  v-model="permissions[page.key].school_admin"
                  :disabled="isPageDisabledForRole(page.key, 'school_admin')"
                  @change="updatePermissions(page.key, 'school_admin', $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td class="permission-cell">
              <label class="permission-toggle" :class="{ disabled: isPageDisabledForRole(page.key, 'admin_504') }">
                <input 
                  type="checkbox" 
                  v-model="permissions[page.key].admin_504"
                  :disabled="isPageDisabledForRole(page.key, 'admin_504')"
                  @change="updatePermissions(page.key, 'admin_504', $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td class="permission-cell">
              <label class="permission-toggle" :class="{ disabled: isPageDisabledForRole(page.key, 'sped_chair') }">
                <input 
                  type="checkbox" 
                  v-model="permissions[page.key].sped_chair"
                  :disabled="isPageDisabledForRole(page.key, 'sped_chair')"
                  @change="updatePermissions(page.key, 'sped_chair', $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

    <div class="matrix-actions">
      <div class="bulk-actions">
        <h3>Bulk Actions</h3>
        <div class="bulk-buttons">
          <button @click="grantAllToRole('school_admin')" class="btn btn-success">
            Grant All to School Admin
          </button>
          <button @click="grantAllToRole('admin_504')" class="btn btn-success">
            Grant All to 504 Coordinator
          </button>
          <button @click="grantAllToRole('sped_chair')" class="btn btn-success">
            Grant All to SPED Chair
          </button>
          <button @click="revokeAllPermissions" class="btn btn-warning">
            Revoke All Permissions
          </button>
          <button @click="resetToDefaults" class="btn btn-secondary">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>

    <div class="save-status" v-if="saveStatus">
      <div class="status-message" :class="saveStatus.type">
        {{ saveStatus.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

// Save status
const saveStatus = ref(null)
const isLoading = ref(true)

// Computed property to check if component is ready
const isReady = computed(() => {
  return !isLoading.value && adminPages.value.length > 0 && Object.keys(permissions).length > 0
})

// Admin pages configuration
const adminPages = ref([
  // Dashboard
  { key: 'dashboard', label: 'Dashboard', category: 'Dashboard', description: 'Main admin overview and statistics' },
  
  // User & Student Management
  { key: 'usersAdd', label: 'Add Users', category: 'User Management', description: 'Create new user accounts' },
  { key: 'usersEdit', label: 'Manage Users', category: 'User Management', description: 'Edit existing user accounts' },
  { key: 'students', label: 'Students', category: 'Student Management', description: 'View and manage student records' },
  { key: 'addStudents', label: 'Add Students', category: 'Student Management', description: 'Bulk import student data' },
  
  // Aide Management
  { key: 'aide-assignment', label: 'Aide Assignment', category: 'Aide Management', description: 'Assign aides to students' },
  { key: 'aide-schedule', label: 'Aide Schedule', category: 'Aide Management', description: 'Manage aide schedules' },
  { key: 'time-table', label: 'Time Table', category: 'Aide Management', description: 'Configure school time periods' },
  
  // Data & Integration
  { key: 'seis', label: 'SEIS Import', category: 'Data Integration', description: 'Import SEIS student data' },
  { key: 'aeries', label: 'Aeries API & Import', category: 'Data Integration', description: 'Connect to Aeries SIS' },
  { key: 'testing-links', label: 'Testing Links', category: 'Data Integration', description: 'Google Sheets integration for testing' },
  { key: 'teacher-feedback', label: 'Teacher Feedback Forms', category: 'Data Integration', description: 'Manage teacher feedback system' },
  { key: 'backup-restore', label: 'Backup & Restore', category: 'Data Integration', description: 'Database backup and restore' },
  
  // Settings (renamed from System Configuration)
  { key: 'settings', label: 'App Settings', category: 'Settings', description: 'Global application settings' },
  
  // Bulk Actions (new category for dangerous operations)
  { key: 'delete-all-users', label: 'Delete All Users', category: 'Bulk Actions', description: 'Mass deletion of user accounts (dangerous operation)' },
  { key: 'delete-all-students', label: 'Delete All Students', category: 'Bulk Actions', description: 'Mass deletion of student records (dangerous operation)' },
  
  // System (admin-only access - renamed from System Monitoring)
  { key: 'permissions', label: 'Admin Panel Permissions', category: 'System', description: 'User role and permission management' },
  { key: 'audit-logs', label: 'Audit Logs', category: 'System', description: 'View and search system audit logs' },
  { key: 'iep-security', label: 'IEP Security', category: 'System', description: 'IEP data encryption and security' },
  { key: 'security', label: 'Security Controls', category: 'System', description: 'Security monitoring and controls' },
  { key: 'component-health', label: 'Component Debug', category: 'System', description: 'Component health and debugging' }
])

// Permissions matrix - reactive object
const permissions = reactive({})

// Default permissions for each role (based on Firebase rules and roles.js)
const defaultPermissions = {
  school_admin: {
    // School-level administration - as YOU specified
    dashboard: true,
    usersAdd: true,
    usersEdit: true,
    students: true,
    addStudents: true,
    'aide-assignment': true,
    'aide-schedule': true,
    'time-table': true, // All admin roles get this
    seis: false, // Default OFF as you requested
    aeries: false, // Default OFF as you requested
    'testing-links': true, // All admin roles get this
    'teacher-feedback': true, // All admin roles get this
    'backup-restore': true, // School admin only (as you specified)
    settings: true, // Can access app settings
    // Bulk Actions - dangerous operations
    'delete-all-users': true, // School admin can delete all users
    'delete-all-students': true, // School admin can delete all students
    // System category - admin only
    permissions: false,
    'audit-logs': false,
    'iep-security': false,
    security: false,
    'component-health': false
  },
  admin_504: {
    // 504 plan coordination - as YOU specified
    dashboard: true,
    usersAdd: true, // Can add users
    usersEdit: true, // Can edit users
    students: true,
    addStudents: true,
    'aide-assignment': true, // Can manage aides
    'aide-schedule': true, // Can manage aides
    'time-table': true, // All admin roles get this
    seis: false, // Default OFF as you requested
    aeries: false, // Default OFF as you requested
    'testing-links': true, // All admin roles get this
    'teacher-feedback': true, // All admin roles get this
    'backup-restore': false, // School admin only (as you specified)
    settings: false, // Limited settings access
    // Bulk Actions - dangerous operations (limited access)
    'delete-all-users': false, // 504 Coordinator cannot delete all users
    'delete-all-students': false, // 504 Coordinator cannot delete all students
    // System category - admin only
    permissions: false,
    'audit-logs': false,
    'iep-security': false,
    security: false,
    'component-health': false
  },
  sped_chair: {
    // SPED program management - as YOU specified
    dashboard: true,
    usersAdd: true, // SPED Chair CAN add users (as you requested)
    usersEdit: true, // SPED Chair CAN edit users (as you requested)
    students: true,
    addStudents: true,
    'aide-assignment': true,
    'aide-schedule': true,
    'time-table': true, // All admin roles get this
    seis: false, // Default OFF as you requested
    aeries: false, // Default OFF as you requested
    'testing-links': true, // All admin roles get this
    'teacher-feedback': true, // SPED Chair manages this
    'backup-restore': false, // School admin only (as you specified)
    settings: false, // Limited settings access
    // Bulk Actions - dangerous operations (no access)
    'delete-all-users': false, // SPED Chair cannot delete all users
    'delete-all-students': false, // SPED Chair cannot delete all students
    // System category - admin only
    permissions: false,
    'audit-logs': false,
    'iep-security': false,
    security: false,
    'component-health': false
  }
}

// Initialize permissions structure
const initializePermissions = () => {
  if (!adminPages.value || adminPages.value.length === 0) {
    console.warn('adminPages not initialized yet')
    return
  }
  
  adminPages.value.forEach(page => {
    if (page && page.key) {
      permissions[page.key] = {
        school_admin: defaultPermissions.school_admin[page.key] || false,
        admin_504: defaultPermissions.admin_504[page.key] || false,
        sped_chair: defaultPermissions.sped_chair[page.key] || false
      }
    }
  })
}

// Load permissions from Firestore
const loadPermissions = async () => {
  try {
    const docRef = doc(db, 'app_settings', 'admin_panel_permissions')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      // Merge loaded permissions with defaults
      adminPages.value.forEach(page => {
        if (page && page.key && data[page.key]) {
          permissions[page.key] = {
            school_admin: data[page.key].school_admin ?? defaultPermissions.school_admin[page.key],
            admin_504: data[page.key].admin_504 ?? defaultPermissions.admin_504[page.key],
            sped_chair: data[page.key].sped_chair ?? defaultPermissions.sped_chair[page.key]
          }
        }
      })
      showSaveStatus('Permissions loaded successfully', 'success')
    } else {
      // No existing permissions, use defaults
      initializePermissions()
      showSaveStatus('Using default permissions', 'info')
    }
  } catch (error) {
    console.error('Error loading permissions:', error)
    showSaveStatus('Error loading permissions', 'error')
    // Fall back to defaults
    initializePermissions()
  } finally {
    isLoading.value = false
  }
}

// Save permissions to Firestore
const savePermissions = async () => {
  try {
    const docRef = doc(db, 'app_settings', 'admin_panel_permissions')
    await setDoc(docRef, permissions)
    showSaveStatus('Permissions saved successfully', 'success')
  } catch (error) {
    console.error('Error saving permissions:', error)
    showSaveStatus('Error saving permissions', 'error')
  }
}

// Update individual permission
const updatePermissions = async (pageKey, role, value) => {
  if (permissions[pageKey]) {
    permissions[pageKey][role] = value
    await savePermissions()
  }
}

// Bulk actions
const grantAllToRole = async (role) => {
  adminPages.value.forEach(page => {
    if (page && page.key && permissions[page.key]) {
      permissions[page.key][role] = true
    }
  })
  await savePermissions()
  showSaveStatus(`All permissions granted to ${role}`, 'success')
}

const revokeAllPermissions = async () => {
  adminPages.value.forEach(page => {
    if (page && page.key && permissions[page.key]) {
      permissions[page.key].school_admin = false
      permissions[page.key].admin_504 = false
      permissions[page.key].sped_chair = false
    }
  })
  await savePermissions()
  showSaveStatus('All permissions revoked', 'warning')
}

const resetToDefaults = async () => {
  initializePermissions()
  await savePermissions()
  showSaveStatus('Permissions reset to defaults', 'info')
}

// Check if a page should be disabled for a role (based on Firebase rules)
const isPageDisabledForRole = (pageKey, role) => {
  // System category pages - only admin can access these
  const systemPages = ['permissions', 'iep-security', 'security', 'component-health']
  if (systemPages.includes(pageKey)) {
    return true // Always disabled for non-admin roles
  }
  
  // Bulk Actions - dangerous operations (restricted access)
  const bulkActionPages = ['delete-all-users', 'delete-all-students']
  if (bulkActionPages.includes(pageKey)) {
    // Only school_admin should have access to bulk delete operations by default
    return role !== 'school_admin'
  }
  
  // Role-specific restrictions based on Firebase rules and roles.js
  if (role === 'admin_504') {
    // 504 Coordinator restrictions (minimal - as YOU specified)
    const restrictedFor504 = ['settings'] // Only settings restricted
    return restrictedFor504.includes(pageKey)
  }
  
  if (role === 'sped_chair') {
    // SPED Chair restrictions (minimal - as YOU specified)
    const restrictedForSped = ['settings'] // Only settings restricted
    return restrictedForSped.includes(pageKey)
  }
  
  return false // No restrictions for school_admin
}

// Show save status message
const showSaveStatus = (message, type) => {
  saveStatus.value = { message, type }
  setTimeout(() => {
    saveStatus.value = null
  }, 3000)
}

// Initialize on mount
onMounted(async () => {
  await loadPermissions()
})
</script>

<style scoped>
.admin-permissions-matrix {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.matrix-header {
  margin-bottom: 30px;
}

.matrix-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 24px;
}

.matrix-description {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 30px;
}

.loading-state p {
  color: #666;
  font-size: 18px;
}

.matrix-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.permissions-table {
  width: 100%;
  border-collapse: collapse;
}

.permissions-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.page-column {
  width: 40%;
}

.role-column {
  width: 20%;
  text-align: center;
}

.permission-row {
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s;
}

.permission-row:hover {
  background: #f8f9fa;
}

.page-info {
  padding: 15px;
}

.page-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.page-category {
  font-size: 12px;
  color: #007bff;
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 3px;
}

.page-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.permission-cell {
  padding: 15px;
  text-align: center;
}

.permission-toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.permission-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #28a745;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.permission-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-toggle.disabled .toggle-slider {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.permission-toggle.disabled input:checked + .toggle-slider {
  background-color: #6c757d;
}

.matrix-actions {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 25px;
  margin-bottom: 20px;
}

.bulk-actions h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.bulk-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.save-status {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.status-message {
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@media (max-width: 768px) {
  .permissions-table {
    font-size: 14px;
  }
  
  .page-column {
    width: 50%;
  }
  
  .role-column {
    width: 16.67%;
  }
  
  .bulk-buttons {
    flex-direction: column;
  }
}
</style> 