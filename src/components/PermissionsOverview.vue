<template>
  <div class="permissions-overview">
    <div class="overview-header">
      <h2>📋 Permissions Overview</h2>
      <p class="overview-description">
        This a summary of the role-based permissions These permissions are hard-coded for consistency and security.
      </p>
    </div>

    <!-- Role Summary Cards -->
    <div class="roles-summary">
      <div class="summary-card" v-for="role in roleData" :key="role.key">
        <div class="role-header" :class="role.key">
          <div class="role-icon">
            <component :is="role.icon" class="w-6 h-6" />
          </div>
          <div class="role-info">
            <h3>{{ role.name }}</h3>
            <p>{{ role.description }}</p>
          </div>
        </div>
        <div class="role-stats">
          <div class="stat">
            <span class="stat-number">{{ role.permissions.length }}</span>
            <span class="stat-label">Permissions</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ role.adminAccess ? 'Yes' : 'No' }}</span>
            <span class="stat-label">Admin Panel</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ role.studentAccessLevel }}</span>
            <span class="stat-label">Student Access</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Permissions Matrix -->
    <div class="permissions-matrix">
      <h3>🔐 Detailed Permissions Matrix</h3>
      <div class="matrix-note">
        <strong>Note:</strong> These permissions are synchronized with Firebase security rules and cannot be modified. They ensure consistent security across your application.
      </div>

      <div class="matrix-table-container">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="permission-column">Permission</th>
              <th v-for="roleKey in roles" :key="roleKey" :class="`role-header ${roleKey}`" :data-role="getShortRoleName(roleKey)"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permission in permissionsList" :key="permission.key" class="permission-row">
              <td class="permission-info">
                <div class="permission-name">{{ permission.name }}</div>
                <div class="permission-description">{{ permission.description }}</div>
                <div class="permission-firebase">{{ permission.firebaseRule }}</div>
              </td>
              <td v-for="roleKey in roles" :key="roleKey" class="permission-cell">
                <span class="permission-indicator" :class="{ granted: hasPermission(roleKey, permission.key) }">
                  {{ hasPermission(roleKey, permission.key) ? '✅' : '❌' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Admin Panel Access -->
    <div class="admin-panel-access">
      <h3>⚙️ Admin Panel Access</h3>
      <div class="access-grid">
        <div v-for="role in roleData" :key="role.key" class="access-card" :class="{ 'has-access': role.adminAccess }">
          <div class="access-header">
            <span class="access-icon">{{ role.adminAccess ? '✅' : '❌' }}</span>
            <span class="role-name">{{ role.name }}</span>
          </div>
          <div class="access-details" v-if="role.adminAccess">
            <div class="access-level">{{ role.adminLevel }}</div>
            <div class="access-description">{{ role.adminDescription }}</div>
          </div>
          <div class="no-access" v-else>
            No admin panel access
          </div>
        </div>
      </div>
    </div>

    <!-- Firebase Rules Summary -->
    <div class="firebase-rules">
      <h3>🔥 Firebase Security Rules Summary</h3>
      <div class="rules-grid">
        <div class="rule-card">
          <h4>👥 Users Collection</h4>
          <ul>
            <li><strong>Read:</strong> All authenticated users</li>
            <li><strong>Write:</strong> Admin, School Admin, 504 Coordinator, SPED Chair</li>
            <li><strong>Delete:</strong> Admin, School Admin, 504 Coordinator, SPED Chair</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>🎓 Students Collection</h4>
          <ul>
            <li><strong>Read:</strong> All authenticated users (role-filtered)</li>
            <li><strong>Write (All):</strong> Admin, School Admin, Staff Edit, 504 Coordinator, SPED Chair</li>
            <li><strong>Write (Own Caseload):</strong> Case Manager, Service Provider</li>
            <li><strong>Delete:</strong> Admin, School Admin, SPED Chair, 504 Coordinator</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>⚙️ App Settings</h4>
          <ul>
            <li><strong>Read:</strong> All authenticated users</li>
            <li><strong>Write:</strong> Admin, School Admin</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>📝 Audit Logs</h4>
          <ul>
            <li><strong>Read:</strong> Admin, School Admin</li>
            <li><strong>Write:</strong> All authenticated users (own actions)</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>📝 Feedback Forms</h4>
          <ul>
            <li><strong>Read:</strong> Admin, School Admin, SPED Chair, 504 Coordinator, Case Manager</li>
            <li><strong>Write:</strong> Admin, School Admin, SPED Chair, 504 Coordinator, Case Manager</li>
            <li><strong>Delete:</strong> Admin, School Admin, SPED Chair, 504 Coordinator</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>💾 Backups</h4>
          <ul>
            <li><strong>Read/Write:</strong> Admin, School Admin</li>
            <li><strong>Delete:</strong> Admin, School Admin</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  ShieldCheck, 
  UserCog, 
  UserSearch, 
  UserPen, 
  Settings, 
  UserCheck, 
  UserPlus, 
  User, 
  HelpCircle,
  Stethoscope
} from 'lucide-vue-next'
import { 
  VALID_ROLES,
  PERMISSIONS_MATRIX, 
  PERMISSION_ACTIONS,
  ROLE_DESCRIPTIONS 
} from '@/config/roles'

// Use PERMISSIONS_MATRIX as the single source of truth for the matrix table
// For the cards, we'll use PERMISSIONS_MATRIX directly to show actual permissions count
const ROLE_PERMISSIONS = PERMISSIONS_MATRIX

// Sort roles by permission count (most to least)
const roles = computed(() => {
  return VALID_ROLES.slice().sort((a, b) => {
    const aPermissions = ROLE_PERMISSIONS[a]?.length || 0
    const bPermissions = ROLE_PERMISSIONS[b]?.length || 0
    return bPermissions - aPermissions // Descending order
  })
})

// Icon mapping for roles
const roleIcons = {
  admin: ShieldCheck,
  school_admin: UserCog,
  staff_view: UserSearch,
  staff_edit: UserPen,
  admin_504: Settings,
  sped_chair: UserCheck,
  case_manager: UserPlus,
  teacher: User,
  paraeducator: HelpCircle,
  service_provider: Stethoscope
}

// Generate role data dynamically from roles.js
const roleData = computed(() => {
  return roles.value.map(roleKey => {
    const permissions = ROLE_PERMISSIONS[roleKey] || []
    const hasAdminPanel = permissions.some(p => p.includes('admin_panel'))
    
    // Determine admin access level
    let adminLevel = 'No Access'
    let adminDescription = 'No admin panel access'
    
    if (permissions.includes('admin_panel_full')) {
      adminLevel = 'Full Access'
      adminDescription = 'All admin panel features including permissions management'
    } else if (permissions.includes('admin_panel_school')) {
      adminLevel = 'School Access'
      adminDescription = 'School operations, users, aides, and students'
    } else if (permissions.includes('admin_panel_limited')) {
      adminLevel = 'Limited Access'
      adminDescription = 'Student management, aide management, and 504-related functions'
    } else if (permissions.includes('admin_panel_sped')) {
      adminLevel = 'SPED Access'
      adminDescription = 'SPED program management and aide oversight'
    }
    
    // Determine student access level based on actual permissions and database query restrictions
    let studentAccessLevel = 'Viewer'
    
    if (permissions.includes(PERMISSION_ACTIONS.EDIT_STUDENT_ALL)) {
      // Roles that can edit ALL students without restrictions
      if (roleKey === 'admin' || roleKey === 'school_admin') {
        studentAccessLevel = 'Admin'
      } else if (roleKey === 'staff_edit') {
        // Staff Editor: Can edit all students but no admin panel access
        studentAccessLevel = 'Editor'
      } else if (roleKey === 'sped_chair') {
        // SPED Chair: Can only see/edit IEP students (database filtered)
        studentAccessLevel = 'Admin/CM'
      } else if (roleKey === 'admin_504') {
        // 504 Coordinator: Can see all students but focuses on 504 students
        studentAccessLevel = 'Admin/CM'
      }
    } else if (permissions.includes(PERMISSION_ACTIONS.EDIT_STUDENT_CM)) {
      if (roleKey === 'admin_504') {
        // 504 Coordinator: Can see all students but only edit 504 students on caseload
        studentAccessLevel = 'Admin/CM'
      } else {
        // Case managers and service providers: own caseload only
        studentAccessLevel = 'CM'
      }
    }
    
    // Get role name from key (capitalize and format)
    const roleName = roleKey === 'admin_504' ? '504 Coordinator' :
                     roleKey === 'sped_chair' ? 'SPED Chair' :
                     roleKey === 'school_admin' ? 'School Administrator' :
                     roleKey === 'staff_view' ? 'Staff Viewer' :
                     roleKey === 'staff_edit' ? 'Staff Editor' :
                     roleKey === 'case_manager' ? 'Case Manager' :
                     roleKey === 'service_provider' ? 'Service Provider' :
                     roleKey.charAt(0).toUpperCase() + roleKey.slice(1)
    
    return {
      key: roleKey,
      name: roleName,
      icon: roleIcons[roleKey] || User,
      description: ROLE_DESCRIPTIONS[roleKey] || `${roleName} role`,
      adminAccess: hasAdminPanel,
      adminLevel,
      adminDescription,
      studentAccessLevel,
      permissions
    }
  })
})

// Generate permissions list from actual PERMISSION_ACTIONS and sort by number of roles with access
const permissionsList = computed(() => {
  const basePermissions = [
    {
      key: PERMISSION_ACTIONS.VIEW_USERS,
      name: 'View Users',
      description: 'Can view user accounts and basic information',
      firebaseRule: 'All authenticated users'
    },
    {
      key: PERMISSION_ACTIONS.EDIT_USER,
      name: 'Edit Users',
      description: 'Can modify user accounts and profiles',
      firebaseRule: 'Admin, School Admin, 504 Coordinator, SPED Chair'
    },
    {
      key: PERMISSION_ACTIONS.DELETE_USER,
      name: 'Delete Users',
      description: 'Can remove user accounts',
      firebaseRule: 'Admin, School Admin, 504 Coordinator, SPED Chair'
    },
    {
      key: PERMISSION_ACTIONS.MANAGE_TEACHER_FEEDBACK,
      name: 'Manage Teacher Feedback',
      description: 'Can create and manage teacher feedback forms',
      firebaseRule: 'Admin, School Admin, SPED Chair, 504 Coordinator, Case Manager'
    },
    {
      key: PERMISSION_ACTIONS.MANAGE_IMPORTS,
      name: 'Manage Data Imports',
      description: 'Can import data from SEIS, Aeries, and other sources',
      firebaseRule: 'Admin, School Admin'
    },
    {
      key: PERMISSION_ACTIONS.MANAGE_BACKUPS,
      name: 'Manage Backups',
      description: 'Can create, restore, and manage database backups',
      firebaseRule: 'Admin, School Admin'
    },
    {
      key: PERMISSION_ACTIONS.VIEW_STUDENTS,
      name: 'View Students',
      description: 'Can view student records (role-filtered)',
      firebaseRule: 'All authenticated users'
    },
    {
      key: PERMISSION_ACTIONS.EDIT_STUDENT_CM,
      name: 'Edit Own Caseload',
      description: 'Can modify students on own caseload',
      firebaseRule: 'Case Manager, Service Provider'
    },
    {
      key: PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
      name: 'Edit All Students',
      description: 'Can modify any student record',
      firebaseRule: 'Admin, School Admin, Staff Edit, 504 Coordinator, SPED Chair'
    },
    {
      key: PERMISSION_ACTIONS.ACCESS_ADMIN_PANEL,
      name: 'Admin Panel Access',
      description: 'Can access administrative functions',
      firebaseRule: 'Admin, School Admin, SPED Chair, 504 Coordinator'
    },
    {
      key: PERMISSION_ACTIONS.MANAGE_AIDES,
      name: 'Aide Management',
      description: 'Can manage aide assignments and schedules',
      firebaseRule: 'Admin, School Admin, SPED Chair, 504 Coordinator'
    },
    {
      key: PERMISSION_ACTIONS.MANAGE_SYSTEM_SETTINGS,
      name: 'System Settings',
      description: 'Can modify system-level configuration',
      firebaseRule: 'Admin only'
    }
  ]

  // Sort permissions by number of roles that have access (most to least)
  return basePermissions.sort((a, b) => {
    const aCount = VALID_ROLES.filter(role => ROLE_PERMISSIONS[role]?.includes(a.key)).length
    const bCount = VALID_ROLES.filter(role => ROLE_PERMISSIONS[role]?.includes(b.key)).length
    return bCount - aCount // Descending order (most access first)
  })
})

// Helper function to check if a role has a permission
const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

// Helper function to get short role names for table headers
const getShortRoleName = (roleKey) => {
  const shortNames = {
    admin: 'Admin',
    school_admin: 'School Admin',
    staff_view: 'Staff View',
    staff_edit: 'Staff Edit',
    admin_504: '504 Coord',
    sped_chair: 'SPED Chair',
    case_manager: 'Case Mgr',
    teacher: 'Teacher',
    service_provider: 'Service',
    paraeducator: 'Para'
  }
  return shortNames[roleKey] || roleKey
}
</script>

<style scoped>
.permissions-overview {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.overview-header {
  margin-bottom: 30px;
}

.overview-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 28px;
}

.overview-description {
  color: #666;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.roles-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.role-header {
 display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}


/* Rainbow gradient colors - Admin stays grey, then purple to yellow */
.role-header.admin { background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%); }
.role-header.school_admin { background: linear-gradient(135deg, #6f42c1 0%, #9775fa 100%); } /* Purple */
.role-header.staff_view { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); } /* Blue */
.role-header.staff_edit { background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); } /* Cyan */
.role-header.admin_504 { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); } /* Green */
.role-header.sped_chair { background: linear-gradient(135deg, #84cc16 0%, #a3e635 100%); } /* Lime */
.role-header.case_manager { background: linear-gradient(135deg, #eab308 0%, #facc15 100%); } /* Yellow */
.role-header.teacher { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); } /* Amber */
.role-header.service_provider { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); } /* Red */
.role-header.paraeducator { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); } /* Pink */

.role-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 15px;
}

