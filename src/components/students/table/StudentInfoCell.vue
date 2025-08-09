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
      <div class="case-manager-line">
        CM: {{ getUserName(getCaseManagerId(student)) }}
        <span v-if="getCustomFlags(student).length" class="custom-flags">
          <span
            v-for="(list, color) in groupByColor(getCustomFlags(student))"
            v-if="list.length"
            :key="color"
            class="flag-chip"
            :class="color"
            :title="tooltipFor(list)"
            @click="showFlagsDialog(list, color)"
          >
            <span class="flag-dot"></span>{{ list.length }}
          </span>
        </span>
      </div>
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

// Custom flags functions
const getCustomFlags = (student) => student.app?.flags?.customFlags || []

const groupByColor = (flags) => ({
  blue: flags.filter(f => f.color === 'blue'),
  yellow: flags.filter(f => f.color === 'yellow'),
  red: flags.filter(f => f.color === 'red')
})

const tooltipFor = (items) => items.map(f => `• ${f.text}`).join('\n')

const showFlagsDialog = (list, color) => {
  // Optional: Show a dialog with the flags for better accessibility
  const flagsText = list.map(f => `• ${f.text}`).join('\n')
  alert(`${color.toUpperCase()} FLAGS:\n\n${flagsText}`)
}
</script>

<style scoped>
.case-manager-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-flags {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.flag-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.flag-chip:hover {
  opacity: 0.8;
}

.flag-chip.blue {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.flag-chip.yellow {
  background: #fff8e1;
  color: #f57f17;
  border: 1px solid #ffecb3;
}

.flag-chip.red {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.flag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.flag-chip.blue .flag-dot {
  background: #1976d2;
}

.flag-chip.yellow .flag-dot {
  background: #f57f17;
}

.flag-chip.red .flag-dot {
  background: #d32f2f;
}
</style> 