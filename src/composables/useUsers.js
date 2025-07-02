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
      speech: userList.value.filter(u => u.provider === 'SLP'),
      ot: userList.value.filter(u => u.provider === 'OT'),
      mh: userList.value.filter(u => u.provider === 'MH'),
      pt: userList.value.filter(u => u.provider === 'PT'),
      sc: userList.value.filter(u => u.provider === 'SC'),
      tr: userList.value.filter(u => u.provider === 'TR'),
      aud: userList.value.filter(u => u.provider === 'AUD'),
      vi: userList.value.filter(u => u.provider === 'VI'),
      at: userList.value.filter(u => u.provider === 'AT'),
      dhh: userList.value.filter(u => u.provider === 'DHH'),
      om: userList.value.filter(u => u.provider === 'O&M'),
      bis: userList.value.filter(u => u.provider === 'BIS'),
      hn: userList.value.filter(u => u.provider === 'HN'),
      sw: userList.value.filter(u => u.provider === 'SW')
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