.role-icon svg {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.role-info h3 {
  margin: 0 0 5px 0;
  color: #ffffff;
  font-size: 18px;
}

.role-info p {
  margin: 0;
  color: #f7f5f5;
  font-size: 14px;
}

.role-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: white;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.permissions-matrix {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 25px;
  margin-bottom: 30px;
}

.permissions-matrix h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.matrix-note {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  color: #495057;
  font-size: 14px;
}

.matrix-table-container {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.matrix-table th {
  background: #f8f9fa!important;
  padding: 30px 8px;
  font-size: 20px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border: 1px solid #e9ecef;
  white-space: nowrap;
  display: table-cell;
}

.permission-column {
  width: 25%;
  min-width: 200px;
}

.matrix-table .role-header {
  text-align: center;
  width: 80px;
  position: relative;
  height: 60px;
  vertical-align: bottom;
  padding: 0;
}
.matrix-table td{
  border:1px solid #dddede;
}
.matrix-table .role-header {
  background: linear-gradient(135deg, transparent 40%, #f8f9fa 40%, #f8f9fa 60%, transparent 60%);
}

.matrix-table .role-header::after {
  content: attr(data-role);
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
  transform-origin: center;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  color: #2c3e50;
}

.permission-row {
  border-bottom: 1px solid #e9ecef;
}

.permission-row:hover {
  background: #f8f9fa;
}

.permission-info {
  padding: 12px;
}

.permission-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.permission-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.permission-firebase {
  font-size: 11px;
  color: #007bff;
  font-style: italic;
}

.permission-cell {
  text-align: center;
  padding: 12px 8px;
}

.permission-indicator {
  font-size: 16px;
}

.permission-indicator.granted {
  color: #28a745;
}

.admin-panel-access {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 25px;
  margin-bottom: 30px;
}

.admin-panel-access h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.access-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  background: #f8f9fa;
}

.access-card.has-access {
  border-color: #28a745;
  background: #d4edda;
}

.access-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.access-icon {
  margin-right: 10px;
  font-size: 18px;
}

.role-name {
  font-weight: 600;
  color: #2c3e50;
}

.access-level {
  font-weight: 600;
  color: #28a745;
  margin-bottom: 5px;
}

.access-description {
  font-size: 14px;
  color: #666;
}

.no-access {
  color: #666;
  font-style: italic;
}

.firebase-rules {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 25px;
}

.firebase-rules h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.rule-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
}

.rule-card h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

.rule-card ul {
  margin: 0;
  padding-left: 20px;
}

.rule-card li {
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.rule-card strong {
  color: #2c3e50;
}

@media (max-width: 768px) {
  .matrix-table {
    font-size: 11px;
  }
  
  .matrix-table th,
  .permission-cell {
    padding: 8px 4px;
  }
  
  .roles-summary {
    grid-template-columns: 1fr;
  }
}
</style> 