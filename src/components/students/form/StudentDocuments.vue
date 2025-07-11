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
          v-if="form.bipPdfUrl && !form.removeBipFile"
          class="current-file"
        >
          Current: 
          <a :href="form.bipPdfUrl" target="_blank">View BIP</a>
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
          <button 
            type="button" 
            @click="form.removeBipFile = false" 
            class="btn-undo"
          >
            ↩️ Undo
          </button>
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
          v-if="form.ataglancePdfUrl && !form.removeAtaglanceFile"
          class="current-file"
        >
          Current: 
          <a :href="form.ataglancePdfUrl" target="_blank">View At-A-Glance</a>
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
          <button 
            type="button" 
            @click="form.removeAtaglanceFile = false" 
            class="btn-undo"
          >
            ↩️ Undo
          </button>
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
</script>

<style scoped>
.document-section {
  margin-bottom: var(--spacing-lg);
}

.document-section label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.current-file {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.current-file a {
  color: var(--primary-color);
  text-decoration: none;
}

.current-file a:hover {
  text-decoration: underline;
}

.btn-remove {
  background: var(--error-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
}

.btn-remove:hover {
  background: var(--error-hover);
}

.removed-file {
  color: var(--error-color);
  font-style: italic;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-undo {
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
}

.btn-undo:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

input[type="file"] {
  padding: var(--spacing-sm);
  border: var(--border-width) dashed var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-tertiary);
  cursor: pointer;
}

input[type="file"]:hover {
  border-color: var(--border-dark);
  background: var(--bg-muted);
}
</style> 