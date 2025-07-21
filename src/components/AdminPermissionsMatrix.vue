<template>
  <div class="admin-permissions-matrix">
    <div class="matrix-header">
      <h2>🔐 Admin Panel Permissions Matrix</h2>
      <p class="matrix-description">
        Control which admin panel pages different admin roles can access. Changes are saved automatically.
      </p>
    </div>

    <div class="matrix-container">
      <table class="permissions-table">
        <thead>
          <tr>
            <th class="page-column">Admin Panel Page</th>
            <th class="role-column">Administrator</th>
            <th class="role-column">Administrator 504/CM</th>
            <th class="role-column">SPED Chair</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in adminPages" :key="page.key" class="permission-row">
            <td class="page-info">
              <div class="page-name">{{ page.label }}</div>
              <div class="page-category">{{ page.category }}</div>
              <div class="page-description">{{ page.description }}</div>
            </td>
            <td class="permission-cell">
              <label class="permission-toggle">
                <input 
                  type="checkbox" 
                  v-model="permissions[page.key].administrator"
                  @change="updatePermissions(page.key, 'administrator', $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td class="permission-cell">
              <label class="permission-toggle">
                <input 
                  type="checkbox" 
                  v-model="permissions[page.key].administrator_504_CM"
                  @change="updatePermissions(page.key, 'administrator_504_CM', $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td class="permission-cell">
              <label class="permission-toggle">
                <input 
                  type="checkbox" 
                  v-model="permissions[page.key].sped_chair"
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
          <button @click="grantAllToRole('administrator')" class="btn btn-success">
            Grant All to Administrator
          </button>
          <button @click="grantAllToRole('administrator_504_CM')" class="btn btn-success">
            Grant All to Administrator 504/CM
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
import { ref, reactive, onMounted } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

// Save status
const saveStatus = ref(null)

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
  
  // System Configuration
  { key: 'permissions', label: 'Permissions', category: 'System Config', description: 'User role and permission management' },
  { key: 'settings', label: 'App Settings', category: 'System Config', description: 'Global application settings' },
  { key: 'iep-security', label: 'IEP Security', category: 'System Config', description: 'IEP data encryption and security' },
  { key: 'security', label: 'Security Controls', category: 'System Config', description: 'Security monitoring and controls' },
  
  // System Monitoring
  { key: 'component-health', label: 'Component Debug', category: 'System Monitoring', description: 'Component health and debugging' }
])

// Permissions matrix - reactive object
const permissions = reactive({})

// Default permissions for each role
const defaultPermissions = {
  administrator: {
    // Full access to user and student management, data integration, basic monitoring
    dashboard: true,
    usersAdd: true,
    usersEdit: true,
    students: true,
    addStudents: true,
    'aide-assignment': true,
    'aide-schedule': true,
    'time-table': true,
    seis: true,
    aeries: true,
    'testing-links': true,
    'teacher-feedback': true,
    'backup-restore': true,
    permissions: false, // Can't modify permissions
    settings: true,
    'iep-security': false, // Limited security access
    security: false, // Limited security access
    'component-health': true
  },
  administrator_504_CM: {
    // Focus on student management and 504 plan related functions
    dashboard: true,
    usersAdd: false, // Limited user management
    usersEdit: true,
    students: true,
    addStudents: true,
    'aide-assignment': false, // Limited aide management
    'aide-schedule': false,
    'time-table': false,
    seis: true,
    aeries: true,
    'testing-links': false, // Limited testing access
    'teacher-feedback': true,
    'backup-restore': false, // No backup access
    permissions: false, // Can't modify permissions
    settings: false, // Limited settings access
    'iep-security': false, // No security access
    security: false,
    'component-health': false
  },
  sped_chair: {
    // Full SPED program management access
    dashboard: true,
    usersAdd: false, // Limited user creation
    usersEdit: true,
    students: true,
    addStudents: true,
    'aide-assignment': true,
    'aide-schedule': true,
    'time-table': true,
    seis: true,
    aeries: true,
    'testing-links': true,
    'teacher-feedback': true,
    'backup-restore': true,
    permissions: false, // Can't modify permissions
    settings: true,
    'iep-security': true, // Access to IEP security
    security: true, // Security monitoring access
    'component-health': true
  }
}

// Initialize permissions structure
const initializePermissions = () => {
  adminPages.value.forEach(page => {
    permissions[page.key] = {
      administrator: defaultPermissions.administrator[page.key] || false,
      administrator_504_CM: defaultPermissions.administrator_504_CM[page.key] || false,
      sped_chair: defaultPermissions.sped_chair[page.key] || false
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
        if (data[page.key]) {
          permissions[page.key] = {
            administrator: data[page.key].administrator ?? defaultPermissions.administrator[page.key],
            administrator_504_CM: data[page.key].administrator_504_CM ?? defaultPermissions.administrator_504_CM[page.key],
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
  permissions[pageKey][role] = value
  await savePermissions()
}

// Bulk actions
const grantAllToRole = async (role) => {
  adminPages.value.forEach(page => {
    permissions[page.key][role] = true
  })
  await savePermissions()
  showSaveStatus(`All permissions granted to ${role}`, 'success')
}

const revokeAllPermissions = async () => {
  adminPages.value.forEach(page => {
    permissions[page.key].administrator = false
    permissions[page.key].administrator_504_CM = false
    permissions[page.key].sped_chair = false
  })
  await savePermissions()
  showSaveStatus('All permissions revoked', 'warning')
}

const resetToDefaults = async () => {
  initializePermissions()
  await savePermissions()
  showSaveStatus('Permissions reset to defaults', 'info')
}

// Show save status message
const showSaveStatus = (message, type) => {
  saveStatus.value = { message, type }
  setTimeout(() => {
    saveStatus.value = null
  }, 3000)
}

// Initialize on mount
onMounted(() => {
  initializePermissions()
  loadPermissions()
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