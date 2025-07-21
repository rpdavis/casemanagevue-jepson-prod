// src/composables/useStudentQueries.js
// Role-based database queries for secure student data access

import { ref, computed } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc,
  limit,
  startAfter
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/authStore'

export function useStudentQueries() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref(null)
  const students = ref([])
  const totalCount = ref(0)
  
  // Get current user info
  const currentUser = computed(() => authStore.user)
  const currentRole = computed(() => authStore.user?.role)
  const currentUserId = computed(() => authStore.user?.uid)
  
  // ─── ROLE-BASED DATABASE QUERIES ─────────────────────────────────────────────
  
  // Admin roles - can access all students
  const getAdminStudents = async () => {
    console.log('🔍 Admin query: Loading all students - START')
    console.log('🔍 Admin query: currentUser:', currentUser.value)
    console.log('🔍 Admin query: currentRole:', currentRole.value)
    console.log('🔍 Admin query: currentUserId:', currentUserId.value)
    try {
      const q = query(
        collection(db, 'students'),
        orderBy('app.studentData.lastName', 'asc')
      )
      console.log('🔍 Admin query created:', q)
      const snapshot = await getDocs(q)
      console.log('🔍 Admin query snapshot:', snapshot.size, 'documents')
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('🔍 Admin query result:', students.length, 'students')
      
      if (students.length > 0) {
        console.log('🔍 First student structure:', students[0])
      } else {
        console.log('🔍 Admin query: NO STUDENTS FOUND - checking collection directly')
        // Try a simple query without ordering to see if there are any students at all
        const simpleQuery = query(collection(db, 'students'))
        const simpleSnapshot = await getDocs(simpleQuery)
        console.log('🔍 Simple query found:', simpleSnapshot.size, 'documents')
      }
      return students
    } catch (error) {
      console.error('🔴 Admin query error:', error)
      console.error('🔴 Admin query error details:', error.message, error.code)
      // Try fallback query without ordering
      try {
        console.log('🔍 Trying fallback query without ordering...')
        const fallbackQuery = query(collection(db, 'students'))
        const fallbackSnapshot = await getDocs(fallbackQuery)
        console.log('🔍 Fallback query found:', fallbackSnapshot.size, 'documents')
        const fallbackStudents = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        console.log('🔍 Fallback query returning:', fallbackStudents.length, 'students')
        return fallbackStudents
      } catch (fallbackError) {
        console.error('🔴 Fallback query also failed:', fallbackError)
        console.error('🔴 Fallback query error details:', fallbackError.message, fallbackError.code)
        return []
      }
    }
  }
  
  // Administrator_504_CM role - can view only IEP or 504 plan students
  const getAdmin504Students = async () => {
    console.log('🔍 504 Admin query: Loading only IEP and 504 students')
    try {
      const q = query(
        collection(db, 'students'),
        where('app.studentData.plan', 'in', ['IEP', '504'])
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('🔴 504 Admin query error:', error)
      return []
    }
  }
  
  const getCaseManagerStudents = async (userId) => {
    console.log('🔒 Security: Loading students for case manager using staffIds:', userId)
    
    try {
      // Use staffIds array for database-level security (same as teachers)
      const q = query(
        collection(db, 'students'),
        where('app.staffIds', 'array-contains', userId),
        orderBy('app.studentData.lastName', 'asc')
      )
      const snapshot = await getDocs(q)
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      console.log('🔒 Security: Case manager has access to', students.length, 'students via staffIds')
      console.log('🔒 Security: CM accessible students:', students.map(s => 
        `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`
      ).slice(0, 5))
      
      return students
    } catch (error) {
      console.error('🔒 Security: Error loading case manager students:', error)
      return []
    }
  }
  
  // Teachers use staffIds filter for secure database-level filtering
  const getTeacherStudents = async (userId) => {
    console.log('🔍 Teacher query: Loading students for teacher', userId)
    
    try {
      // Use required staffIds filter for Firestore security rules
      const q = query(
        collection(db, 'students'),
        where('app.staffIds', 'array-contains', userId),
        orderBy('app.studentData.lastName', 'asc')
      )
      
      const snapshot = await getDocs(q)
      console.log('🔍 Teacher query: Found', snapshot.size, 'students with teacher in staffIds')
      
      // Database filtering ensures only authorized students are returned
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
    } catch (error) {
      console.error('🔒 Security: Error loading teacher students:', error)
      return []
    }
  }
  
  // Service Provider query - uses staffIds array for security compliance
  const getServiceProviderStudents = async (userId) => {
    console.log('🔍 Service Provider query: Loading students for provider', userId)
    console.log('🔍 Service Provider query: userId type:', typeof userId)
    console.log('🔍 Service Provider query: userId value:', JSON.stringify(userId))
    
    try {
      // Use staffIds array-contains query (required by Firestore security rules)
      const q = query(
        collection(db, 'students'),
        where('app.staffIds', 'array-contains', userId)
      )
      console.log('🔍 Service Provider query: Executing staffIds query...')
      const snapshot = await getDocs(q)
      console.log('🔍 Service Provider query: Success! Found', snapshot.size, 'students')
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Sort client-side
      students.sort((a, b) => {
        const aName = a.app?.studentData?.lastName || ''
        const bName = b.app?.studentData?.lastName || ''
        return aName.localeCompare(bName)
      })
      
      return students
    } catch (error) {
      console.error('🔴 Service Provider query FAILED:', error)
      console.error('🔴 Error code:', error.code)
      console.error('🔴 Error message:', error.message)
      console.error('🔴 Full error object:', error)
      
      // Check current auth state
      const auth = getAuth()
      console.error('🔴 Current auth state:', {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        customClaims: 'Check in browser dev tools'
      })
      
      // Check if the userId parameter matches the auth uid
      console.error('🔴 Auth mismatch check:', {
        queryUserId: userId,
        authUid: auth.currentUser?.uid,
        match: userId === auth.currentUser?.uid
      })
      
      return []
    }
  }
  
  // Paraeducator query - uses aideSchedules collection for student access
  const getParaeducatorStudents = async (userId) => {
    console.log('🔍 Paraeducator query: Loading students for aide', userId)
    console.log('🔍 Paraeducator query: userId type:', typeof userId)
    console.log('🔍 Paraeducator query: userId value:', JSON.stringify(userId))
    
    try {
      // First, check if aide has staffIds access (preferred method)
      console.log('🔍 Paraeducator query: Trying staffIds approach first...')
      try {
        const staffIdsQuery = query(
          collection(db, 'students'),
          where('app.staffIds', 'array-contains', userId),
          orderBy('app.studentData.lastName', 'asc')
        )
        const staffIdsSnapshot = await getDocs(staffIdsQuery)
        console.log('🔍 Paraeducator query: staffIds approach found', staffIdsSnapshot.size, 'students')
        
        if (staffIdsSnapshot.size > 0) {
          const students = staffIdsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          console.log('🔍 Paraeducator query: SUCCESS with staffIds approach')
          return students
        }
      } catch (staffIdsError) {
        console.log('🔍 Paraeducator query: staffIds approach failed:', staffIdsError.message)
      }
      
      // Fallback: Get aide's assigned students from aideSchedules
      console.log('🔍 Paraeducator query: Using aideSchedules fallback...')
      
      // Get aide schedule document
      const aideDoc = await getDoc(doc(db, 'aideSchedules', userId))
      if (!aideDoc.exists()) {
        console.log('🔍 Paraeducator query: No aide schedule document found for', userId)
        return []
      }
      
      const aideData = aideDoc.data()
      console.log('🔍 Paraeducator query: Found aide data:', aideData)
      
      // Get student IDs from the aide's document
      let studentIds = []
      
      // Primary: Use studentIds array if available
      if (aideData.studentIds && Array.isArray(aideData.studentIds)) {
        studentIds = aideData.studentIds
        console.log('🔍 Paraeducator query: Using studentIds array:', studentIds)
      }
      // Fallback: Use directAssignment if studentIds not available
      else if (aideData.directAssignment) {
        studentIds = Array.isArray(aideData.directAssignment) 
          ? aideData.directAssignment 
          : [aideData.directAssignment]
        console.log('🔍 Paraeducator query: Using directAssignment as fallback:', studentIds)
      }
      
      if (studentIds.length === 0) {
        console.log('🔍 Paraeducator query: No student assignments found for aide', userId)
        return []
      }
      
      // Query students individually to avoid Firestore rule issues
      console.log('🔍 Paraeducator query: Fetching', studentIds.length, 'assigned students individually...')
      const studentPromises = studentIds.map(async (studentId) => {
        try {
          const studentDoc = await getDoc(doc(db, 'students', studentId))
          if (studentDoc.exists()) {
            return { id: studentDoc.id, ...studentDoc.data() }
          }
          return null
        } catch (error) {
          console.warn('🔍 Paraeducator query: Failed to fetch student', studentId, ':', error.message)
          return null
        }
      })
      
      const studentResults = await Promise.all(studentPromises)
      const validStudents = studentResults.filter(student => student !== null)
      
      // Sort by last name
      validStudents.sort((a, b) => {
        const aName = a.app?.studentData?.lastName || ''
        const bName = b.app?.studentData?.lastName || ''
        return aName.localeCompare(bName)
      })
      
      console.log('🔍 Paraeducator query: Successfully fetched', validStudents.length, 'students')
      return validStudents
      
    } catch (error) {
      console.error('🔴 Paraeducator query FAILED:', error)
      console.error('🔴 Error code:', error.code)
      console.error('🔴 Error message:', error.message)
      console.error('🔴 Full error object:', error)
      
      // Check current auth state
      const auth = getAuth()
      console.error('🔴 Current auth state:', {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        customClaims: 'Check in browser dev tools'
      })
      
      // Check if the userId parameter matches the auth uid
      console.error('🔴 Auth mismatch check:', {
        queryUserId: userId,
        authUid: auth.currentUser?.uid,
        match: userId === auth.currentUser?.uid
      })
      
      return []
    }
  }
  
  // Testing view - students with testing flags
  const getTestingStudents = async () => {
    console.log('🔍 Testing query: Loading students with testing flags')
    
    // Query for flag2 (primary field)
    const q1 = query(
      collection(db, 'students'),
      where('app.flags.flag2', '==', true),
      orderBy('app.studentData.lastName', 'asc')
    )
    
    // Query for separateSetting (backward compatibility)
    const q2 = query(
      collection(db, 'students'),
      where('app.flags.separateSetting', '==', true),
      orderBy('app.studentData.lastName', 'asc')
    )
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ])
    
    // Combine results and remove duplicates
    const students1 = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const students2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const combinedStudents = [...students1]
    students2.forEach(student => {
      if (!combinedStudents.find(s => s.id === student.id)) {
        combinedStudents.push(student)
      }
    })
    
    return combinedStudents.sort((a, b) => {
      const lastNameA = a.app?.studentData?.lastName || ''
      const lastNameB = b.app?.studentData?.lastName || ''
      return lastNameA.localeCompare(lastNameB)
    })
  }
  
  // ─── MAIN QUERY FUNCTION ─────────────────────────────────────────────────────
  
  const loadStudents = async (options = {}) => {
    console.log('🔍 loadStudents called - DEBUG AUTH STATE:')
    console.log('  currentUserId.value:', currentUserId.value)
    console.log('  currentRole.value:', currentRole.value)
    console.log('  authStore.user:', authStore.user)
    console.log('  authStore.user?.uid:', authStore.user?.uid)
    console.log('  authStore.user?.role:', authStore.user?.role)
    
    if (!currentUserId.value || !currentRole.value) {
      console.error('🔴 No authenticated user or role - FAILING AUTH CHECK')
      console.error('  currentUserId.value is:', currentUserId.value)
      console.error('  currentRole.value is:', currentRole.value)
      error.value = 'Authentication required'
      return []
    }
    
    loading.value = true
    error.value = null
    
    try {
      let studentData = []
      
      console.log('🔍 ROUTING to query based on role:', currentRole.value)
      console.log('🔍 Available role cases: admin, administrator, sped_chair, administrator_504_CM, case_manager, teacher, service_provider, paraeducator')
      
      // Route to appropriate query based on role
      switch (currentRole.value) {
        case 'admin':
        case 'administrator':
        case 'sped_chair':
          studentData = await getAdminStudents()
          break
        case 'administrator_504_CM':
          studentData = await getAdminStudents()
          break
        case 'case_manager':
          console.log('🔍 CALLING getCaseManagerStudents with userId:', currentUserId.value)
          studentData = await getCaseManagerStudents(currentUserId.value)
          console.log('🔍 getCaseManagerStudents COMPLETED, returned:', studentData.length, 'students')
          break
          
        case 'teacher':
          studentData = await getTeacherStudents(currentUserId.value)
          break
          
        case 'service_provider':
          studentData = await getServiceProviderStudents(currentUserId.value)
          break
          
        case 'paraeducator':
          studentData = await getParaeducatorStudents(currentUserId.value)
          break
          
        default:
          console.error('🔴 Unknown role:', currentRole.value)
          error.value = 'Invalid user role'
          return []
      }
      
      // Apply additional filters if provided
      if (options.testingOnly) {
        studentData = await getTestingStudents()
      }
      
      students.value = studentData
      totalCount.value = studentData.length
      
      console.log(`🟢 Loaded ${studentData.length} students for ${currentRole.value}`)
      return studentData
      
    } catch (err) {
      console.error('🔴 Error loading students:', err)
      error.value = err.message || 'Failed to load students'
      return []
    } finally {
      loading.value = false
    }
  }
  
  // ─── INDIVIDUAL STUDENT ACCESS ───────────────────────────────────────────────
  
  const getStudent = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }
    
    if (!currentUserId.value || !currentRole.value) {
      throw new Error('Authentication required')
    }
    
    loading.value = true
    error.value = null
    
    try {
      const studentDoc = await getDoc(doc(db, 'students', studentId))
      
      if (!studentDoc.exists()) {
        throw new Error('Student not found')
      }
      
      const studentData = { id: studentDoc.id, ...studentDoc.data() }
      
      // Verify user has access to this student
      const hasAccess = await verifyStudentAccess(studentData, currentUserId.value, currentRole.value)
      
      if (!hasAccess) {
        throw new Error('Access denied to this student')
      }
      
      return studentData
      
    } catch (err) {
      console.error('🔴 Error getting student:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // ─── ACCESS VERIFICATION ─────────────────────────────────────────────────────
  
  const verifyStudentAccess = async (student, userId, role) => {
    if (!student || !userId || !role) {
      return false
    }
    
    // Admin roles have full access
    if (['admin', 'administrator', 'administrator_504_CM', 'sped_chair'].includes(role)) {
      return true
    }
    
    // Case manager access
    if (role === 'case_manager') {
      return student.app?.studentData?.caseManagerId === userId
    }
    
    // Teacher access
    if (role === 'teacher') {
      if (!student.app?.schedule?.periods) return false
      
      const periods = student.app.schedule.periods
      const periodValues = Object.values(periods)
      
      // Check simple string format
      if (periodValues.includes(userId)) {
        return true
      }
      
      // Check complex object format
      return periodValues.some(periodData => {
        if (typeof periodData === 'object' && periodData !== null) {
          return periodData.teacherId === userId || 
                 periodData.coTeaching?.caseManagerId === userId
        }
        return false
      })
    }
    
    // Service provider access
    if (role === 'service_provider') {
      // Check providers list
      if (student.app?.providers && Object.values(student.app.providers).includes(userId)) {
        return true
      }
      
      // Check schedule (service providers can also be teachers)
      if (student.app?.schedule?.periods) {
        const periods = student.app.schedule.periods
        const periodValues = Object.values(periods)
        
        // Check simple string format
        if (periodValues.includes(userId)) {
          return true
        }
        
        // Check complex object format
        return periodValues.some(periodData => {
          if (typeof periodData === 'object' && periodData !== null) {
            return periodData.teacherId === userId || 
                   periodData.coTeaching?.caseManagerId === userId
          }
          return false
        })
      }
    }
    
    // Paraeducator access
    if (role === 'paraeducator') {
      // This would need to check aide assignments
      // For now, return false - implement based on aide assignment logic
      return false
    }
    
    return false
  }
  
  // ─── PAGINATION SUPPORT ──────────────────────────────────────────────────────
  
  const loadStudentsPaginated = async (pageSize = 50, lastDoc = null) => {
    if (!currentUserId.value || !currentRole.value) {
      throw new Error('Authentication required')
    }
    
    loading.value = true
    error.value = null
    
    try {
      let q = query(
        collection(db, 'students'),
        orderBy('app.studentData.lastName', 'asc'),
        limit(pageSize)
      )
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }
      
      // Apply role-based filtering
      if (currentRole.value === 'case_manager') {
        q = query(
          collection(db, 'students'),
          where('app.studentData.caseManagerId', '==', currentUserId.value),
          orderBy('app.studentData.lastName', 'asc'),
          limit(pageSize)
        )
        
        if (lastDoc) {
          q = query(q, startAfter(lastDoc))
        }
      }
      
      const snapshot = await getDocs(q)
      const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // For complex roles (teacher, service_provider), we need client-side filtering
      // This is a simplified version - full implementation would need more complex logic
      
      return {
        students: studentData,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      }
      
    } catch (err) {
      console.error('🔴 Error loading paginated students:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    // State
    students: computed(() => students.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    totalCount: computed(() => totalCount.value),
    
    // Methods
    loadStudents,
    getStudent,
    verifyStudentAccess,
    loadStudentsPaginated,
    
    // Role-specific queries (for testing/debugging)
    getAdminStudents,
    getAdmin504Students,
    getCaseManagerStudents,
    getTeacherStudents,
    getServiceProviderStudents,
    getParaeducatorStudents,
    getTestingStudents
  }
}