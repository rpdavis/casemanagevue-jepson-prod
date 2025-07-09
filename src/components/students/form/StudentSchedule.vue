<template>
  <fieldset class="form-col">
    <legend>Schedule</legend>
    <div class="inner-grid-3">
      <template v-for="period in periods" :key="period">
        <label>
          {{ period }}:
          <select v-model="form.schedule[period]" class="sched">
            <option value="">--</option>
            <option v-for="teacher in userRoles.teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name || teacher.email || teacher.id }}
            </option>
          </select>
        </label>
      </template>
    </div>
  </fieldset>
</template>

<script setup>
// Props
const props = defineProps({
  form: { type: Object, required: true },
  periods: { type: Array, required: true },
  userRoles: { type: Object, required: true }
})

// No local state needed - all data flows through props
</script>

<style scoped>
.sched {
  width: 100%;
}
</style> 