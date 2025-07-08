<template>
  <td class="instruction-cell" :class="{ 'with-flag': getFlagValue(student, 'flag2') }">
    <div v-if="getFlagValue(student, 'flag2')" class="flag-overlay flag-separate-setting">Separate setting</div>
    <div v-if="student && formatListFromText(getDisplayValue(student, 'assessment')) !== '<div>—</div>'" class="bullet-list">
      <div v-html="formatListFromText(getDisplayValue(student, 'assessment'))"></div>
    </div>
    <div v-else>—</div>
  </td>
</template>

<script setup>
import { getDisplayValue } from '@/utils/studentUtils'
const props = defineProps({
  student: { type: Object, required: true },
  getFlagValue: { type: Function, required: true },
  formatListFromText: { type: Function, required: true }
})
</script> 