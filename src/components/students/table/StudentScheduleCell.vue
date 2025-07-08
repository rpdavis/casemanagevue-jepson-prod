<template>
  <td>
    <div v-if="getSchedule(student)" class="schedule-list">
      <ul>
        <li v-for="(teacherId, period) in getSchedule(student)" :key="period">
          <span class="service-pill">{{ period }}:</span> {{ getUserInitialLastName(teacherId) }}
        </li>
      </ul>
    </div>
    <div v-else>—</div>
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
  }
})
</script> 