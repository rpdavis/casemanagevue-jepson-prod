<template>
  <div class="permissions-overview">
    <div class="overview-header">
      <h2>📋 Permissions Overview</h2>
      <p class="overview-description">
        This is an informational view showing the current role-based permissions that match your Firebase security rules and role-based view settings. These permissions are hard-coded for consistency and security.
      </p>
    </div>

    <!-- Role Summary Cards -->
    <div class="roles-summary">
      <div class="summary-card" v-for="role in roleData" :key="role.key">
        <div class="role-header" :class="role.key">
          <div class="role-icon">{{ role.icon }}</div>
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
            <span class="stat-number">{{ role.testingLevel }}</span>
            <span class="stat-label">Testing Access</span>
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
              <th class="role-header admin">Admin</th>
              <th class="role-header administrator">Administrator</th>
              <th class="role-header administrator_504_CM">Admin 504/CM</th>
              <th class="role-header sped_chair">SPED Chair</th>
              <th class="role-header case_manager">Case Manager</th>
              <th class="role-header teacher">Teacher</th>
              <th class="role-header paraeducator">Paraeducator</th>
              <th class="role-header service_provider">Service Provider</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permission in permissionsList" :key="permission.key" class="permission-row">
              <td class="permission-info">
                <div class="permission-name">{{ permission.name }}</div>
                <div class="permission-description">{{ permission.description }}</div>
                <div class="permission-firebase">{{ permission.firebaseRule }}</div>
              </td>
              <td v-for="role in roles" :key="role" class="permission-cell">
                <span class="permission-indicator" :class="{ granted: hasPermission(role, permission.key) }">
                  {{ hasPermission(role, permission.key) ? '✅' : '❌' }}
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
            <li><strong>Write:</strong> Admin, Administrator, Administrator 504/CM only</li>
            <li><strong>Delete:</strong> Admin, Administrator only</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>🎓 Students Collection</h4>
          <ul>
            <li><strong>Read:</strong> All authenticated users (role-filtered)</li>
            <li><strong>Write (All):</strong> Admin, Administrator, Administrator 504/CM, SPED Chair</li>
            <li><strong>Write (Own Caseload):</strong> Case Manager</li>
            <li><strong>Read-only:</strong> Teacher, Paraeducator, Service Provider</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>⚙️ App Settings</h4>
          <ul>
            <li><strong>Read:</strong> All authenticated users</li>
            <li><strong>Write:</strong> Admin, Administrator only</li>
          </ul>
        </div>
        <div class="rule-card">
          <h4>📝 Audit Logs</h4>
          <ul>
            <li><strong>Read:</strong> Admin, Administrator, SPED Chair</li>
            <li><strong>Write:</strong> All authenticated users (own actions)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Hard-coded permissions that match Firebase rules and role-based views
const ROLE_PERMISSIONS = {
  admin: [
    'view_users', 'edit_user', 'delete_user', 'manage_subjects', 'manage_roles',
    'view_students', 'edit_student_all', 'admin_panel_full', 'testing_all',
    'security_controls', 'backup_restore', 'system_config'
  ],
  administrator: [
    'view_users', 'edit_user', 'delete_user', 'manage_subjects', 'manage_roles',
    'view_students', 'edit_student_all', 'admin_panel_full', 'testing_all'
  ],
  administrator_504_CM: [
    'view_users', 'edit_user', 'delete_user', 'manage_subjects', 'manage_roles',
    'view_students', 'edit_student_all', 'admin_panel_limited'
  ],
  sped_chair: [
    'view_users', 'view_students', 'edit_student_all', 'admin_panel_sped',
    'security_monitoring', 'aide_management'
  ],
  case_manager: [
    'view_users', 'view_students', 'edit_student_cm', 'testing_partial'
  ],
  teacher: [
    'view_users', 'view_students', 'testing_partial'
  ],
  paraeducator: [
    'view_users', 'view_students', 'aide_schedule'
  ],
  service_provider: [
    'view_users', 'view_students'
  ]
}

const roles = ['admin', 'administrator', 'administrator_504_CM', 'sped_chair', 'case_manager', 'teacher', 'paraeducator', 'service_provider']

