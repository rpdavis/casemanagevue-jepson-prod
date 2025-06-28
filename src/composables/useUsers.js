// /Users/rd/CaseManageVue/src/composables/useUsers.js

import { ref, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function useUsers() {
  const users = ref({})
  const userList = ref([])

  async function fetchUsers() {
    const userSnap = await getDocs(collection(db, 'users'))
    const userMap = {}
    const allUsers = []
    userSnap.forEach(doc => {
      const data = doc.data()
      userMap[doc.id] = data
      allUsers.push({ id: doc.id, ...data })
    })
    users.value = userMap
    userList.value = allUsers
  }

  const userRoles = computed(() => {
    return {
      teachers: userList.value.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role)),
      caseManagers: userList.value.filter(u => ["case_manager", "sped_chair", "administrator_504_CM"].includes(u.role)),
      speech: userList.value.filter(u => /speech|slp/i.test(u.title || "")),
      ot: userList.value.filter(u => /ot|occupational/i.test(u.title || "")),
      mh: userList.value.filter(u => /mental|counselor|therapist/i.test(u.title || ""))
    }
  })

  const caseManagers = computed(() => {
    return userList.value.filter(u => ["case_manager", "sped_chair", "administrator_504_CM"].includes(u.role))
  })

  const teacherList = computed(() => {
    return userList.value.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role))
  })

  return { 
    users, 
    fetchUsers, 
    caseManagers, 
    teacherList,
    userRoles
  }
}