<template>
  <div class="export-options-section">
    <h4>Export Options</h4>
    <p>Additional ways to export and work with your student data</p>
    
    <div class="export-grid">
      <div class="export-card">
        <div class="export-icon">📊</div>
        <h5>Google Sheets with Data</h5>
        <p>Create a new Google Sheet and populate it with current student data (one-time export)</p>
        <button @click="$emit('createGoogleSheetWithData')" class="btn-primary">
          Create Sheet with Data
        </button>
      </div>
      
      <div class="export-card">
        <div class="export-icon">📄</div>
        <h5>Blank Google Sheet</h5>
        <p>Create a new blank Google Sheet that you can customize yourself</p>
        <button @click="$emit('createBlankGoogleSheet')" class="btn-primary">
          Create Blank Sheet
        </button>
      </div>
      
      <div class="export-card">
        <div class="export-icon">💾</div>
        <h5>CSV Export</h5>
        <p>Download student data as a CSV file for use in Excel or other applications</p>
        <button @click="$emit('exportToCSV')" class="btn-primary">
          Download CSV
        </button>
      </div>
    </div>
    
    <div class="export-info">
      <h5>Export Information</h5>
      <ul>
        <li><strong>Linked Sheets:</strong> Automatically sync when data changes</li>
        <li><strong>One-time Exports:</strong> Snapshot of data at export time</li>
        <li><strong>CSV Files:</strong> Compatible with Excel, Numbers, and other spreadsheet apps</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineEmits([
  'createGoogleSheetWithData',
  'createBlankGoogleSheet',
  'exportToCSV'
])
</script>

<style scoped>
.export-options-section {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.export-options-section h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.2em;
}

.export-options-section p {
  color: #666;
  margin-bottom: 1.5rem;
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.export-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s;
}

.export-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #007bff;
}

.export-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.export-card h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1em;
}

.export-card p {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.export-info {
  background: #e8f4fd;
  border: 1px solid #c2e0ff;
  border-radius: 6px;
  padding: 1.5rem;
}

.export-info h5 {
  margin: 0 0 1rem 0;
  color: #1a73e8;
  font-size: 1em;
}

.export-info ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #333;
}

.export-info li {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0056b3;
}
</style> 