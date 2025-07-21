<template>
  <div class="health-card" :class="[component.status, { disabled: !component.enabled }]">
    <div class="card-header">
      <div class="component-info">
        <h4 class="component-name">{{ component.name }}</h4>
        <p class="component-description">{{ component.description }}</p>
      </div>
      <div class="status-indicator" :class="component.status">
        {{ getStatusIcon(component.status) }}
      </div>
    </div>

    <div class="card-body">
      <!-- Status Details -->
      <div class="status-details">
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value" :class="component.status">
            {{ getStatusText(component.status) }}
          </span>
        </div>
        
        <div v-if="component.latency !== null" class="detail-row">
          <span class="detail-label">Latency:</span>
          <span class="detail-value" :class="getLatencyClass(component.latency)">
            {{ component.latency }}ms
          </span>
        </div>
        
        <div v-if="component.lastCheck" class="detail-row">
          <span class="detail-label">Last Check:</span>
          <span class="detail-value">{{ formatTime(component.lastCheck) }}</span>
        </div>
      </div>

      <!-- Error Messages -->
      <div v-if="component.errors && component.errors.length" class="errors-section">
        <div class="errors-header">⚠️ Issues:</div>
        <ul class="errors-list">
          <li v-for="error in component.errors" :key="error" class="error-item">
            {{ error }}
          </li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions">
        <button 
          @click="$emit('test', component)"
          :disabled="isLoading"
          class="btn btn-primary btn-sm"
        >
          {{ isLoading ? '🔄' : '🧪' }} Test
        </button>
        
        <button 
          @click="$emit('toggle', component)"
          class="btn btn-sm"
          :class="component.enabled ? 'btn-warning' : 'btn-success'"
        >
          {{ component.enabled ? '⏸️ Disable' : '▶️ Enable' }}
        </button>
        
        <button 
          @click="showDetails = !showDetails"
          class="btn btn-secondary btn-sm"
        >
          {{ showDetails ? '👁️‍🗨️ Less' : '👁️ More' }}
        </button>
      </div>

      <!-- Detailed Information -->
      <div v-if="showDetails" class="details-section">
        <div class="details-content">
          <div class="detail-item">
            <strong>Test Function:</strong> {{ component.testFunction || 'N/A' }}
          </div>
          <div class="detail-item">
            <strong>Enabled:</strong> {{ component.enabled ? 'Yes' : 'No' }}
          </div>
          <div class="detail-item" v-if="component.lastCheck">
            <strong>Last Test:</strong> {{ formatDateTime(component.lastCheck) }}
          </div>
          <div class="detail-item">
            <strong>Component ID:</strong> {{ generateComponentId(component.name) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">🔄</div>
      <div class="loading-text">Testing component...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  component: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['test', 'toggle'])

// Local state
const showDetails = ref(false)
const isLoading = ref(false)

// Watch for component status changes to show loading
watch(() => props.component.status, (newStatus, oldStatus) => {
  if (oldStatus === 'checking' && newStatus !== 'checking') {
    isLoading.value = false
  } else if (newStatus === 'checking') {
    isLoading.value = true
  }
}, { immediate: true })

// Methods
const getStatusIcon = (status) => {
  switch (status) {
    case 'operational': return '✅'
    case 'degraded': return '⚠️'
    case 'down': return '❌'
    case 'disabled': return '⏸️'
    case 'checking': return '🔄'
    default: return '❓'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'operational': return 'Healthy'
    case 'degraded': return 'Issues'
    case 'down': return 'Failed'
    case 'disabled': return 'Disabled'
    case 'checking': return 'Testing...'
    default: return 'Unknown'
  }
}

const getLatencyClass = (latency) => {
  if (latency < 100) return 'latency-good'
  if (latency < 500) return 'latency-ok'
  return 'latency-poor'
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(timestamp)
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(timestamp)
}

const generateComponentId = (name) => {
  return name.toLowerCase().replace(/\s+/g, '-')
}
</script>

<style scoped>
.health-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
}

.health-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.health-card.operational {
  border-color: #28a745;
}

.health-card.degraded {
  border-color: #ffc107;
}

.health-card.down {
  border-color: #dc3545;
}

.health-card.disabled {
  opacity: 0.7;
  border-color: #6c757d;
}

.health-card.checking {
  border-color: #17a2b8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.component-info {
  flex: 1;
}

.component-name {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.component-description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.status-indicator {
  font-size: 24px;
  margin-left: 15px;
  animation: pulse 2s infinite;
}

.status-indicator.operational {
  animation: none;
}

.status-indicator.checking {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.card-body {
  padding: 20px;
}

.status-details {
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
}

.detail-value.operational {
  color: #28a745;
}

.detail-value.degraded {
  color: #ffc107;
}

.detail-value.down {
  color: #dc3545;
}

.detail-value.disabled {
  color: #6c757d;
}

.detail-value.checking {
  color: #17a2b8;
}

.latency-good {
  color: #28a745;
}

.latency-ok {
  color: #ffc107;
}

.latency-poor {
  color: #dc3545;
}

.errors-section {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
}

.errors-header {
  font-weight: 600;
  color: #856404;
  margin-bottom: 8px;
}

.errors-list {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.error-item {
  font-size: 13px;
  margin-bottom: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.details-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.details-content {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.detail-item {
  font-size: 13px;
  margin-bottom: 6px;
  color: #666;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary { background: #007bff; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-warning { background: #ffc107; color: #212529; }
.btn-sm { padding: 4px 8px; font-size: 11px; }

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style> 