const roleData = [
  {
    key: 'admin',
    name: 'Admin',
    icon: '👑',
    description: 'Full system access and control',
    adminAccess: true,
    adminLevel: 'Full Access',
    adminDescription: 'All admin panel features including permissions management',
    testingLevel: 'All',
    permissions: ROLE_PERMISSIONS.admin
  },
  {
    key: 'administrator',
    name: 'Administrator',
    icon: '👨‍💼',
    description: 'Administrative management without system permissions',
    adminAccess: true,
    adminLevel: 'Full Access',
    adminDescription: 'All admin panel features except permissions management',
    testingLevel: 'All',
    permissions: ROLE_PERMISSIONS.administrator
  },
  {
    key: 'administrator_504_CM',
    name: 'Administrator 504/CM',
    icon: '📋',
    description: '504 plan and case management administration',
    adminAccess: true,
    adminLevel: 'Limited Access',
    adminDescription: 'Student management and 504-related functions',
    testingLevel: 'None',
    permissions: ROLE_PERMISSIONS.administrator_504_CM
  },
  {
    key: 'sped_chair',
    name: 'SPED Chair',
    icon: '🎓',
    description: 'Special education program oversight',
    adminAccess: true,
    adminLevel: 'SPED Access',
    adminDescription: 'SPED program management and aide oversight',
    testingLevel: 'None',
    permissions: ROLE_PERMISSIONS.sped_chair
  },
  {
    key: 'case_manager',
    name: 'Case Manager',
    icon: '👩‍🏫',
    description: 'Individual student case management',
    adminAccess: false,
    testingLevel: 'Partial',
    permissions: ROLE_PERMISSIONS.case_manager
  },
  {
    key: 'teacher',
    name: 'Teacher',
    icon: '🍎',
    description: 'Classroom teacher with student access',
    adminAccess: false,
    testingLevel: 'Partial',
    permissions: ROLE_PERMISSIONS.teacher
  },
  {
    key: 'paraeducator',
    name: 'Paraeducator',
    icon: '🤝',
    description: 'Educational aide with schedule access',
    adminAccess: false,
    testingLevel: 'None',
    permissions: ROLE_PERMISSIONS.paraeducator
  },
  {
    key: 'service_provider',
    name: 'Service Provider',
    icon: '⚕️',
    description: 'Related services provider',
    adminAccess: false,
    testingLevel: 'None',
    permissions: ROLE_PERMISSIONS.service_provider
  }
]

const permissionsList = [
  {
    key: 'view_users',
    name: 'View Users',
    description: 'Can view user accounts and basic information',
    firebaseRule: 'Authenticated users only'
  },
  {
    key: 'edit_user',
    name: 'Edit Users',
    description: 'Can modify user accounts and roles',
    firebaseRule: 'Admin, Administrator, Administrator 504/CM'
  },
  {
    key: 'delete_user',
    name: 'Delete Users',
    description: 'Can remove user accounts',
    firebaseRule: 'Admin, Administrator only'
  },
  {
    key: 'view_students',
    name: 'View Students',
    description: 'Can view student records (role-filtered)',
    firebaseRule: 'All authenticated users'
  },
  {
    key: 'edit_student_all',
    name: 'Edit All Students',
    description: 'Can modify any student record',
    firebaseRule: 'Admin, Administrator, Administrator 504/CM, SPED Chair'
  },
  {
    key: 'edit_student_cm',
    name: 'Edit Own Caseload',
    description: 'Can modify students on own caseload',
    firebaseRule: 'Case Manager (caseload validation)'
  },
  {
    key: 'admin_panel_full',
    name: 'Full Admin Panel',
    description: 'Access to all admin panel features',
    firebaseRule: 'Admin, Administrator'
  },
  {
    key: 'admin_panel_limited',
    name: 'Limited Admin Panel',
    description: 'Access to student management features',
    firebaseRule: 'Administrator 504/CM'
  },
  {
    key: 'admin_panel_sped',
    name: 'SPED Admin Panel',
    description: 'Access to SPED program management',
    firebaseRule: 'SPED Chair'
  },
  {
    key: 'testing_all',
    name: 'Full Testing Access',
    description: 'Can access all students in testing view',
    firebaseRule: 'Admin, Administrator'
  },
  {
    key: 'testing_partial',
    name: 'Partial Testing Access',
    description: 'Can access assigned students in testing view',
    firebaseRule: 'Case Manager, Teacher'
  },
  {
    key: 'security_controls',
    name: 'Security Controls',
    description: 'Access to security monitoring and controls',
    firebaseRule: 'Admin only'
  },
  {
    key: 'aide_management',
    name: 'Aide Management',
    description: 'Can manage aide assignments and schedules',
    firebaseRule: 'Admin, Administrator, SPED Chair'
  },
  {
    key: 'aide_schedule',
    name: 'Aide Schedule Access',
    description: 'Can view own aide schedule',
    firebaseRule: 'Paraeducator'
  }
]

// Helper function to check if a role has a permission
const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
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

.role-header.admin { background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%); }
.role-header.administrator { background: linear-gradient(135deg, #007bff 0%, #4dabf7 100%); }
.role-header.administrator_504_CM { background: linear-gradient(135deg, #28a745 0%, #51cf66 100%); }
.role-header.sped_chair { background: linear-gradient(135deg, #6f42c1 0%, #9775fa 100%); }
.role-header.case_manager { background: linear-gradient(135deg, #17a2b8 0%, #3bc9db 100%); }
.role-header.teacher { background: linear-gradient(135deg, #fd7e14 0%, #ff922b 100%); }
.role-header.paraeducator { background: linear-gradient(135deg, #20c997 0%, #38d9a9 100%); }
.role-header.service_provider { background: linear-gradient(135deg, #e83e8c 0%, #f06292 100%); }

.role-icon {
  font-size: 24px;
  margin-right: 15px;
}

.role-info h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 18px;
}

.role-info p {
  margin: 0;
  color: #666;
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
  background: #f8f9fa;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.permission-column {
  width: 25%;
  min-width: 200px;
}

.role-header {
  text-align: center;
  width: 80px;
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