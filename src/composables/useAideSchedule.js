import { ref, computed } from 'vue'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export default function useAideSchedule() {
  const aideSchedule = ref({}) // { [aideId]: { schedule: {...}, directAssignment: [...] } }
  const loading = ref(false)

  // Load all aide schedules from aideSchedules collection
  async function loadAideSchedules() {
    loading.value = true
    try {
      const querySnapshot = await getDocs(collection(db, 'aideSchedules'))
      const result = {}
      querySnapshot.forEach(docSnap => {
        result[docSnap.id] = docSnap.data()
      })
      aideSchedule.value = result
    } catch (error) {
      console.error('Error loading aide schedules:', error)
      aideSchedule.value = {}
    } finally {
      loading.value = false
    }
  }

  // Load a single aide's schedule
  async function loadAideSchedule(aideId) {
    loading.value = true
    try {
      const docSnap = await getDoc(doc(db, 'aideSchedules', aideId))
      if (docSnap.exists()) {
        aideSchedule.value[aideId] = docSnap.data()
      } else {
        aideSchedule.value[aideId] = { schedule: {}, directAssignment: [] }
      }
    } catch (error) {
      console.error('Error loading aide schedule:', error)
      aideSchedule.value[aideId] = { schedule: {}, directAssignment: [] }
    } finally {
      loading.value = false
    }
  }

  // Save a single aide's schedule
  async function saveAideSchedule(aideId, data, merge = true) {
    try {
      const serializableData = JSON.parse(JSON.stringify(data))
      if (merge) {
        await setDoc(doc(db, 'aideSchedules', aideId), serializableData, { merge: true })
      } else {
        await setDoc(doc(db, 'aideSchedules', aideId), serializableData)
      }
      aideSchedule.value[aideId] = serializableData
    } catch (error) {
      console.error('Error saving aide schedule:', error)
      throw error
    }
  }

  // Save all aide schedules (batch update)
  async function saveAllAideSchedules() {
    try {
      const entries = Object.entries(aideSchedule.value)
      for (const [aideId, data] of entries) {
        const serializableData = JSON.parse(JSON.stringify(data))
        await setDoc(doc(db, 'aideSchedules', aideId), serializableData, { merge: true })
      }
    } catch (error) {
      console.error('Error saving all aide schedules:', error)
      throw error
    }
  }

  // Utility: get aides for a teacher/period, direct assignments, etc. (unchanged)
  function getAidesForTeacher(teacherId, period) {
    const aides = []
    Object.entries(aideSchedule.value).forEach(([aideId, aideData]) => {
      if (aideData.schedule && aideData.schedule[period]) {
        const teacherIds = Array.isArray(aideData.schedule[period]) 
          ? aideData.schedule[period] 
          : [aideData.schedule[period]]
        if (teacherIds.includes(teacherId)) {
          aides.push(aideId)
        }
      }
    })
    return aides
  }

  function getDirectStudentForAide(aideId) {
    const directAssignment = aideSchedule.value[aideId]?.directAssignment
    if (Array.isArray(directAssignment)) {
      return directAssignment.length > 0 ? directAssignment[0] : null
    }
    return directAssignment || null
  }

  function getAideForStudent(studentId) {
    const aideId = Object.keys(aideSchedule.value).find(aideId => {
      const directAssignment = aideSchedule.value[aideId]?.directAssignment
      if (Array.isArray(directAssignment)) {
        return directAssignment.includes(studentId)
      }
      return directAssignment === studentId
    })
    return aideId || null
  }

  function getStudentsForAide(aideId, students, userMap) {
    const aideStudents = []
    const aideData = aideSchedule.value[aideId]
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
    Object.entries(aideData.schedule || {}).forEach(([period, teacherIds]) => {
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
    const aideData = aideSchedule.value[aideId]
    if (!aideData) return false
    const directStudentIds = Array.isArray(aideData.directAssignment) 
      ? aideData.directAssignment 
      : (aideData.directAssignment ? [aideData.directAssignment] : [])
    if (directStudentIds.includes(studentId)) return true
    if (!student.schedule) return false
    const aidePeriods = aideData.schedule || {}
    const hasClassAssignment = Object.entries(student.schedule).some(([period, teacherId]) => {
      const aideTeacherIds = aidePeriods[period]
      if (!aideTeacherIds) return false
      const teacherIdArray = Array.isArray(aideTeacherIds) ? aideTeacherIds : [aideTeacherIds]
      return teacherIdArray.includes(teacherId)
    })
    return hasClassAssignment
  }

  return {
    aideSchedule: computed(() => aideSchedule.value),
    loading: computed(() => loading.value),
    loadAideSchedules,
    loadAideSchedule,
    saveAideSchedule,
    saveAllAideSchedules,
    getAidesForTeacher,
    getDirectStudentForAide,
    getAideForStudent,
    getStudentsForAide,
    shouldAideSeeStudent
  }
} 