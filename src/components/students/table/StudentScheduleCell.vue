<template>
  <td>
    <div v-if="getSchedule(student)" class="schedule-list">
      <ul>
        <li v-for="(periodData, period) in getSchedule(student)" :key="period" class="schedule-period">
          <div class="period-assignment">
            <div class="primary-line">
              <span class="period-label">{{ getPeriodLabel ? getPeriodLabel(period) : period }}:</span>
              <span class="primary-teacher">{{ getUserInitialLastName(periodData.teacherId || periodData) }}</span>
            </div>
            <div v-if="isCoTeaching(periodData)" class="coteaching-info">
              <span 
                class="coteaching-indicator"
                :title="`Co-teach ${periodData.coTeaching.subject}`"
              >
                {{ getUserInitialLastName(periodData.coTeaching.caseManagerId) }} (C{{ periodData.coTeaching.subject.charAt(0) }})
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div v-else class="no-schedule">—</div>
  </td>
</template>

<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  getSchedule: {
    type: Function,
    required: true
  },
  getUserInitialLastName: {
    type: Function,
    required: true
  },
  getPeriodLabel: {
    type: Function,
    required: false
  }
})

// Helper function to check if a period has co-teaching data
const isCoTeaching = (periodData) => {
  return periodData && typeof periodData === 'object' && periodData.coTeaching && periodData.teacherId
}
</script> 