import { collection, query, where, getDocs, orderBy, getDoc, doc, documentId } from 'firebase/firestore'
import { db } from '@/firebase'
import { initDebugSummary, setDatabaseStudents } from '@/utils/debugSummary'

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
   * Get students for case manager - students they case manage AND/OR teach
   */
  const getCaseManagerStudents = async (userId) => {
    console.log('🔒 Security: Loading students for case manager:', userId)
    
    try {
      // Get students where user is the case manager
      const q = query(
        collection(db, 'students'),
        where('app.studentData.caseManagerId', '==', userId),
        orderBy('app.studentData.lastName', 'asc')
      )
      const cmSnapshot = await getDocs(q)
      const cmStudents = cmSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      console.log('🔒 Security: Case manager manages', cmStudents.length, 'students')
      console.log('🔒 Security: CM student names:', cmStudents.map(s => 
        `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`
      ).slice(0, 5))
      
      // Also get students where user is a teacher (same logic as getTeacherStudents)
      const allStudentsQuery = query(collection(db, 'students'))
      const allSnapshot = await getDocs(allStudentsQuery)
      
      const teacherStudents = []
      allSnapshot.docs.forEach(doc => {
        const student = { id: doc.id, ...doc.data() }
        
        // Use same logic as getSchedule() to find schedule data
        const schedule = student.schedule || 
                        student.app?.schedule?.periods || 
                        student.aeries?.schedule?.periods || 
                        student.aeries?.schedule || 
                        {}
        
        let isTeacher = false
        
        // Check each period
        Object.entries(schedule).forEach(([period, data]) => {
          // Handle both string and object formats
          if (typeof data === 'string' && data === userId) {
            isTeacher = true
          } else if (typeof data === 'object') {
            // Check primary teacher
            if (data.teacherId === userId) {
              isTeacher = true
            }
            // Check co-teacher
            if (data.coTeaching?.caseManagerId === userId) {
              isTeacher = true
            }
          }
        })
        
        // Only add if they teach this student AND don't already case manage them
        if (isTeacher && !cmStudents.find(s => s.id === student.id)) {
          teacherStudents.push(student)
        }
      })
      
      console.log('🔒 Security: Case manager teaches', teacherStudents.length, 'additional students')
      console.log('🔒 Security: Teaching student names:', teacherStudents.map(s => 
        `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`
      ).slice(0, 5))
      
      // Combine both lists
      const allStudents = [...cmStudents, ...teacherStudents]
      
      console.log('🔒 Security: Total students for case manager:', allStudents.length)
      
      // Track in debug summary
      setDatabaseStudents(allStudents.length, {
        caseManaging: cmStudents.length,
        teaching: teacherStudents.length
      })
      
      // Sort combined list
      return allStudents.sort((a, b) => {
        const aName = `${a.app?.studentData?.lastName || ''}, ${a.app?.studentData?.firstName || ''}`
        const bName = `${b.app?.studentData?.lastName || ''}, ${b.app?.studentData?.firstName || ''}`
        return aName.localeCompare(bName)
      })
      
    } catch (error) {
      console.error('🔒 Security: Query failed:', error)
      throw error
    }
  }

  /**
   * Get students for teacher - only students they teach
   * Note: This requires a composite query since we need to check if userId exists in schedule.periods object values
   */
  const getTeacherStudents = async (userId) => {
    console.log('🔒 Security: Loading students for teacher:', userId)
    
    try {
      // Get all students where user is a teacher in any period
      // We need to check both string format and object format schedules
      const allStudentsQuery = query(collection(db, 'students'))
      const snapshot = await getDocs(allStudentsQuery)
      const students = []
      
      snapshot.docs.forEach(doc => {
        const student = { id: doc.id, ...doc.data() }
        
        // Use same logic as getSchedule() to find schedule data
        const schedule = student.schedule || 
                        student.app?.schedule?.periods || 
                        student.aeries?.schedule?.periods || 
                        student.aeries?.schedule || 
                        {}
        
        let isTeacher = false
        
        // Check each period
        Object.entries(schedule).forEach(([period, data]) => {
          // Handle both string and object formats
          if (typeof data === 'string' && data === userId) {
            isTeacher = true
          } else if (typeof data === 'object') {
            // Check primary teacher
            if (data.teacherId === userId) {
              isTeacher = true
            }
            // Check co-teacher
            if (data.coTeaching?.caseManagerId === userId) {
              isTeacher = true
            }
          }
        })
        
        if (isTeacher) {
          students.push(student)
        }
      })
    
      console.log('🔒 Security: Teacher has access to', students.length, 'students')
      return students.sort((a, b) => {
        const aName = `${a.app?.studentData?.lastName || ''}, ${a.app?.studentData?.firstName || ''}`
        const bName = `${b.app?.studentData?.lastName || ''}, ${b.app?.studentData?.firstName || ''}`
        return aName.localeCompare(bName)
      })

    } catch (error) {
      console.error('🔒 Security: Error loading teacher students:', error)
      return []
    }
  }

  /**
   * Get students for service provider - only students they provide services to
   */
  const getServiceProviderStudents = async (userId) => {
    console.log('🔒 Security: Loading students for service provider:', userId)
    
    try {
      // Get students where user is a service provider
      const providerQuery = query(
      collection(db, 'students'),
        where('app.providers', 'array-contains', userId)
    )
      
      const providerSnapshot = await getDocs(providerQuery)
      const students = providerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
      // Get students where user is a teacher (primary or co-teacher)
      const teacherStudents = await getTeacherStudents(userId)
      
      // Combine and deduplicate
      teacherStudents.forEach(student => {
        if (!students.find(s => s.id === student.id)) {
          students.push(student)
        }
      })

      console.log('🔒 Security: Service provider has access to', students.length, 'students')
      return students.sort((a, b) => {
        const aName = `${a.app?.studentData?.lastName || ''}, ${a.app?.studentData?.firstName || ''}`
        const bName = `${b.app?.studentData?.lastName || ''}, ${b.app?.studentData?.firstName || ''}`
        return aName.localeCompare(bName)
      })

    } catch (error) {
      console.error('🔒 Security: Error loading service provider students:', error)
      return []
    }
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

  /**
   * Get testing students for role-based access
   * Returns only students with flag2 (separate testing setting) = true
   * with minimal data needed for testing view
   */
  const getTestingStudents = async (user) => {
    console.log('🔒 Security: Loading testing students for user:', user.uid, 'role:', user.role)
    
    try {
      // Get role-based students first
      const roleBasedStudents = await getStudentsByRole(user)
      
      // Filter for students with testing flag enabled (flag2 = separateSetting)
      const testingStudents = roleBasedStudents.filter(student => {
        return student.app?.flags?.flag2 || student.flag2 || false
      })
      
      // Return minimal data for testing view
      const minimalTestingData = testingStudents.map(student => ({
        id: student.id,
        app: {
          studentData: {
            firstName: student.app?.studentData?.firstName || '',
            lastName: student.app?.studentData?.lastName || '',
            grade: student.app?.studentData?.grade || '',
            studentId: student.app?.studentData?.studentId || '',
            plan: student.app?.studentData?.plan || ''
          },
          flags: {
            flag2: student.app?.flags?.flag2 || student.flag2 || false, // separateSetting
            separateSetting: student.app?.flags?.flag2 || student.flag2 || false // alias for clarity
          },
          accommodations: student.app?.accommodations || {},
          schedule: student.app?.schedule || {},
          providers: student.app?.providers || {}
        }
      }))
      
      console.log('🔒 Security: User has access to', minimalTestingData.length, 'testing students')
      return minimalTestingData
      
    } catch (error) {
      console.error('🔒 Security: Error loading testing students:', error)
      return []
    }
  }



  return {
    getStudentsByRole,
    getTestingStudents
  }
} 