// /Users/rd/CaseManageVue/src/composables/useUsers.js

import { ref, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function useUsers() {
  const users = ref({})
  const userList = ref([])

  async function fetchUsers() {
    console.log('🔍 USERS DEBUG: Starting fetchUsers()')
    try {
      const userSnap = await getDocs(collection(db, 'users'))
      console.log('🔍 USERS DEBUG: Retrieved', userSnap.size, 'users from database')
      
      const userMap = {}
      const allUsers = []
      userSnap.forEach(doc => {
        const data = doc.data()
        userMap[doc.id] = { id: doc.id, ...data }  // Add id to the user data
        allUsers.push({ id: doc.id, ...data })
      })
      
      users.value = userMap
      userList.value = allUsers
      
      console.log('🔍 USERS DEBUG: Processed users by role:')
      const roleCount = {}
      allUsers.forEach(user => {
        roleCount[user.role] = (roleCount[user.role] || 0) + 1
      })
      console.log('🔍 USERS DEBUG: Role counts:', roleCount)
      
      console.log('🔍 USERS DEBUG: All users list:', allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role
      })))
      
      console.log('🔍 USERS DEBUG: fetchUsers() completed successfully')
    } catch (error) {
      console.error('🔴 USERS DEBUG: Error in fetchUsers():', error)
      throw error
    }
  }

  const userRoles = computed(() => {
    const sortByName = (users) => users.sort((a, b) => (a.name || a.email || a.id).localeCompare(b.name || b.email || b.id))
    
    return {
      teachers: sortByName(userList.value.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role))),
      caseManagers: sortByName(userList.value.filter(u => ["case_manager", "sped_chair", "admin_504"].includes(u.role))),
      speech: sortByName(userList.value.filter(u => u.provider === 'SLP')),
      ot: sortByName(userList.value.filter(u => u.provider === 'OT')),
      mh: sortByName(userList.value.filter(u => u.provider === 'MH')),
      pt: sortByName(userList.value.filter(u => u.provider === 'PT')),
      sc: sortByName(userList.value.filter(u => u.provider === 'SC')),
      tr: sortByName(userList.value.filter(u => u.provider === 'TR')),
      aud: sortByName(userList.value.filter(u => u.provider === 'AUD')),
      vi: sortByName(userList.value.filter(u => u.provider === 'VI')),
      at: sortByName(userList.value.filter(u => u.provider === 'AT')),
      dhh: sortByName(userList.value.filter(u => u.provider === 'DHH')),
      om: sortByName(userList.value.filter(u => u.provider === 'O&M')),
      bis: sortByName(userList.value.filter(u => u.provider === 'BIS')),
      hn: sortByName(userList.value.filter(u => u.provider === 'HN')),
      sw: sortByName(userList.value.filter(u => u.provider === 'SW'))
    }
  })

  const caseManagers = computed(() => {
    return userList.value.filter(u => ["case_manager", "sped_chair", "admin_504"].includes(u.role))
      .sort((a, b) => (a.name || a.email || a.id).localeCompare(b.name || b.email || b.id))
  })

  const teacherList = computed(() => {
    return userList.value.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role))
      .sort((a, b) => (a.name || a.email || a.id).localeCompare(b.name || b.email || b.id))
  })

  return { 
    users, 
    userList,
    fetchUsers, 
    caseManagers, 
    teacherList,
    userRoles
  }
}