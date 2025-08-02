<template>
  <div class="debug-encryption">
    <div class="debug-header">
      <h3>🔒 IEP Encryption Control</h3>
      <div class="environment-badge" :class="environment">
        {{ environment.toUpperCase() }}
      </div>
    </div>

    <div class="encryption-status">
      <div class="status-row">
        <div class="status-label">Status:</div>
        <div class="status-value" :class="{ enabled: isEnabled }">
          {{ isEnabled ? '🔒 Enabled' : '🔓 Disabled' }}
        </div>
      </div>

      <div class="encryption-toggle">
        <label>
          <input 
            type="checkbox" 
            :checked="isEnabled"
            @change="toggleEncryption"
          >
          Toggle Encryption
        </label>
        <div v-if="environment === 'production' && !isEnabled" class="warning">
          ⚠️ Warning: Encryption disabled in production
        </div>
      </div>

      <div class="status-details">
        <div class="status-row">
          <div class="status-label">Environment:</div>
          <div class="status-value">{{ environment }}</div>
        </div>
        <div class="status-row">
          <div class="status-label">Encryption Key:</div>
          <div class="status-value">
            {{ status.keyAvailable ? '✅ Available' : '❌ Missing' }}
          </div>
        </div>
        <div class="status-row">
          <div class="status-label">VITE_ENABLE_ENCRYPTION:</div>
          <div class="status-value">
            <div v-if="status.isViteSet" class="env-value-set">
              <span class="env-value" :class="{ 'true-value': status.viteEncryptionValue === 'true', 'false-value': status.viteEncryptionValue === 'false' }">
                {{ status.viteEncryptionValue }}
              </span>
              <div class="env-guidance">
                <span v-if="status.viteEncryptionValue === 'true'" class="dev-guidance">🔧 Development mode</span>
                <span v-else-if="status.viteEncryptionValue === 'false'" class="prod-guidance">🚀 Production mode</span>
              </div>
            </div>
            <div v-else class="env-value-not-set">
              <span class="not-set">Not set</span>
              <div class="env-guidance">
                <span class="default-guidance">Defaults to enabled (secure)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="status-row">
          <div class="status-label">Legacy ENV:</div>
          <div class="status-value">
            {{ status.environmentVariable || 'Not set' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedStudent" class="debug-info">
      <h4>Selected Student Data:</h4>
      <div class="field-status" v-for="field in sensitiveFields" :key="field">
        <div class="field-name">{{ field }}:</div>
        <div class="field-value">
          <div class="encryption-status" :class="{ encrypted: isFieldEncrypted(field) }">
            {{ isFieldEncrypted(field) ? '🔒 Encrypted' : '🔓 Plain Text' }}
          </div>
          <div class="value-preview">
            {{ getFieldPreview(field) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { iepSecurityHandler } from '@/utils/iepSecurity'

const props = defineProps({
  selectedStudent: {
    type: Object,
    default: null
  }
})

const status = computed(() => iepSecurityHandler.getEncryptionStatus())
const isEnabled = computed(() => iepSecurityHandler.isEncryptionEnabled())
const environment = computed(() => status.value.environment)

const sensitiveFields = [
  'app.accommodations.assessment',
  'app.accommodations.instruction',
  'app.schedule.classServices',
  'app.studentData.plan'
]

const toggleEncryption = () => {
  iepSecurityHandler.setEncryptionEnabled(!isEnabled.value)
}

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, part) => current && current[part], obj)
}

const isFieldEncrypted = (fieldPath) => {
  if (!props.selectedStudent) return false
  const value = getNestedValue(props.selectedStudent, fieldPath)
  return value ? iepSecurityHandler.isValueEncrypted(value) : false
}

const getFieldPreview = (fieldPath) => {
  if (!props.selectedStudent) return 'No data'
  const value = getNestedValue(props.selectedStudent, fieldPath)
  if (!value) return 'Empty'
  
  if (isFieldEncrypted(fieldPath)) {
    return value.substring(0, 20) + '...' // Show first 20 chars of encrypted data
  }
  
  // For plain text, show preview
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return stringValue.length > 40 ? stringValue.substring(0, 40) + '...' : stringValue
}
</script>

<style scoped>
.debug-encryption {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  font-family: monospace;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.debug-header h3 {
  margin: 0;
  color: #495057;
}

.environment-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.environment-badge.development {
  background: #d4edda;
  color: #155724;
}

.environment-badge.production {
  background: #f8d7da;
  color: #721c24;
}

.encryption-status {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.status-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.status-label {
  width: 120px;
  color: #6c757d;
  font-weight: bold;
}

.status-value {
  color: #212529;
}

.status-value.enabled {
  color: #28a745;
  font-weight: bold;
}

.encryption-toggle {
  margin: 15px 0;
  padding: 10px;
  background: #e9ecef;
  border-radius: 4px;
}

.encryption-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.warning {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.status-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.debug-info {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
}

.field-status {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid #dee2e6;
}

.field-name {
  color: #6c757d;
  font-weight: bold;
}

.field-value {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.encryption-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #d4edda;
  color: #155724;
  display: inline-block;
}

.encryption-status.encrypted {
  background: #cce5ff;
  color: #004085;
}

.value-preview {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 3px;
  word-break: break-all;
}

/* Environment variable display styles */
.env-value-set {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.env-value {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
  font-family: monospace;
}

.env-value.true-value {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.env-value.false-value {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.env-guidance {
  font-size: 11px;
  color: #6c757d;
}

.dev-guidance {
  color: #fd7e14;
  font-weight: 500;
}

.prod-guidance {
  color: #28a745;
  font-weight: 500;
}

.env-value-not-set {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.not-set {
  color: #6c757d;
  font-style: italic;
}

.default-guidance {
  color: #17a2b8;
  font-size: 11px;
  font-weight: 500;
}
</style> 