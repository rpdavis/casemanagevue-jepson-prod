<template>
  <div class="admin-dashboard">
    <!-- Primary Statistics Overview -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">
          <Users :size="32" />
        </div>
        <div class="stat-content">
          <h3>{{ studentCount }}</h3>
          <p>Total Students</p>
        </div>
      </div>
      <div class="stat-card iep">
        <div class="stat-icon">
          <FileText :size="32" />
        </div>
        <div class="stat-content">
          <h3>{{ iepStudentCount }}</h3>
          <p>IEP Students</p>
        </div>
      </div>
      <div class="stat-card plan-504">
        <div class="stat-icon">
          <ClipboardList :size="32" />
        </div>
        <div class="stat-content">
          <h3>{{ plan504Count }}</h3>
          <p>504 Plan Students</p>
        </div>
      </div>
      <div class="stat-card users">
        <div class="stat-icon">
          <UserCheck :size="32" />
        </div>
        <div class="stat-content">
          <h3>{{ userCount }}</h3>
          <p>System Users</p>
        </div>
      </div>
    </div>

    <!-- Role Breakdown -->
    <div class="role-breakdown">
      <h2><UserCog :size="20" /> Staff Role Distribution</h2>
      <div class="role-stats-grid">
        <div class="role-stat" v-for="role in roleBreakdown" :key="role.name">
          <div class="role-icon">
            <component :is="role.icon" :size="24" />
          </div>
          <div class="role-info">
            <span class="role-count">{{ role.count }}</span>
            <span class="role-name">{{ role.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Categories Overview -->
    <div class="categories-grid">
      <!-- User & Student Management -->
      <div class="category-card">
        <div class="category-header">
          <h2><Users :size="18" /> User & Student Management</h2>
          <button @click="$emit('goToCategory', 'users-students')" class="category-btn">
            <ArrowRight :size="16" /> Manage
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">
                <UserPlus :size="18" />
              </div>
              <div>
                <h4>Add Users</h4>
                <p>Create new user accounts with role assignments</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <UserPen :size="18" />
              </div>
              <div>
                <h4>Manage Users</h4>
                <p>Edit existing users, roles, and permissions</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <GraduationCap :size="18" />
              </div>
              <div>
                <h4>Student Administration</h4>
                <p>Comprehensive student data management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aide Management -->
      <div class="category-card">
        <div class="category-header">
          <h2><HandHeart :size="18" /> Paraeducator Management</h2>
          <button @click="$emit('goToCategory', 'aide-management')" class="category-btn">
            <ArrowRight :size="16" /> Manage
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">
                <ClipboardCheck :size="18" />
              </div>
              <div>
                <h4>Aide Assignment</h4>
                <p>Assign paraeducators to students and periods</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <Calendar :size="18" />
              </div>
              <div>
                <h4>Aide Schedule</h4>
                <p>Manage paraeducator schedules and assignments</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <Clock :size="18" />
              </div>
              <div>
                <h4>Time Table</h4>
                <p>Configure school periods and time slots</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data & Integration -->
      <div class="category-card">
        <div class="category-header">
          <h2><Database :size="18" /> Data & Integration</h2>
          <button @click="$emit('goToCategory', 'data-integration')" class="category-btn">
            <ArrowRight :size="16" /> Manage
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">
                <Download :size="18" />
              </div>
              <div>
                <h4>SEIS Import</h4>
                <p>Import student data from SEIS system</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <Link :size="18" />
              </div>
              <div>
                <h4>Aeries API & Import</h4>
                <p>Connect to Aeries SIS for data synchronization</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <TestTube :size="18" />
              </div>
              <div>
                <h4>Testing Links</h4>
                <p>Google Sheets integration and export tools</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <MessageSquare :size="18" />
              </div>
              <div>
                <h4>Teacher Feedback</h4>
                <p>Manage teacher feedback forms and responses</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <HardDrive :size="18" />
              </div>
              <div>
                <h4>Backup & Restore</h4>
                <p>System backup and data restoration tools</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Configuration -->
      <div class="category-card">
        <div class="category-header">
          <h2><Settings :size="18" /> System Configuration</h2>
          <button @click="$emit('goToCategory', 'system-config')" class="category-btn">
            <ArrowRight :size="16" /> Manage
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">
                <Shield :size="18" />
              </div>
              <div>
                <h4>Permissions</h4>
                <p>Role-based access control and permissions matrix</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <Wrench :size="18" />
              </div>
              <div>
                <h4>App Settings</h4>
                <p>Configure application settings and preferences</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <Palette :size="18" />
              </div>
              <div>
                <h4>Theme Customization</h4>
                <p>Customize student page appearance and colors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Status -->
    <div class="system-status">
      <h2><TrendingUp :size="20" /> System Status</h2>
      <div class="status-grid">
        <div class="status-card">
          <h3><RefreshCw :size="18" /> Data Sync Status</h3>
          <div class="sync-status">
            <div class="sync-item">
              <span class="sync-indicator" :class="{ active: googleSheetsConnected }"></span>
              <span>Google Sheets</span>
              <span class="sync-time" v-if="lastSyncTime">{{ formatTime(lastSyncTime) }}</span>
            </div>
            <div class="sync-item">
              <span class="sync-indicator" :class="{ active: aeriesConnected }"></span>
              <span>Aeries SIS</span>
              <span class="sync-time">{{ aeriesStatus }}</span>
            </div>
          </div>
        </div>
        
        <div class="status-card">
          <h3><Activity :size="18" /> User Activity</h3>
          <div class="user-activity">
            <div class="activity-item">
              <span>Active Users Today</span>
              <span class="activity-count">{{ activeUsersToday }}</span>
            </div>
            <div class="activity-item">
              <span>Recent Logins</span>
              <span class="activity-count">{{ recentLogins }}</span>
            </div>
          </div>
        </div>

        <div class="status-card">
          <h3><MonitorSpeaker :size="18" /> System Health</h3>
          <div class="health-indicators">
            <div class="health-item">
              <span>Database</span>
              <span class="health-status healthy">
                <CheckCircle :size="16" /> Healthy
              </span>
            </div>
            <div class="health-item">
              <span>Functions</span>
              <span class="health-status healthy">
                <CheckCircle :size="16" /> Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2><Zap :size="20" /> Quick Actions</h2>
      <div class="actions-grid">
        <button @click="$emit('goToStudents')" class="admin-action-btn primary">
          <Users :size="20" />
          <span>View Students</span>
        </button>
        <button @click="$emit('goToCategory', 'users-students')" class="admin-action-btn success">
          <UserCheck :size="20" />
          <span>Manage Users</span>
        </button>
        <button @click="$emit('goToCategory', 'aide-management')" class="admin-action-btn warning">
          <HandHeart :size="20" />
          <span>Paraeducators</span>
        </button>
        <button @click="$emit('goToCategory', 'data-integration')" class="admin-action-btn info">
          <Database :size="20" />
          <span>Data & Integration</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import useStudents from '@/composables/useStudents'
import useUsers from '@/composables/useUsers'
import { useGoogleSheetsRealtime } from '@/composables/useGoogleSheetsRealtime'

// Lucide Icons
import {
  Users,
  FileText,
  ClipboardList,
  UserCheck,
  UserCog,
  UserPlus,
  UserPen,
  GraduationCap,
  HandHeart,
  ClipboardCheck,
  Calendar,
  Clock,
  Database,
  Download,
  Link,
  TestTube,
  MessageSquare,
  HardDrive,
  Settings,
  Shield,
  Wrench,
  Palette,
  TrendingUp,
  RefreshCw,
  Activity,
  MonitorSpeaker,
  CheckCircle,
  Zap,
  ArrowRight,
  School,
  BookOpen,
  Brain,
  Stethoscope
} from 'lucide-vue-next'

// Define emits
defineEmits(['goToCategory', 'goToStudents'])

// Composables
const { students, fetchStudents } = useStudents()
const { userList: users, fetchUsers } = useUsers()
const { linkedSheetId, lastSyncTime } = useGoogleSheetsRealtime()

// Reactive data
const activeUsersToday = ref(12)
const recentLogins = ref(8)
const aeriesConnected = ref(true)
const aeriesStatus = ref('Connected')

// Computed properties
const studentCount = computed(() => students.value?.length || 0)
const userCount = computed(() => users.value?.length || 0)

// IEP and 504 student counts
const iepStudentCount = computed(() => {
  return students.value?.filter(student => {
    const plan = student.app?.studentData?.plan || student.plan || ''
    return plan.toLowerCase() === 'iep'
  }).length || 0
})

const plan504Count = computed(() => {
  return students.value?.filter(student => {
    const plan = student.app?.studentData?.plan || student.plan || ''
    return plan === '504'
  }).length || 0
})

// Role breakdown with icons
const roleBreakdown = computed(() => {
  const roles = {}
  users.value?.forEach(user => {
    const role = user.role || 'unknown'
    if (!roles[role]) {
      roles[role] = 0
    }
    roles[role]++
  })

  const roleMapping = {
    'admin': { name: 'Administrators', icon: Shield },
    'school_admin': { name: 'School Admins', icon: School },
    'teacher': { name: 'Teachers', icon: BookOpen },
    'case_manager': { name: 'Case Managers', icon: UserCheck },
    'paraeducator': { name: 'Paraeducators', icon: HandHeart },
    'service_provider': { name: 'Service Providers', icon: Stethoscope },
    'sped_chair': { name: 'SPED Chairs', icon: Brain },
    'admin_504': { name: '504 Admins', icon: ClipboardList },
    'staff_view': { name: 'Staff (View)', icon: Users },
    'staff_edit': { name: 'Staff (Edit)', icon: UserPen }
  }

  return Object.entries(roles).map(([role, count]) => ({
    name: roleMapping[role]?.name || role.replace('_', ' ').toUpperCase(),
    count,
    icon: roleMapping[role]?.icon || Users
  })).sort((a, b) => b.count - a.count).slice(0, 8) // Show top 8 roles
})

const linkedSheetsCount = computed(() => linkedSheetId.value ? 1 : 0)
const googleSheetsConnected = computed(() => !!linkedSheetId.value)

// Methods
const formatTime = (date) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleString()
}

// Initialize data
onMounted(async () => {
  try {
    await Promise.all([
      fetchStudents(),
      fetchUsers()
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
})
</script>

<style scoped>
.admin-dashboard {
  padding: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid var(--primary-color);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.stat-card.primary {
  border-left-color: #1976d2;
}

.stat-card.iep {
  border-left-color: #2e7d32;
}

.stat-card.plan-504 {
  border-left-color: #f57c00;
}

.stat-card.users {
  border-left-color: #7b1fa2;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.stat-card.iep .stat-icon {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
}

.stat-card.plan-504 .stat-icon {
  background: rgba(245, 124, 0, 0.1);
  color: #f57c00;
}

.stat-card.users .stat-icon {
  background: rgba(123, 31, 162, 0.1);
  color: #7b1fa2;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
  font-weight: 700;
}

.stat-content p {
  margin: 0.25rem 0 0 0;
  color: #6c757d;
  font-size: 0.9rem;
}

/* Role Breakdown */
.role-breakdown {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
}

.role-breakdown h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.role-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.role-stat:hover {
  background: #e3f2fd;
  border-color: #1976d2;
}

.role-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
}

.role-name {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.category-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.category-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.category-btn {
  padding: 0.4rem 0.8rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.category-btn:hover {
  background: #0056b3;
}

.category-content {
  padding: 1rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
  margin-top: 0.1rem;
}

.feature-item h4 {
  margin: 0 0 0.2rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.feature-item p {
  margin: 0;
  color: #6c757d;
  font-size: 0.8rem;
  line-height: 1.3;
}

.system-status {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.system-status h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.status-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.status-card h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.sync-status, .user-activity, .health-indicators {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sync-item, .activity-item, .health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.sync-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  display: inline-block;
  margin-right: 0.5rem;
}

.sync-indicator.active {
  background: #28a745;
}

.sync-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.activity-count {
  font-weight: 600;
  color: #007bff;
}

.health-status {
  font-size: 0.8rem;
  font-weight: 500;
}

.health-status.healthy {
  color: #28a745;
}

.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-actions h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.admin-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  min-height: 80px;
}

.admin-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.15);
}

.admin-action-btn.primary {
  background: #1976d2;
  color: white;
}

.admin-action-btn.primary:hover {
  background: #1565c0;
}

.admin-action-btn.success {
  background: #2e7d32;
  color: white;
}

.admin-action-btn.success:hover {
  background: #1b5e20;
}

.admin-action-btn.warning {
  background: #f57c00;
  color: white;
}

.admin-action-btn.warning:hover {
  background: #ef6c00;
}

.admin-action-btn.info {
  background: #0288d1;
  color: white;
}

.admin-action-btn.info:hover {
  background: #0277bd;
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .role-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .admin-action-btn {
    padding: 1rem;
    min-height: 60px;
  }
}
</style> 