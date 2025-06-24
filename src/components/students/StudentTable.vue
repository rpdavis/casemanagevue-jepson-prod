<template>
  <table>
    <thead>
      <tr>
        <th>Info</th>
        <th>Services</th>
        <th>Schedule</th>
        <th>Instruction</th>
        <th>Assessment</th>
        <th>Docs</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="student in students" :key="student.id">
        <!-- Info Cell -->
        <td>
          <div class="student-name"><strong>{{ student.first_name }} {{ student.last_name }}</strong></div>
          <div class="std-info-subheading">
            <div>Grd: {{ student.grade }} | Prg: {{ student.plan }}</div>
            <div>CM: {{ userMap[student.casemanager_id]?.initials || '—' }}</div>
          </div>
        </td>
        <!-- Services Cell -->
        <td>
            <!-- Service logic here -->
        </td>
        <!-- Schedule Cell -->
        <td>
            <ul>
                <li v-for="(teacherId, period) in student.schedule" :key="period">
                    {{ period }}: {{ userMap[teacherId]?.initials || teacherId }}
                </li>
            </ul>
        </td>
        <!-- Instruction Cell -->
        <td v-html="formatListFromText(student.instruction)"></td>
        <!-- Assessment Cell -->
        <td v-html="formatListFromText(student.assessment)"></td>
        <!-- Docs Cell -->
        <td>
            <a v-if="student.ataglance_pdf_url" :href="student.ataglance_pdf_url" target="_blank">At-A-Glance</a>
            <a v-if="student.bip_pdf_url" :href="student.bip_pdf_url" target="_blank">BIP</a>
        </td>
        <!-- Actions Cell -->
        <td>
          <button @click="$emit('edit', student.id)">✏️</button>
          <button @click="$emit('email', student.id)">✉️</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { formatListFromText } from '../../utils/studentUtils'

defineProps({
  students: Array,
  userMap: Object,
  currentUser: Object
})

defineEmits(['edit', 'email'])
</script>