<template>
  <div class="security-control-center">
    <!-- IEP Data Encryption Section -->
    <div class="security-section">
      <h3>🔒 IEP Data Encryption</h3>
      <DebugEncryption :selected-student="selectedStudent" />
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

    <!-- Login Domain Validation -->
    <div class="security-section">
      <h3>🌐 Login Domain Validation</h3>
      
      <div class="setting-group">
        <label>
          <input 
            type="checkbox" 
            v-model="securitySettings.domainValidation.enabled"
            @change="saveDomainSettings"
          >
          Enable domain validation for login
        </label>
        <div class="setting-description">
          When enabled, only users with approved email domains can sign in. This prevents personal accounts from accessing student data.
        </div>
      </div>

      <div class="setting-group" v-if="securitySettings.domainValidation.enabled">
        <label>
          <input 
            type="checkbox" 
            v-model="securitySettings.domainValidation.controlledByCloudDomain"
            @change="saveDomainSettings"
          >
          Controlled by Google Cloud Domain
        </label>
        <div class="setting-description">
          When enabled, automatically validates against your Google Workspace domain configuration.
        </div>
      </div>

      <div v-if="securitySettings.domainValidation.enabled" class="domain-config">
        <!-- Approved Domains -->
        <div class="subsection">
          <h4>Approved Email Domains:</h4>
          <div class="domain-list">
            <div 
              v-for="domainConfig in securitySettings.domainValidation.domains" 
              :key="domainConfig.id"
              class="domain-item"
            >
              <div class="domain-header">
                <label class="domain-toggle">
                  <input 
                    type="checkbox" 
                    v-model="domainConfig.enabled"
                    :disabled="domainConfig.required || securitySettings.domainValidation.controlledByCloudDomain"
                    @change="saveDomainSettings"
                  />
                  <span class="domain-name">{{ domainConfig.name }}</span>
                  <span v-if="domainConfig.required" class="required-badge">Required</span>
                </label>
              </div>
              
              <div v-if="domainConfig.enabled" class="domain-input-row">
                <input 
                  type="text" 
                  v-model="domainConfig.domain"
                  :placeholder="domainConfig.description.match(/\(([^)]+)\)/)?.[1] || 'yourdomain.edu'"
                  :disabled="securitySettings.domainValidation.controlledByCloudDomain"
                  @blur="saveDomainSettings"
                  class="domain-input"
                />
                <div class="domain-description">{{ domainConfig.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Exceptions -->
        <div class="subsection">
          <h4>Email Exceptions (Tech Team Access):</h4>
          <div class="setting-description">
            Add up to 5 specific email addresses that can bypass domain validation (e.g., cloud console owners, external IT support).
          </div>
          <div class="email-exceptions">
            <div 
              v-for="(exception, index) in securitySettings.domainValidation.emailExceptions" 
              :key="index"
              class="exception-item"
            >
              <input 
                type="email" 
                v-model="exception.email"
                :placeholder="`tech@company.com`"
                @blur="saveDomainSettings"
                class="exception-email"
              />
              <input 
                type="text" 
                v-model="exception.description"
                :placeholder="`Description (e.g., Cloud Console Owner)`"
                @blur="saveDomainSettings"
                class="exception-description"
              />
            </div>
          </div>
        </div>

        <!-- Current Configuration Summary -->
        <div class="subsection">
          <h4>Current Configuration:</h4>
          <div class="config-summary">
            <div v-if="enabledDomains.length === 0 && enabledExceptions.length === 0" class="summary-warning">
              ⚠️ No domains or exceptions configured. Users will not be able to sign in.
            </div>
            <div v-else class="summary-info">
              <div v-if="enabledDomains.length > 0">
                <strong>{{ enabledDomains.length }}</strong> domain(s) enabled:
                <ul class="domain-summary-list">
                  <li v-for="domain in enabledDomains" :key="domain">
                    <code>*@{{ domain }}</code>
                  </li>
                </ul>
              </div>
              <div v-if="enabledExceptions.length > 0" class="exceptions-summary">
                <strong>{{ enabledExceptions.length }}</strong> email exception(s):
                <ul class="exception-summary-list">
                  <li v-for="email in enabledExceptions" :key="email">
                    <code>{{ email }}</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Test Domain Validation -->
        <div class="subsection">
          <h4>Test Domain Validation:</h4>
          <div class="test-section">
            <div class="test-input-group">
              <input 
                type="email" 
                v-model="testEmail"
                placeholder="Enter an email to test (e.g., teacher@yourdomain.edu)"
                class="test-email-input"
              />
              <button 
                type="button" 
                @click="testDomainValidation"
                :disabled="!testEmail"
                class="btn btn-primary"
              >
                Test
              </button>
            </div>
            <div v-if="testResult" class="test-result" :class="testResult.valid ? 'test-success' : 'test-error'">
              {{ testResult.message }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="domain-disabled-info">
        <div class="info-message">
          🔓 Domain validation is disabled. Any Google account can attempt to sign in (subject to user database permissions).
        </div>
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
import { ref, computed, onMounted } from 'vue'
import DebugEncryption from './DebugEncryption.vue'
import SessionTimeoutDebug from './SessionTimeoutDebug.vue'
import { useSessionTimeout } from '@/composables/useSessionTimeout'
import { useSystemSecurity } from '@/composables/useSystemSecurity'

// Props
const props = defineProps({
  selectedStudent: {
    type: Object,
    default: null
  }
})

// System Security Settings
const { 
  securitySettings, 
  loading: securityLoading, 
  loadSecuritySettings, 
  saveSecuritySettings,
  getEnabledDomains,
  getEmailExceptions,
  isEmailAllowed
} = useSystemSecurity()

// Domain validation testing
const testEmail = ref('')
const testResult = ref(null)

// Session Security - Use real session timeout system
const { isEnabled: sessionTimeoutEnabled, timeoutMinutes: sessionTimeout, updateSettings } = useSessionTimeout()
const enforcePasswordChange = ref(false)
const requireMFA = ref(false)

// Data Access
const restrictExport = ref(true)
const watermarkPDFs = ref(true)

// IP Restrictions
const allowedIPs = ref([])
const newIP = ref('')

// Alert Settings
const alertSettings = ref({
  unusualAccess: true,
  bulkExport: true
})
const alertEmails = ref([])
const newAlertEmail = ref('')

// Computed properties for domain validation
const enabledDomains = computed(() => getEnabledDomains())
const enabledExceptions = computed(() => getEmailExceptions())

// Methods
const saveDomainSettings = async () => {
  try {
    await saveSecuritySettings()
    console.log('✅ Domain settings saved')
  } catch (error) {
    console.error('❌ Failed to save domain settings:', error)
  }
}

const testDomainValidation = () => {
  if (!testEmail.value) {
    testResult.value = null
    return
  }

  const email = testEmail.value.trim()
  const isAllowed = isEmailAllowed(email)

  if (isAllowed) {
    testResult.value = {
      valid: true,
      message: '✅ This email would be accepted for login.'
    }
  } else {
    const domains = enabledDomains.value
    const exceptions = enabledExceptions.value
    
    let message = '❌ This email would be rejected.'
    
    if (domains.length > 0 || exceptions.length > 0) {
      message += ` Allowed: `
      const allowed = []
      if (domains.length > 0) {
        allowed.push(`domains: ${domains.join(', ')}`)
      }
      if (exceptions.length > 0) {
        allowed.push(`exceptions: ${exceptions.join(', ')}`)
      }
      message += allowed.join('; ')
    }
    
    testResult.value = {
      valid: false,
      message
    }
  }
}

const formatLogType = (type) => {
  switch (type) {
    case 'student_access':
      return 'Student Access'
    case 'user_management':
      return 'User Management'
    case 'system_access':
      return 'System Access'
    case 'data_export':
      return 'Data Export'
    default:
      return type
  }
}

const formatAction = (action) => {
  if (!action) return 'N/A'
  
  // Convert snake_case to Title Case
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getLogTarget = (log) => {
  if (log.studentId) {
    return `Student ID: ${log.studentId}`
  }
  if (log.targetUserId) {
    return `User ID: ${log.targetUserId}`
  }
  if (log.targetDocumentId) {
    return `Document ID: ${log.targetDocumentId}`
  }
  if (log.targetFileName) {
    return `File: ${log.targetFileName}`
  }
  return 'N/A'
}

const getStatusClass = (log) => {
  if (log.action && (log.action.includes('failed') || log.action.includes('error') || log.action.includes('unauthorized'))) {
    return 'error'
  }
  if (log.action && (log.action.includes('success') || log.action.includes('created') || log.action.includes('edited') || log.action.includes('viewed'))) {
    return 'success'
  }
  return ''
}

const getStatusText = (log) => {
  if (log.action && (log.action.includes('failed') || log.action.includes('error') || log.action.includes('unauthorized'))) {
    return 'Failed'
  }
  if (log.action && (log.action.includes('success') || log.action.includes('created') || log.action.includes('edited') || log.action.includes('viewed'))) {
    return 'Success'
  }
  return 'N/A'
}

const getLogRowClass = (log) => {
  if (log.action && (log.action.includes('failed') || log.action.includes('error') || log.action.includes('unauthorized'))) {
    return 'error-row'
  }
  if (log.action && (log.action.includes('success') || log.action.includes('created') || log.action.includes('edited') || log.action.includes('viewed'))) {
    return 'success-row'
  }
  return ''
}

const showLogDetails = (log) => {
  console.log('Viewing log details:', log)
  // In a real application, you would open a modal or navigate to a detail page
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

// Initialize security settings on mount
onMounted(async () => {
  await loadSecuritySettings()
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

/* Domain Validation Styles */
.domain-config {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
  border: 1px solid #e9ecef;
}

.subsection {
  margin-bottom: 20px;
}

.subsection h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.domain-list {
  margin-bottom: 15px;
}

.domain-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
}

.domain-header {
  margin-bottom: 10px;
}

.domain-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.domain-name {
  color: #495057;
}

.required-badge {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.domain-input-row {
  margin-top: 10px;
}

.domain-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-bottom: 5px;
}

.domain-input:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.domain-description {
  font-size: 12px;
  color: #6c757d;
  margin-top: 5px;
}

.email-exceptions {
  margin-top: 10px;
}

.exception-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.exception-email {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.exception-description {
  flex: 2;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.config-summary {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
}

.summary-warning {
  color: #dc3545;
  font-weight: 500;
}

.summary-info {
  color: #495057;
}

.domain-summary-list,
.exception-summary-list {
  margin: 10px 0;
  padding-left: 20px;
}

.domain-summary-list li,
.exception-summary-list li {
  margin: 5px 0;
}

.domain-summary-list code,
.exception-summary-list code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.exceptions-summary {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.test-section {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
}

.test-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.test-email-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.test-result {
  padding: 10px 15px;
  border-radius: 4px;
  font-weight: 500;
  margin-top: 10px;
}

.test-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.test-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.domain-disabled-info {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 15px;
  margin-top: 15px;
}

.info-message {
  color: #856404;
  margin: 0;
}
</style> 