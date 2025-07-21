<template>
  <td>
    <div class="docs-item">
      
      <a 
        v-if="getDocumentUrl(student, 'ataglancePdfUrl')" 
        href="#" 
        @click.prevent="openSecureFile(getDocumentUrl(student, 'ataglancePdfUrl'))"
      >
        At-A-Glance
      </a>
      <a 
        v-if="getDocumentUrl(student, 'bipPdfUrl')" 
        href="#" 
        @click.prevent="openSecureFile(getDocumentUrl(student, 'bipPdfUrl'))"
      >
        BIP
      </a>
      <template v-if="!getDocumentUrl(student, 'ataglancePdfUrl') && !getDocumentUrl(student, 'bipPdfUrl')">—</template>
    </div>
  </td>
</template>

<script setup>
import usePdfHandler from '@/composables/usePdfHandler'

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

// Use PDF handler for secure download and viewing
const { downloadPdf } = usePdfHandler()

// Handle secure file opening
const openSecureFile = async (filePath) => {
  try {
    if (!filePath) {
      alert('File not found.')
      return
    }
    
    // Get the original filename from the student data
    const originalFileName = props.student.app?.documents?.bipFileName || 
                           props.student.app?.documents?.ataglanceFileName || 
                           'document.pdf'
    
    // Use the secure PDF handler to decrypt and open the file
    await downloadPdf(filePath, props.student.id, originalFileName)
    
  } catch (error) {
    console.error('Error opening secure file:', error)
    alert('Error opening file. Please try again.')
  }
}
</script> 