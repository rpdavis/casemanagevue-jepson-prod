<template>
  <fieldset class="form-col">
    <legend>Documents</legend>
    
    <!-- BIP Document -->
    <div class="document-section">
      <label>
        BIP:
        <input 
          type="file" 
          accept="application/pdf" 
          @change="onFileChange($event, 'bipFile')" 
        />
        <span 
          v-if="mode === 'edit' && student.bipPdfUrl && !form.removeBipFile"
          class="current-file"
        >
          Current: 
          <a :href="student.bipPdfUrl" target="_blank">View BIP</a>
          <button 
            type="button" 
            @click="removeBipFile" 
            class="btn-remove"
          >
            🗑️ Remove
          </button>
        </span>
        <span 
          v-if="form.removeBipFile" 
          class="removed-file"
        >
          BIP file will be removed
        </span>
      </label>
    </div>
    
    <!-- At-A-Glance Document -->
    <div class="document-section">
      <label>
        At-A-Glance PDF:
        <input 
          type="file" 
          accept="application/pdf" 
          @change="onFileChange($event, 'ataglanceFile')" 
        />
        <span 
          v-if="mode === 'edit' && student.ataglancePdfUrl && !form.removeAtaglanceFile"
          class="current-file"
        >
          Current: 
          <a :href="student.ataglancePdfUrl" target="_blank">View At-A-Glance</a>
          <button 
            type="button" 
            @click="removeAtaglanceFile" 
            class="btn-remove"
          >
            🗑️ Remove
          </button>
        </span>
        <span 
          v-if="form.removeAtaglanceFile" 
          class="removed-file"
        >
          At-A-Glance file will be removed
        </span>
      </label>
    </div>
  </fieldset>
</template>

<script setup>
// Props
const props = defineProps({
  form: { type: Object, required: true },
  student: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'new' },
  onFileChange: { type: Function, required: true },
  removeBipFile: { type: Function, required: true },
  removeAtaglanceFile: { type: Function, required: true }
})

// No local state needed - all functions passed as props
</script>

<style scoped>
.document-section {
  margin-bottom: 16px;
}

.document-section label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-file {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-remove {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove:hover {
  background: #d32f2f;
}

.removed-file {
  color: #f44336;
  font-style: italic;
  font-size: 14px;
}
</style> 