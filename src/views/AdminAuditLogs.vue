<template>
  <div class="admin-audit-logs">
    <div class="logs-header">
      <h2>📋 System Audit Logs</h2>
      <p class="logs-description">
        View and search system audit logs for security monitoring and compliance.
      </p>
    </div>

    <!-- Log Filters -->
    <div class="log-controls">
      <div class="log-filters">
        <select v-model="timeRange" @change="refreshLogs" class="form-select">
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        
        <select v-model="logTypeFilter" @change="refreshLogs" class="form-select">
          <option value="">All Log Types</option>
          <option value="student_access">Student Access</option>
          <option value="user_management">User Management</option>
          <option value="system_access">System Access</option>
          <option value="data_export">Data Export</option>
          <option value="session_timeout">Session Timeout</option>
        </select>
        
        <select v-model="actionFilter" @change="refreshLogs" class="form-select">
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create">Create</option>
          <option value="edit">Edit</option>
          <option value="delete">Delete</option>
          <option value="view">View</option>
          <option value="admin_panel_access">Admin Access</option>
        </select>
        
        <input 
          v-model="searchTerm" 
          @input="debouncedSearch"
          type="text" 
          placeholder="Search logs..." 
          class="form-input"
        />
        
        <button @click="refreshLogs" class="btn btn-secondary" :disabled="isLoading">
          🔄 {{ isLoading ? 'Loading...' : 'Refresh' }}
        </button>
        
        <button @click="exportLogs" class="btn btn-primary" :disabled="isLoading">
          📊 Export Logs
        </button>
      </div>
    </div>

    <!-- Status Message -->
    <div v-if="statusMessage" :class="['status-message', { error: isError }]">
      {{ statusMessage }}
    </div>

    <!-- Logs Table -->
    <div class="logs-container">
      <div v-if="isLoading" class="loading-state">
        Loading audit logs...
      </div>
      
      <table v-else-if="filteredLogs.length > 0" class="logs-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedLogs" :key="log.id" class="log-row">
            <td class="timestamp">
              {{ formatTimestamp(log.timestamp) }}
            </td>
            <td class="log-type">
              <span :class="['type-badge', log.type]">
                {{ formatLogType(log.type) }}
              </span>
            </td>
            <td class="user-info">
              <div class="user-email">{{ log.userEmail || 'Unknown' }}</div>
              <div class="user-id">{{ log.userId || log.performedBy || 'N/A' }}</div>
            </td>
            <td class="action">
              {{ log.action || 'N/A' }}
            </td>
            <td class="details">
              <div class="details-preview">
                {{ getDetailsPreview(log) }}
              </div>
            </td>
            <td class="actions">
              <button 
                @click="viewLogDetails(log)" 
                class="btn btn-sm btn-info"
                title="View Details"
              >
                👁️ View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="no-logs">
        <p>No audit logs found for the selected criteria.</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredLogs.length > logsPerPage" class="pagination">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="btn btn-secondary"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }} ({{ filteredLogs.length }} logs)
      </span>
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="btn btn-secondary"
      >
        Next
      </button>
    </div>

    <!-- Log Details Dialog -->
    <div v-if="selectedLog" class="log-dialog-overlay" @click="closeLogDetails">
      <div class="log-dialog" @click.stop>
        <div class="dialog-header">
          <h3>📋 Audit Log Details</h3>
          <button @click="closeLogDetails" class="close-btn">✕</button>
        </div>
        
        <div class="dialog-content">
          <div class="log-detail-section">
            <h4>Basic Information</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Timestamp:</label>
                <span>{{ formatTimestamp(selectedLog.timestamp) }}</span>
              </div>
              <div class="detail-item">
                <label>Log Type:</label>
                <span :class="['type-badge', selectedLog.type]">
                  {{ formatLogType(selectedLog.type) }}
                </span>
              </div>
              <div class="detail-item">
                <label>Action:</label>
                <span>{{ selectedLog.action || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>User Email:</label>
                <span>{{ selectedLog.userEmail || selectedLog.performedByEmail || 'Unknown' }}</span>
              </div>
              <div class="detail-item">
                <label>User ID:</label>
                <span>{{ selectedLog.userId || selectedLog.performedBy || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Session ID:</label>
                <span>{{ selectedLog.sessionId || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>IP Address:</label>
                <span>{{ selectedLog.ipAddress || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedLog.studentId || selectedLog.targetUserId" class="log-detail-section">
            <h4>Target Information</h4>
            <div class="detail-grid">
              <div v-if="selectedLog.studentId" class="detail-item">
                <label>Student ID:</label>
                <span>{{ selectedLog.studentId }}</span>
              </div>
              <div v-if="selectedLog.targetUserId" class="detail-item">
                <label>Target User ID:</label>
                <span>{{ selectedLog.targetUserId }}</span>
              </div>
              <div v-if="selectedLog.studentIds" class="detail-item">
                <label>Student IDs:</label>
                <span>{{ Array.isArray(selectedLog.studentIds) ? selectedLog.studentIds.join(', ') : selectedLog.studentIds }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedLog.details" class="log-detail-section">
            <h4>Additional Details</h4>
            <div class="details-content">
              <pre>{{ formatDetailsJSON(selectedLog.details) }}</pre>
            </div>
          </div>

          <div v-if="selectedLog.exportType || selectedLog.studentCount" class="log-detail-section">
            <h4>Export Information</h4>
            <div class="detail-grid">
              <div v-if="selectedLog.exportType" class="detail-item">
                <label>Export Type:</label>
                <span>{{ selectedLog.exportType }}</span>
              </div>
              <div v-if="selectedLog.studentCount" class="detail-item">
                <label>Student Count:</label>
                <span>{{ selectedLog.studentCount }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="closeLogDetails" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore'

const db = getFirestore()

// State
const logs = ref([])
const isLoading = ref(false)
const statusMessage = ref('')
const isError = ref(false)
const selectedLog = ref(null)

// Filters
const timeRange = ref('7') // days
const logTypeFilter = ref('')
const actionFilter = ref('')
const searchTerm = ref('')

// Pagination
const currentPage = ref(1)
const logsPerPage = 25

// Computed
const filteredLogs = computed(() => {
  let filtered = logs.value

  // Filter by log type
  if (logTypeFilter.value) {
    filtered = filtered.filter(log => log.type === logTypeFilter.value)
  }

  // Filter by action
  if (actionFilter.value) {
    filtered = filtered.filter(log => log.action === actionFilter.value)
  }

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(log => 
      (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(term)) ||
      (log.studentId && log.studentId.toLowerCase().includes(term))
    )
  }

  return filtered
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * logsPerPage
  const end = start + logsPerPage
  return filteredLogs.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / logsPerPage)
})

// Methods
const refreshLogs = async () => {
  isLoading.value = true
  statusMessage.value = ''
  
  try {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange.value))
    
    const auditQuery = query(
      collection(db, 'auditLogs'),
      where('timestamp', '>=', daysAgo),
      orderBy('timestamp', 'desc'),
      limit(500)
    )
    
    const auditSnapshot = await getDocs(auditQuery)
    logs.value = auditSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    currentPage.value = 1
    showStatus(`Loaded ${logs.value.length} audit logs`, false)
    
  } catch (error) {
    console.error('Error loading audit logs:', error)
    showStatus('Error loading audit logs: ' + error.message, true)
  } finally {
    isLoading.value = false
  }
}

const exportLogs = async () => {
  try {
    const csvContent = generateCSV(filteredLogs.value)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showStatus('Audit logs exported successfully', false)
  } catch (error) {
    console.error('Error exporting logs:', error)
    showStatus('Error exporting logs: ' + error.message, true)
  }
}

const generateCSV = (logs) => {
  const headers = ['Timestamp', 'Type', 'User Email', 'User ID', 'Action', 'Details', 'Student ID', 'Session ID', 'IP Address']
  const csvRows = [headers.join(',')]
  
  logs.forEach(log => {
    const row = [
      formatTimestamp(log.timestamp),
      log.type || '',
      log.userEmail || log.performedByEmail || '',
      log.userId || log.performedBy || '',
      log.action || '',
      JSON.stringify(log.details || '').replace(/"/g, '""'),
      log.studentId || log.targetUserId || '',
      log.sessionId || '',
      log.ipAddress || ''
    ]
    csvRows.push(row.map(field => `"${field}"`).join(','))
  })
  
  return csvRows.join('\n')
}

const viewLogDetails = (log) => {
  selectedLog.value = log
}

const closeLogDetails = () => {
  selectedLog.value = null
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  let date
  if (timestamp.toDate) {
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else {
    date = new Date(timestamp)
  }
  
  return date.toLocaleString()
}

const formatLogType = (type) => {
  const typeMap = {
    'student_access': 'Student Access',
    'user_management': 'User Management',
    'system_access': 'System Access',
    'data_export': 'Data Export',
    'session_timeout': 'Session Timeout'
  }
  return typeMap[type] || type
}

const getDetailsPreview = (log) => {
  if (log.details) {
    const details = typeof log.details === 'string' ? log.details : JSON.stringify(log.details)
    return details.length > 50 ? details.substring(0, 50) + '...' : details
  }
  
  // Generate preview from other fields
  const parts = []
  if (log.studentId) parts.push(`Student: ${log.studentId}`)
  if (log.targetUserId) parts.push(`Target: ${log.targetUserId}`)
  if (log.exportType) parts.push(`Export: ${log.exportType}`)
  if (log.studentCount) parts.push(`Count: ${log.studentCount}`)
  
  return parts.join(', ') || 'No additional details'
}

const formatDetailsJSON = (details) => {
  if (!details) return 'No details available'
  
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return details
    }
  }
  
  return JSON.stringify(details, null, 2)
}

const showStatus = (message, error = false) => {
  statusMessage.value = message
  isError.value = error
  setTimeout(() => {
    statusMessage.value = ''
    isError.value = false
  }, 5000)
}

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
  }, 300)
}

// Initialize
onMounted(() => {
  refreshLogs()
})
</script>

<style scoped>
.admin-audit-logs {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.logs-header {
  margin-bottom: 30px;
}

.logs-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 28px;
}

.logs-description {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.log-controls {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.log-filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.form-select, .form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-input {
  min-width: 200px;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.status-message {
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
}

.status-message:not(.error) {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.logs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 18px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.log-row {
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s;
}

.log-row:hover {
  background: #f8f9fa;
}

.logs-table td {
  padding: 12px 15px;
  font-size: 14px;
}

.timestamp {
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.student_access {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.user_management {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.system_access {
  background: #e8f5e8;
  color: #388e3c;
}

.type-badge.data_export {
  background: #fff3e0;
  color: #f57c00;
}

.type-badge.session_timeout {
  background: #ffebee;
  color: #d32f2f;
}

.user-info {
  max-width: 200px;
}

.user-email {
  font-weight: 500;
  color: #2c3e50;
}

.user-id {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.details-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #666;
}

.no-logs {
  padding: 40px;
  text-align: center;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.page-info {
  font-weight: 500;
  color: #2c3e50;
}

/* Dialog Styles */
.log-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.log-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  max-width: 800px;
  max-height: 90vh;
  width: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.log-detail-section {
  margin-bottom: 25px;
}

.log-detail-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.detail-item span {
  color: #2c3e50;
  font-family: monospace;
  font-size: 13px;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
}

.details-content {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  overflow-x: auto;
}

.details-content pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dialog-actions {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .log-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-input {
    min-width: auto;
  }
  
  .logs-table {
    font-size: 12px;
  }
  
  .logs-table th,
  .logs-table td {
    padding: 8px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .log-dialog {
    width: 95%;
    max-height: 95vh;
  }
}
</style>