<template>
  <div class="sheets-section">
    <h4>Google Sheets Integration</h4>
    
    <!-- Linked Sheet Status -->
    <div v-if="linkedSheetId" class="linked-sheet-status">
      <div class="status-card success">
        <h5>📊 Linked Google Sheet</h5>
        <p>Your student data is synced to Google Sheets</p>
        <button @click="$emit('openGoogleSheet')" class="sheet-link">
          Open Google Sheet →
        </button>
        <div class="sync-info">
          <span v-if="lastSyncTime">Last synced: {{ formatTime(lastSyncTime) }}</span>
          <span v-if="syncStatus === 'syncing'" class="syncing">🔄 Syncing...</span>
          <span v-else-if="syncStatus === 'success'" class="success">✅ Synced</span>
          <span v-else-if="syncStatus === 'error'" class="error">❌ {{ syncMessage }}</span>
        </div>
        <div class="auto-sync-info">
          <span class="auto-sync-badge">
            <span class="pulse"></span>
            Auto-sync enabled
          </span>
          <p class="auto-sync-description">
            Changes to student data, accommodations, and services are automatically synced to your Google Sheet.
          </p>
        </div>
        <div class="sheet-actions">
          <button @click="$emit('syncNow')" :disabled="syncStatus === 'syncing'" class="btn-sync">
            Sync Now
          </button>
          <button @click="$emit('unlinkSheet')" class="btn-unlink">
            Unlink Sheet
          </button>
        </div>
      </div>
    </div>
    
    <!-- Create Linked Sheet -->
    <div v-else class="create-sheet-section">
      <h5>Create a Linked Google Sheet</h5>
      <p>Link your student data to a Google Sheet that automatically updates when changes are made.</p>
      <div class="features-list">
        <div class="feature">
          <span class="feature-icon">🔄</span>
          <span>Auto-syncs when students are added or updated</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📝</span>
          <span>Updates accommodations and services in real-time</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🔗</span>
          <span>Maintains a live connection to your data</span>
        </div>
      </div>
      <button @click="$emit('createLinkedGoogleSheet')" class="btn-primary">
        🔗 Create & Link Google Sheet
      </button>
    </div>
    
    <!-- Alternative Options -->
    <div class="alternative-options">
      <h5>Other Export Options</h5>
      <div class="button-group">
        <button @click="$emit('createGoogleSheetWithData')" class="btn-secondary">
          📊 Create Google Sheet with Data (One-time)
        </button>
        <button @click="$emit('createBlankGoogleSheet')" class="btn-secondary">
          📄 Create Blank Google Sheet
        </button>
        <button @click="$emit('exportToCSV')" class="btn-secondary">
          💾 Export to CSV Only
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  linkedSheetId: String,
  lastSyncTime: [String, Date],
  syncStatus: String,
  syncMessage: String
})

defineEmits([
  'openGoogleSheet',
  'syncNow',
  'unlinkSheet',
  'createLinkedGoogleSheet',
  'createGoogleSheetWithData',
  'createBlankGoogleSheet',
  'exportToCSV'
])

// Import the format time function
const formatTime = (date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.sheets-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.sheets-section h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.2em;
}

.linked-sheet-status {
  margin: 15px 0;
}

.status-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.status-card.success {
  border-left: 4px solid #34a853;
}

.status-card h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1em;
}

.sheet-link {
  display: inline-block;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 500;
  margin: 10px 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
}

.sheet-link:hover {
  text-decoration: underline;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 15px 0;
  font-size: 0.9em;
  color: #666;
}

.sync-info .syncing {
  color: #fbbc04;
}

.sync-info .success {
  color: #34a853;
}

.sync-info .error {
  color: #ea4335;
}

.auto-sync-info {
  margin: 20px 0;
  padding: 15px;
  background: #e8f4fd;
  border-radius: 6px;
  border: 1px solid #c2e0ff;
}

.auto-sync-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #1a73e8;
  color: white;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.auto-sync-description {
  margin: 10px 0 0 0;
  font-size: 0.9em;
  color: #1a73e8;
}

.sheet-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-sync,
.btn-unlink {
  padding: 8px 16px;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  background: #1a73e8;
  color: white;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
}

.btn-unlink {
  border: 1px solid #dadce0;
  background: white;
  color: #ea4335;
}

.btn-sync:hover:not(:disabled) {
  background: #1557b0;
  border-color: #1557b0;
}

.btn-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-unlink:hover {
  background: #fef1f0;
  border-color: #ea4335;
}

.create-sheet-section {
  background: white;
  border: 2px dashed #dadce0;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
}

.create-sheet-section h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.create-sheet-section p {
  color: #666;
  margin: 0 0 20px 0;
}

.features-list {
  margin: 20px 0;
  text-align: left;
}

.feature {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  color: #555;
  font-size: 0.95em;
}

.feature-icon {
  font-size: 1.2em;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1557b0;
}

.alternative-options {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.alternative-options h5 {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 1em;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-secondary:hover {
  background: #545b62;
}
</style> 