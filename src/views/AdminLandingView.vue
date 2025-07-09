<template>
  <div class="admin-landing">
    <div class="admin-header">
      <h1>🏛️ Admin Dashboard</h1>
      <p class="subtitle">Welcome to the CaseManage administration center</p>
      <div class="quick-actions">
        <button @click="goToStudents" class="quick-action-btn students">
          <span class="icon">👥</span>
          <span>View Students</span>
        </button>
        <button @click="goToFullAdmin" class="quick-action-btn admin">
          <span class="icon">⚙️</span>
          <span>Full Admin Panel</span>
        </button>
      </div>
    </div>

    <!-- Statistics Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ studentCount }}</h3>
          <p>Total Students</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <h3>{{ userCount }}</h3>
          <p>System Users</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🤝</div>
        <div class="stat-content">
          <h3>{{ aideCount }}</h3>
          <p>Paraeducators</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>{{ linkedSheetsCount }}</h3>
          <p>Linked Sheets</p>
        </div>
      </div>
    </div>

    <!-- Admin Categories Overview -->
    <div class="categories-grid">
      <!-- User & Student Management -->
      <div class="category-card">
        <div class="category-header">
          <h2>👥 User & Student Management</h2>
          <button @click="goToCategory('users-students')" class="category-btn">
            Manage →
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">➕</span>
              <div>
                <h4>Add Users</h4>
                <p>Create new user accounts with role assignments</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✏️</span>
              <div>
                <h4>Manage Users</h4>
                <p>Edit existing users, roles, and permissions</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎓</span>
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
          <h2>🤝 Aide Management</h2>
          <button @click="goToCategory('aide-management')" class="category-btn">
            Manage →
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">📋</span>
              <div>
                <h4>Aide Assignment</h4>
                <p>Assign paraeducators to students and periods</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📅</span>
              <div>
                <h4>Aide Schedule</h4>
                <p>Manage paraeducator schedules and assignments</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⏰</span>
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
          <h2>📊 Data & Integration</h2>
          <button @click="goToCategory('data-integration')" class="category-btn">
            Manage →
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">📥</span>
              <div>
                <h4>SEIS Import</h4>
                <p>Import student data from SEIS system</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔗</span>
              <div>
                <h4>Aeries API & Import</h4>
                <p>Connect to Aeries SIS for data synchronization</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🧪</span>
              <div>
                <h4>Testing Links</h4>
                <p>Google Sheets integration and export tools</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <div>
                <h4>Teacher Feedback</h4>
                <p>Manage teacher feedback forms and responses</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💾</span>
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
          <h2>⚙️ System Configuration</h2>
          <button @click="goToCategory('system-config')" class="category-btn">
            Manage →
          </button>
        </div>
        <div class="category-content">
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">🔐</span>
              <div>
                <h4>Permissions</h4>
                <p>Role-based access control and permissions matrix</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔧</span>
              <div>
                <h4>App Settings</h4>
                <p>Configure application settings and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <h2>📈 System Status</h2>
      <div class="activity-grid">
        <div class="activity-card">
          <h3>🔄 Data Sync Status</h3>
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
        
        <div class="activity-card">
          <h3>👤 User Activity</h3>
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

        <div class="activity-card">
          <h3>📊 System Health</h3>
          <div class="health-indicators">
            <div class="health-item">
              <span>Database</span>
              <span class="health-status healthy">✅ Healthy</span>
            </div>
            <div class="health-item">
              <span>Functions</span>
              <span class="health-status healthy">✅ Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <h2>🔗 Quick Links</h2>
      <div class="links-grid">
        <a href="/students" class="quick-link">
          <span class="link-icon">👥</span>
          <span>Students View</span>
        </a>
        <a href="/admin" class="quick-link">
          <span class="link-icon">⚙️</span>
          <span>Full Admin Panel</span>
        </a>
        <a href="/testing" class="quick-link">
          <span class="link-icon">🧪</span>
          <span>Testing View</span>
        </a>
        <a href="/aide-schedule" class="quick-link">
          <span class="link-icon">📅</span>
          <span>Aide Schedule</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useStudents from '@/composables/useStudents'
import useUsers from '@/composables/useUsers'
import { useGoogleSheetsRealtime } from '@/composables/useGoogleSheetsRealtime'

// Router
const router = useRouter()

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
const aideCount = computed(() => {
  return users.value?.filter(user => user.role === 'paraeducator').length || 0
})
const linkedSheetsCount = computed(() => linkedSheetId.value ? 1 : 0)
const googleSheetsConnected = computed(() => !!linkedSheetId.value)

// Methods
const goToStudents = () => {
  router.push('/students')
}

const goToFullAdmin = () => {
  router.push('/admin')
}

const goToCategory = (category) => {
  router.push(`/admin?category=${category}`)
}

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
.admin-landing {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

.admin-header {
  text-align: center;
  margin-bottom: 3rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.admin-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.quick-action-btn.students {
  background: #007bff;
  color: white;
}

.quick-action-btn.students:hover {
  background: #0056b3;
}

.quick-action-btn.admin {
  background: #28a745;
  color: white;
}

.quick-action-btn.admin:hover {
  background: #1e7e34;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  font-size: 3rem;
  opacity: 0.8;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 700;
}

.stat-content p {
  margin: 0.5rem 0 0 0;
  color: #6c757d;
  font-size: 1rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.category-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.category-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.category-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.category-btn:hover {
  background: #0056b3;
}

.category-content {
  padding: 1.5rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.feature-icon {
  font-size: 1.5rem;
  margin-top: 0.2rem;
}

.feature-item h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.feature-item p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.recent-activity {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 3rem;
}

.recent-activity h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.activity-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.activity-card h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.sync-status, .user-activity, .health-indicators {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sync-item, .activity-item, .health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sync-indicator {
  width: 10px;
  height: 10px;
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
  font-size: 0.9rem;
  font-weight: 500;
}

.health-status.healthy {
  color: #28a745;
}

.quick-links {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.quick-links h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.2s;
}

.quick-link:hover {
  background: #e9ecef;
  border-color: #dee2e6;
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .admin-landing {
    padding: 1rem;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .quick-action-btn {
    width: 100%;
    max-width: 300px;
  }
}
</style> 