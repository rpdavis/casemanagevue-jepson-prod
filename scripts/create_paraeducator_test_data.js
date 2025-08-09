import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore'

// Firebase config (same as your main app)
const firebaseConfig = {
  apiKey: "AIzaSyDPqNxhNqzKcBVYTxBVQvSQJJOgULdQWU0",
  authDomain: "casemanagevue-jepson-prod.firebaseapp.com",
  projectId: "casemanagevue-jepson-prod",
  storageBucket: "casemanagevue-jepson-prod.firebasestorage.app",
  messagingSenderId: "1028986648925",
  appId: "1:1028986648925:web:42a3e7f2c5e8d9f7c8e9f0"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function createParaeducatorTestData() {
  const paraeducatorUserId = 'VYEu9zlQo9YSdHPHBwOI7bopm6s2'
  
  try {
    // Get some sample students and teachers to create realistic test data
    console.log('Loading students and users...')
    
    const studentsSnapshot = await getDocs(collection(db, 'students'))
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Find some IEP/504 students
    const iepStudents = students.filter(s => {
      const plan = s.app?.studentData?.plan || s.plan
      return plan === 'IEP' || plan === '504'
    }).slice(0, 5) // Take first 5 IEP/504 students
    
    // Find some teachers
    const teachers = users.filter(u => u.role === 'teacher').slice(0, 3) // Take first 3 teachers
    
    console.log(`Found ${iepStudents.length} IEP/504 students and ${teachers.length} teachers`)
    
    // Create aide schedule document
    const aideScheduleData = {
      // Direct assignments - assign paraeducator directly to 2 students
      directAssignment: iepStudents.slice(0, 2).map(s => s.id),
      
      // Class assignments - assign paraeducator to help specific teachers in specific periods
      classAssignment: {
        "1": teachers.length > 0 ? [teachers[0].id] : [], // Period 1 - Teacher 1
        "2": teachers.length > 1 ? [teachers[1].id] : [], // Period 2 - Teacher 2
        "3": teachers.length > 2 ? [teachers[2].id] : [], // Period 3 - Teacher 3
      },
      
      // Optional: Add schedule info (not used for student access but might be useful)
      schedule: {
        "1": teachers.length > 0 ? [teachers[0].id] : [],
        "2": teachers.length > 1 ? [teachers[1].id] : [],
        "3": teachers.length > 2 ? [teachers[2].id] : [],
      },
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system_test_script'
    }
    
    console.log('Creating aide schedule document...')
    console.log('Direct assignments:', aideScheduleData.directAssignment)
    console.log('Class assignments:', aideScheduleData.classAssignment)
    
    await setDoc(doc(db, 'aideSchedules', paraeducatorUserId), aideScheduleData)
    
    console.log('✅ Successfully created aide schedule for paraeducator:', paraeducatorUserId)
    console.log('The paraeducator should now have access to:')
    console.log('- Direct assignments:', aideScheduleData.directAssignment.length, 'students')
    console.log('- Class assignments: Students with IEP/504 in periods 1, 2, 3 with assigned teachers')
    
    // Log some sample students that should be accessible
    const sampleAccessibleStudents = iepStudents.filter(student => {
      const schedule = student.app?.schedule?.periods || student.schedule || {}
      return Object.entries(schedule).some(([period, data]) => {
        let teacherId
        if (typeof data === 'string') {
          teacherId = data
        } else if (data && typeof data === 'object') {
          teacherId = data.teacherId
        }
        
        const aideTeacherIds = aideScheduleData.classAssignment[period]
        if (aideTeacherIds && teacherId) {
          return aideTeacherIds.includes(teacherId)
        }
        return false
      })
    })
    
    console.log('Sample accessible students via class assignments:')
    sampleAccessibleStudents.forEach(student => {
      const name = `${student.app?.studentData?.firstName || student.firstName} ${student.app?.studentData?.lastName || student.lastName}`
      console.log(`- ${name} (${student.id})`)
    })
    
  } catch (error) {
    console.error('Error creating paraeducator test data:', error)
  }
}

// Run the script
createParaeducatorTestData() 