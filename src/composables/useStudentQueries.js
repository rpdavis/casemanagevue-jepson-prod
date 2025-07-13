import { collection, query, where, getDocs, orderBy, getDoc, doc, documentId } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Role-based student queries for database-level security filtering
 * This ensures users only download student data they have legitimate access to
 */
export function useStudentQueries() {

  /**
   * Get students for admin users - can see all students
   */
  const getAdminStudents = async () => {
    console.log('🔒 Security: Loading ALL students for admin user')
    const q = query(
      collection(db, 'students'),
      orderBy('app.studentData.lastName', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  /**
   * Get students for case manager - only their assigned students
   */
  const getCaseManagerStudents = async (userId) => {
    console.log('🔒 Security: Loading students for case manager:', userId)
    
    try {
      // DEBUG: First, let's see what case manager IDs are actually in the database
      console.log('🔒 Security: DEBUG - Checking all case manager IDs in database...')
      const allStudentsQuery = query(collection(db, 'students'))
      const allSnapshot = await getDocs(allStudentsQuery)
      const allStudents = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const caseManagerIds = allStudents.map(s => s.app?.studentData?.caseManagerId).filter(Boolean)
      console.log('🔒 Security: DEBUG - Found case manager IDs:', [...new Set(caseManagerIds)])
      console.log('🔒 Security: DEBUG - Looking for userId:', userId)
      
      // Now try the actual query with orderBy (index is now deployed)
      const q = query(
        collection(db, 'students'),
        where('app.studentData.caseManagerId', '==', userId),
        orderBy('app.studentData.lastName', 'asc')
      )
      const snapshot = await getDocs(q)
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('🔒 Security: Case manager has access to', students.length, 'students')
      
      // Debug: Log the first student to see structure
      if (students.length > 0) {
        console.log('🔒 Security: DEBUG - First student structure:', students[0])
      }
      
      return students
    } catch (error) {
      console.error('🔒 Security: Query failed:', error)
      console.error('🔒 Security: Query details:', {
        collection: 'students',
        where: 'app.studentData.caseManagerId',
        operator: '==',
        value: userId
      })
      throw error
    }
  }

  /**
   * Get students for teacher - only students they teach
   * Note: This requires a composite query since we need to check if userId exists in schedule.periods object values
   */
  const getTeacherStudents = async (userId) => {
    console.log('🔒 Security: Loading students for teacher:', userId)
    
    // Unfortunately, Firestore doesn't support querying object values directly
    // We need to restructure the schedule data or use a different approach
    // For now, we'll load all students and filter (this will be improved in phase 2)
    const q = query(
      collection(db, 'students'),
      orderBy('app.studentData.lastName', 'asc')
    )
    const snapshot = await getDocs(q)
    const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Filter students where teacher is in schedule
    const teacherStudents = allStudents.filter(student => {
      const schedule = student.app?.schedule?.periods || {}
      return Object.values(schedule).includes(userId)
    })
    
    console.log('🔒 Security: Teacher has access to', teacherStudents.length, 'students out of', allStudents.length, 'total')
    return teacherStudents
  }

  /**
   * Get students for service provider - only students they provide services to
   */
  const getServiceProviderStudents = async (userId) => {
    console.log('🔒 Security: Loading students for service provider:', userId)
    
    // Similar to teacher, we need to filter by provider assignments
    const q = query(
      collection(db, 'students'),
      orderBy('app.studentData.lastName', 'asc')
    )
    const snapshot = await getDocs(q)
    const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Filter students where service provider is assigned
    const providerStudents = allStudents.filter(student => {
      const providers = student.app?.providers || {}
      const schedule = student.app?.schedule?.periods || {}
      
      // Check if user is in providers OR in schedule (service providers can also teach)
      const isProvider = Object.values(providers).includes(userId)
      const isTeacher = Object.values(schedule).includes(userId)
      
      return isProvider || isTeacher
    })
    
    console.log('🔒 Security: Service provider has access to', providerStudents.length, 'students out of', allStudents.length, 'total')
    return providerStudents
  }

  /**
   * Get students for paraeducator - only students they're assigned to assist
   */
  const getParaeducatorStudents = async (userId) => {
    console.log('🔒 Security: Loading students for paraeducator:', userId)
    
    try {
      // Get aide assignment data for this paraeducator
      const aideDoc = await getDoc(doc(db, 'aideSchedules', userId))
      if (!aideDoc.exists()) {
        console.log('🔒 Security: No aide schedule found for:', userId)
        return []
      }

      const aideData = aideDoc.data()
      const accessibleStudentIds = new Set()

      // 1. Add direct assignments
      if (aideData.directAssignment) {
        const directIds = Array.isArray(aideData.directAssignment) 
          ? aideData.directAssignment 
          : [aideData.directAssignment]
        directIds.forEach(id => accessibleStudentIds.add(id))
      }

      // 2. For class assignments, we need to get all students with IEP/504 
      // who are taught by teachers the aide is assigned to
      if (aideData.classAssignment) {
        // Get all students first (paraeducators can access all for filtering)
        const allStudentsQuery = query(collection(db, 'students'))
        const allStudentsSnapshot = await getDocs(allStudentsQuery)
        
        allStudentsSnapshot.docs.forEach(doc => {
          const student = { id: doc.id, ...doc.data() }
          
          // Only include students with IEP or 504 plans
          const plan = student.app?.studentData?.plan || student.plan
          if (plan !== 'IEP' && plan !== '504') return

          // Check if student is in any class where this aide is assigned
          const schedule = student.app?.schedule?.periods || student.schedule || {}
          
          Object.entries(schedule).forEach(([period, data]) => {
            // Extract teacherId from both simple and complex schedule structures
            let teacherId
            if (typeof data === 'string') {
              teacherId = data
            } else if (data && typeof data === 'object') {
              teacherId = data.teacherId
            } else {
              return
            }

            // Check if aide is assigned to this teacher in this period
            const aideTeacherIds = aideData.classAssignment[period]
            if (aideTeacherIds) {
              const teacherIdArray = Array.isArray(aideTeacherIds) ? aideTeacherIds : [aideTeacherIds]
              if (teacherIdArray.includes(teacherId)) {
                accessibleStudentIds.add(student.id)
              }
            }
          })
        })
      }

      // Convert Set to Array and fetch the specific students
      const studentIds = Array.from(accessibleStudentIds)
      if (studentIds.length === 0) {
        console.log('🔒 Security: No students found for paraeducator:', userId)
        return []
      }

      // Fetch students by ID (in batches if needed due to Firestore limitations)
      const students = []
      const batchSize = 10 // Firestore 'in' query limit
      
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize)
        const batchQuery = query(
          collection(db, 'students'),
          where(documentId(), 'in', batch)
        )
        const batchSnapshot = await getDocs(batchQuery)
        batchSnapshot.docs.forEach(doc => {
          students.push({ id: doc.id, ...doc.data() })
        })
      }

      console.log('🔒 Security: Paraeducator has access to', students.length, 'students')
      return students

    } catch (error) {
      console.error('🔒 Security: Error loading paraeducator students:', error)
      return []
    }
  }

  /**
   * Main function to get students based on user role
   */
  const getStudentsByRole = async (user) => {
    if (!user || !user.role) {
      console.log('🔒 Security: No user or role provided - returning empty array')
      return []
    }

    const { role, uid } = user

    try {
      switch (role) {
        case 'admin':
        case 'administrator':
        case 'administrator_504_CM':
        case 'sped_chair':
          return await getAdminStudents()

        case 'case_manager':
          return await getCaseManagerStudents(uid)

        case 'teacher':
          return await getTeacherStudents(uid)

        case 'service_provider':
          return await getServiceProviderStudents(uid)

        case 'paraeducator':
          return await getParaeducatorStudents(uid)

        default:
          console.log('🔒 Security: Unknown role:', role, '- returning empty array')
          return []
      }
    } catch (error) {
      console.error('🔒 Security: Error loading students for role:', role, error)
      return []
    }
  }

  return {
    getStudentsByRole,
    getAdminStudents,
    getCaseManagerStudents,
    getTeacherStudents,
    getServiceProviderStudents,
    getParaeducatorStudents
  }
} 