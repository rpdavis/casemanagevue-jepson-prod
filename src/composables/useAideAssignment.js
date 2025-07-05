// useAideAssignment.js
// Composable for managing aide assignments (class/student assignment), not visual scheduling.
import { ref, computed } from 'vue'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export default function useAideAssignment() {
  const aideAssignment = ref({}) // { [aideId]: { classAssignment: {...}, directAssignment: [...] } }
  const loading = ref(false)

  // Load all aide assignments from aideSchedules collection
  async function loadAideAssignments() {
    loading.value = true
    try {
      const querySnapshot = await getDocs(collection(db, 'aideSchedules'))
      const result = {}
      querySnapshot.forEach(docSnap => {
        result[docSnap.id] = docSnap.data()
      })
      aideAssignment.value = result
    } catch (error) {
      console.error('Error loading aide assignments:', error)
      aideAssignment.value = {}
    } finally {
      loading.value = false
    }
  }

  // Load a single aide's assignment
  async function loadAideAssignment(aideId) {
    if (!aideId) {
      console.warn('loadAideAssignment called without aideId')
      return
    }
    
    loading.value = true
    try {
      const docSnap = await getDoc(doc(db, 'aideSchedules', aideId))
      if (docSnap.exists()) {
        aideAssignment.value[aideId] = docSnap.data()
      } else {
        aideAssignment.value[aideId] = { classAssignment: {}, directAssignment: [] }
      }
    } catch (error) {
      console.error('Error loading aide assignment:', error)
      aideAssignment.value[aideId] = { classAssignment: {}, directAssignment: [] }
    } finally {
      loading.value = false
    }
  }

  // Save a single aide's assignment
  async function saveAideAssignment(aideId, data) {
    try {
      const serializableData = JSON.parse(JSON.stringify(data))
      await setDoc(doc(db, 'aideSchedules', aideId), serializableData, { merge: true })
      aideAssignment.value[aideId] = serializableData
    } catch (error) {
      console.error('Error saving aide assignment:', error)
      throw error
    }
  }

  // Save all aide assignments (batch update)
  async function saveAllAideAssignments() {
    try {
      const entries = Object.entries(aideAssignment.value)
      for (const [aideId, data] of entries) {
        const serializableData = JSON.parse(JSON.stringify(data))
        await setDoc(doc(db, 'aideSchedules', aideId), serializableData, { merge: true })
      }
    } catch (error) {
      console.error('Error saving all aide assignments:', error)
      throw error
    }
  }

  // Utility: get aides for a teacher/period, direct assignments, etc.
  function getAidesForTeacher(teacherId, period) {
    const aides = []
    Object.entries(aideAssignment.value).forEach(([aideId, aideData]) => {
      if (aideData.classAssignment && aideData.classAssignment[period]) {
        const teacherIds = Array.isArray(aideData.classAssignment[period]) 
          ? aideData.classAssignment[period] 
          : [aideData.classAssignment[period]]
        if (teacherIds.includes(teacherId)) {
          aides.push(aideId)
        }
      }
    })
    return aides
  }

  function getDirectStudentForAide(aideId) {
    const directAssignment = aideAssignment.value[aideId]?.directAssignment
    if (Array.isArray(directAssignment)) {
      return directAssignment.length > 0 ? directAssignment[0] : null
    }
    return directAssignment || null
  }

  function getAideForStudent(studentId) {
    const aideId = Object.keys(aideAssignment.value).find(aideId => {
      const directAssignment = aideAssignment.value[aideId]?.directAssignment
      if (Array.isArray(directAssignment)) {
        return directAssignment.includes(studentId)
      }
      return directAssignment === studentId
    })
    return aideId || null
  }

  function getStudentsForAide(aideId, students, userMap) {
    const aideStudents = []
    const aideData = aideAssignment.value[aideId]
    if (!aideData) return aideStudents
    // Add directly assigned students
    const directStudentIds = Array.isArray(aideData.directAssignment) 
      ? aideData.directAssignment 
      : (aideData.directAssignment ? [aideData.directAssignment] : [])
    directStudentIds.forEach(studentId => {
      if (studentId) {
        const directStudent = students.find(s => s.id === studentId)
        if (directStudent) {
          aideStudents.push({ ...directStudent, assignmentType: 'direct' })
        }
      }
    })
    // Add students from classes where aide is assigned
    Object.entries(aideData.classAssignment || {}).forEach(([period, teacherIds]) => {
      if (teacherIds) {
        const teacherIdArray = Array.isArray(teacherIds) ? teacherIds : [teacherIds]
        teacherIdArray.forEach(teacherId => {
          if (teacherId) {
            students.forEach(student => {
              if (student.schedule && student.schedule[period] === teacherId) {
                const existingIndex = aideStudents.findIndex(s => s.id === student.id)
                if (existingIndex === -1) {
                  aideStudents.push({ ...student, assignmentType: 'class', period, teacherId })
                } else {
                  aideStudents[existingIndex].assignmentType = 'both'
                  aideStudents[existingIndex].period = period
                  aideStudents[existingIndex].teacherId = teacherId
                }
              }
            })
          }
        })
      }
    })
    return aideStudents
  }

  function shouldAideSeeStudent(aideId, studentId, students, userMap) {
    if (!aideId || !studentId || !students || !userMap) return false
    const student = students.find(s => s.id === studentId)
    if (!student) return false
    const aideData = aideAssignment.value[aideId]
    if (!aideData) return false
    const directStudentIds = Array.isArray(aideData.directAssignment) 
      ? aideData.directAssignment 
      : (aideData.directAssignment ? [aideData.directAssignment] : [])
    if (directStudentIds.includes(studentId)) return true
    if (!student.schedule) return false
    const aidePeriods = aideData.classAssignment || {}
    const hasClassAssignment = Object.entries(student.schedule).some(([period, teacherId]) => {
      const aideTeacherIds = aidePeriods[period]
      if (!aideTeacherIds) return false
      const teacherIdArray = Array.isArray(aideTeacherIds) ? aideTeacherIds : [aideTeacherIds]
      return teacherIdArray.includes(teacherId)
    })
    return hasClassAssignment
  }

  return {
    aideAssignment: computed(() => aideAssignment.value),
    loading: computed(() => loading.value),
    loadAideAssignments,
    loadAideAssignment,
    saveAideAssignment,
    saveAllAideAssignments,
    getAidesForTeacher,
    getDirectStudentForAide,
    getAideForStudent,
    getStudentsForAide,
    shouldAideSeeStudent
  }
} 