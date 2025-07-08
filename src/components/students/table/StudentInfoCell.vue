<template>
  <td>
    <div class="student-name">
      <strong>{{ getDisplayValue(student, 'firstName') }} {{ getDisplayValue(student, 'lastName') }}</strong>
      <span class="data-source" :title="`Data source: ${getSourceValue(student, 'firstName')}`">
        {{ getSourceValue(student, 'firstName') === 'Override' ? '🔒' : 
           getSourceValue(student, 'firstName') === 'App' ? '📱' :
           getSourceValue(student, 'firstName') === 'Aeries' ? '📊' :
           getSourceValue(student, 'firstName') === 'SEIS' ? '📋' : '' }}
      </span>
    </div>
    <div class="std-info-subheading">
      <div>Grd: {{ getDisplayValue(student, 'grade') }} | Prg: {{ getDisplayValue(student, 'plan') }}</div>
      <div>CM: {{ getUserName(getCaseManagerId(student)) }}</div>
    </div>
    <div class="student-dates print">
      <span class="badge badge-review" :class="getReviewUrgencyClass(student)">PR: {{ formatDate(getDisplayValue(student, 'reviewDate')) }}</span>
      <span class="badge badge-reeval" :class="getReevalUrgencyClass(student)">RE: {{ formatDate(getDisplayValue(student, 'reevalDate')) }}</span>
      <span class="badge badge-meeting" :class="[getMeetingUrgencyClass(student), getDisplayValue(student, 'meetingDate') ? 'date-set' : '']">
        🗓 {{ formatDate(getDisplayValue(student, 'meetingDate')) || 'Not set' }}
      </span>
    </div>
    
    <!-- Direct Assignment Badge for Paraeducators -->
    <div v-if="currentUser?.role === 'paraeducator' && isDirectAssignment(student.id)" class="direct-assignment-badge">
      <span class="badge badge-direct">Direct Assignment</span>
    </div>
    
    <!-- Flags -->
    <div v-if="hasFlags(student)" class="flag-overlay">
      <div v-if="getFlagValue(student, 'flag1')" class="flag-preferential-seating">Preferential Seating</div>
      <div v-if="getFlagValue(student, 'flag2')" class="flag-separate-setting">Separate Setting</div>
    </div>
  </td>
</template>

<script setup>
import { getDisplayValue, getSourceValue } from '@/utils/studentUtils'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
  // Functions from parent composable
  getUserName: {
    type: Function,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  },
  getMeetingUrgencyClass: {
    type: Function,
    required: true
  },
  getReviewUrgencyClass: {
    type: Function,
    required: true
  },
  getReevalUrgencyClass: {
    type: Function,
    required: true
  },
  getCaseManagerId: {
    type: Function,
    required: true
  },
  getFlagValue: {
    type: Function,
    required: true
  },
  hasFlags: {
    type: Function,
    required: true
  },
  isDirectAssignment: {
    type: Function,
    required: true
  }
})
</script> 