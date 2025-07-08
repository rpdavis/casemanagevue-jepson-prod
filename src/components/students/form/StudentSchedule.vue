<template>
  <fieldset class="form-col">
    <legend>Schedule</legend>
    <div class="inner-grid-3">
      <template v-for="p in periods" :key="p">
        <label>{{ p }}:
          <select v-model="form.schedule[p]" class="sched">
            <option value="">--</option>
            <option v-for="t in userRoles.teachers" :key="t.id" :value="t.id">
              {{ t.name || t.email || t.id }}
            </option>
          </select>
        </label>
      </template>
    </div>
  </fieldset>
</template>
<script setup>
const props = defineProps({ form: Object, periods: Array, userRoles: Object })
</script> 