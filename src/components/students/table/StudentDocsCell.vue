<template>
  <td>
    <div class="docs-item">
      <a v-if="getDocumentUrl(student, 'ataglancePdfUrl')" :href="getDocumentUrl(student, 'ataglancePdfUrl')" target="_blank">At-A-Glance</a>
      <a v-if="getDocumentUrl(student, 'bipPdfUrl')" :href="getDocumentUrl(student, 'bipPdfUrl')" target="_blank">BIP</a>
      <template v-if="!getDocumentUrl(student, 'ataglancePdfUrl') && !getDocumentUrl(student, 'bipPdfUrl')">—</template>
    </div>
  </td>
</template>

<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  getDocumentUrl: {
    type: Function,
    required: true
  }
})
</script> 