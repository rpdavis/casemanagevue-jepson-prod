<template>
  <fieldset class="form-col">
    <legend>Documents</legend>
    <div class="document-section">
      <label>BIP:
        <input type="file" accept="application/pdf" @change="e => $emit('file-change', e, 'bipFile')" />
        <span v-if="mode === 'edit' && student.bipPdfUrl && !form.removeBipFile">
          Current: <a :href="student.bipPdfUrl" target="_blank">View BIP</a>
          <button type="button" @click="$emit('remove-bip')" class="btn-remove">🗑️ Remove</button>
        </span>
        <span v-if="form.removeBipFile" class="removed-file">BIP file will be removed</span>
      </label>
    </div>
    <div class="document-section">
      <label>At-A-Glance PDF:
        <input type="file" accept="application/pdf" @change="e => $emit('file-change', e, 'ataglanceFile')" />
        <span v-if="mode === 'edit' && student.ataglancePdfUrl && !form.removeAtaglanceFile">
          Current: <a :href="student.ataglancePdfUrl" target="_blank">View At-A-Glance</a>
          <button type="button" @click="$emit('remove-ataglance')" class="btn-remove">🗑️ Remove</button>
        </span>
        <span v-if="form.removeAtaglanceFile" class="removed-file">At-A-Glance file will be removed</span>
      </label>
    </div>
  </fieldset>
</template>
<script setup>
const props = defineProps({ form: Object, mode: String, student: Object })
</script> 