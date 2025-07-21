<template>
  <div class="security-control-center">
    <!-- IEP Data Encryption Section -->
    <div class="security-section">
      <h3>🔒 IEP Data Encryption</h3>
      <DebugEncryption :selected-student="selectedStudent" />
    </div>

    <!-- Access Logs Section -->
    <div class="security-section">
      <h3>📋 Access Logs</h3>
      <div class="log-filters">
        <select v-model="timeRange" class="form-select">
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
        <button @click="refreshLogs" class="btn btn-secondary">
          Refresh
        </button>
      </div>
      
      <div class="log-table" v-if="accessLogs.length">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Student</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in accessLogs" :key="log.id">
              <td>{{ formatDate(log.timestamp) }}</td>
              <td>{{ log.userEmail }}</td>
              <td>{{ log.action }}</td>
              <td>{{ log.studentId }}</td>
              <td :class="log.success ? 'success' : 'error'">
                {{ log.success ? '✅' : '❌' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-logs">
        No access logs found for selected period
      </div>
    </div>

    <!-- Session Security Section -->
    <div class="security-section">
      <h3>⏲️ Session Security</h3>
      
      <!-- Debug Component -->
      <SessionTimeoutDebug />
      
      <div class="setting-group">
        <label>
          <input 
            type="checkbox" 
            v-model="sessionTimeoutEnabled"
            @change="toggleSessionTimeout"
          >
          Enable Auto Logout Timer
        </label>
        <div class="setting-description">
          Automatically log out users after a period of inactivity
        </div>
      </div>

      <div class="setting-group" v-if="sessionTimeoutEnabled">
        <label>
          Auto Logout Timer (minutes):
          <input 
            type="number" 
            v-model="sessionTimeout" 
            min="5" 
            max="120"
            @change="updateSessionTimeout"
          >
        </label>
        <div class="setting-description">
          Users will be automatically logged out after this period of inactivity
        </div>
      </div>

      <div class="setting-group">
        <label>
          <input 
            type="checkbox" 
            v-model="enforcePasswordChange"
            @change="updatePasswordPolicy"
          >
          Enforce Password Change Every 90 Days
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input 
            type="checkbox" 
            v-model="requireMFA"
            @change="updateMFAPolicy"
          >
          Require Two-Factor Authentication for Admin Access
        </label>
      </div>
    </div>

    <!-- Data Access Controls -->
    <div class="security-section">
      <h3>🔑 Data Access Controls</h3>
      <div class="setting-group">
        <label>
          <input 
            type="checkbox" 
            v-model="restrictExport"
            @change="updateExportPolicy"
          >
          Restrict Data Export to Admins Only
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input 
            type="checkbox" 
            v-model="watermarkPDFs"
            @change="updatePDFPolicy"
          >
          Add Watermark to Exported PDFs
        </label>
      </div>

      <div class="setting-group">
        <label>
          Maximum Failed Login Attempts:
          <input 
            type="number" 
            v-model="maxLoginAttempts" 
            min="3" 
            max="10"
            @change="updateLoginPolicy"
          >
        </label>
      </div>
    </div>

    <!-- IP Restrictions -->
    <div class="security-section">
      <h3>🌐 IP Access Control</h3>
      <div class="ip-list">
        <div class="ip-input">
          <input 
            type="text" 
            v-model="newIP"
            placeholder="Enter IP address or range"
          >
          <button @click="addAllowedIP" class="btn btn-primary">
            Add IP
          </button>
        </div>
        
        <div v-if="allowedIPs.length" class="ip-table">
          <div v-for="ip in allowedIPs" :key="ip" class="ip-row">
            <span>{{ ip }}</span>
            <button @click="removeIP(ip)" class="btn btn-danger btn-sm">
              Remove
            </button>
          </div>
        </div>
        <div v-else class="no-ips">
          No IP restrictions configured
        </div>
      </div>
    </div>

    <!-- Security Alerts -->
    <div class="security-section">
      <h3>🚨 Security Alerts</h3>
      <div class="alert-settings">
        <div class="setting-group">
          <label>
            <input 
              type="checkbox" 
              v-model="alertSettings.failedLogins"
              @change="updateAlertSettings"
            >
            Alert on Multiple Failed Login Attempts
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input 
              type="checkbox" 
              v-model="alertSettings.unusualAccess"
              @change="updateAlertSettings"
            >
            Alert on Unusual Access Patterns
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input 
              type="checkbox" 
              v-model="alertSettings.bulkExport"
              @change="updateAlertSettings"
            >
            Alert on Bulk Data Exports
          </label>
        </div>

        <div class="alert-emails">
          <h4>Alert Recipients:</h4>
          <div class="email-input">
            <input 
              type="email" 
              v-model="newAlertEmail"
              placeholder="Enter email address"
            >
            <button @click="addAlertEmail" class="btn btn-primary">
              Add
            </button>
          </div>
          
          <div v-if="alertEmails.length" class="email-list">
            <div v-for="email in alertEmails" :key="email" class="email-row">
              <span>{{ email }}</span>
              <button @click="removeAlertEmail(email)" class="btn btn-danger btn-sm">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase'
import DebugEncryption from './DebugEncryption.vue'
import SessionTimeoutDebug from './SessionTimeoutDebug.vue'
import { useSessionTimeout } from '@/composables/useSessionTimeout'

// Props
const props = defineProps({
  selectedStudent: {
    type: Object,
    default: null
  }
})

// Access Logs
const accessLogs = ref([])
const timeRange = ref(1)

// Session Security - Use real session timeout system
const { isEnabled: sessionTimeoutEnabled, timeoutMinutes: sessionTimeout, updateSettings } = useSessionTimeout()
const enforcePasswordChange = ref(false)
const requireMFA = ref(false)

// Data Access
const restrictExport = ref(true)
const watermarkPDFs = ref(true)
const maxLoginAttempts = ref(5)

// IP Restrictions
const allowedIPs = ref([])
const newIP = ref('')

// Alert Settings
const alertSettings = ref({
  failedLogins: true,
  unusualAccess: true,
  bulkExport: true
})
const alertEmails = ref([])
const newAlertEmail = ref('')

// Methods
const refreshLogs = async () => {
  try {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - timeRange.value)
    
    // Try to fetch from new auditLogs collection first
    try {
      const auditQuery = query(
        collection(db, 'auditLogs'),
        where('timestamp', '>=', daysAgo),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
      
      const auditSnapshot = await getDocs(auditQuery)
      accessLogs.value = auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      if (accessLogs.value.length > 0) {
        console.log('📋 Loaded', accessLogs.value.length, 'audit logs')
        return
      }
    } catch (auditError) {
      console.log('📋 No audit logs found, trying legacy iepAccessLogs')
    }
    
    // Fallback to legacy iepAccessLogs collection
    const q = query(
      collection(db, 'iepAccessLogs'),
      where('timestamp', '>=', daysAgo),
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    
    const snapshot = await getDocs(q)
    accessLogs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log('📋 Loaded', accessLogs.value.length, 'legacy access logs')
    
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    accessLogs.value = [] // Set empty array on error
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

const toggleSessionTimeout = async () => {
  try {
    await updateSettings(sessionTimeoutEnabled.value, sessionTimeout.value)
  } catch (error) {
    console.error('Failed to toggle session timeout:', error)
  }
}

const updateSessionTimeout = async () => {
  try {
    await updateSettings(sessionTimeoutEnabled.value, sessionTimeout.value)
  } catch (error) {
    console.error('Failed to update session timeout:', error)
  }
}

const updatePasswordPolicy = () => {
  // Implementation for updating password policy
  console.log('Password policy updated:', enforcePasswordChange.value)
}

const updateMFAPolicy = () => {
  // Implementation for updating MFA policy
  console.log('MFA policy updated:', requireMFA.value)
}

const updateExportPolicy = () => {
  // Implementation for updating export policy
  console.log('Export policy updated:', restrictExport.value)
}

const updatePDFPolicy = () => {
  // Implementation for updating PDF policy
  console.log('PDF policy updated:', watermarkPDFs.value)
}

const updateLoginPolicy = () => {
  // Implementation for updating login policy
  console.log('Login policy updated:', maxLoginAttempts.value)
}

const addAllowedIP = () => {
  if (newIP.value && !allowedIPs.value.includes(newIP.value)) {
    allowedIPs.value.push(newIP.value)
    newIP.value = ''
  }
}

const removeIP = (ip) => {
  allowedIPs.value = allowedIPs.value.filter(item => item !== ip)
}

const updateAlertSettings = () => {
  // Implementation for updating alert settings
  console.log('Alert settings updated:', alertSettings.value)
}

const addAlertEmail = () => {
  if (newAlertEmail.value && !alertEmails.value.includes(newAlertEmail.value)) {
    alertEmails.value.push(newAlertEmail.value)
    newAlertEmail.value = ''
  }
}

const removeAlertEmail = (email) => {
  alertEmails.value = alertEmails.value.filter(item => item !== email)
}

// Initial load
onMounted(() => {
  refreshLogs()
})
</script>

<style scoped>
.security-control-center {
  padding: 20px;
}

.security-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.security-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.setting-group {
  margin-bottom: 15px;
}

.setting-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.setting-description {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.log-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.log-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.success {
  color: #28a745;
}

.error {
  color: #dc3545;
}

.no-logs {
  text-align: center;
  padding: 20px;
  color: #666;
}

.ip-list, .alert-emails {
  margin-top: 15px;
}

.ip-input, .email-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.ip-row, .email-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 5px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

input[type="text"],
input[type="email"],
input[type="number"],
select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-select {
  min-width: 150px;
}
</style> 