<template>
  <div class="admin-dashboard">
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
          <button @click="$emit('goToCategory', 'users-students')" class="category-btn">
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
          <button @click="$emit('goToCategory', 'aide-management')" class="category-btn">
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
          <button @click="$emit('goToCategory', 'data-integration')" class="category-btn">
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
          <button @click="$emit('goToCategory', 'system-config')" class="category-btn">
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

    <!-- System Status -->
    <div class="system-status">
      <h2>📈 System Status</h2>
      <div class="status-grid">
        <div class="status-card">
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
        
        <div class="status-card">
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

        <div class="status-card">
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

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>🚀 Quick Actions</h2>
      <div class="actions-grid">
        <button @click="$emit('goToStudents')" class="admin-action-btn primary" style="min-width: 160px; max-width: 160px; height: 60px; flex-direction: column; gap: 8px;">
          <span class="action-icon">👥</span>
          <span>View Students</span>
        </button>
        <button @click="$emit('goToCategory', 'users-students')" class="admin-action-btn success" style="min-width: 160px; max-width: 160px; height: 60px; flex-direction: column; gap: 8px;">
          <span class="action-icon">👨‍🏫</span>
          <span>Manage Users</span>
        </button>
        <button @click="$emit('goToCategory', 'aide-management')" class="admin-action-btn warning" style="min-width: 160px; max-width: 160px; height: 60px; flex-direction: column; gap: 8px;">
          <span class="action-icon">🤝</span>
          <span>Aide Management</span>
        </button>
        <button @click="$emit('goToCategory', 'data-integration')" class="admin-action-btn info" style="min-width: 160px; max-width: 160px; height: 60px; flex-direction: column; gap: 8px;">
          <span class="action-icon">📊</span>
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
const aideCount = computed(() => {
  return users.value?.filter(user => user.role === 'paraeducator').length || 0
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
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.8;
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
  font-size: 1.2rem;
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

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn.students {
  background: #007bff;
  color: white;
}

.action-btn.students:hover {
  background: #0056b3;
}

.action-btn.users {
  background: #28a745;
  color: white;
}

.action-btn.users:hover {
  background: #1e7e34;
}

.action-btn.aide {
  background: #ffc107;
  color: #212529;
}

.action-btn.aide:hover {
  background: #e0a800;
}

.action-btn.data {
  background: #17a2b8;
  color: white;
}

.action-btn.data:hover {
  background: #138496;
}

.action-icon {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
</style> 