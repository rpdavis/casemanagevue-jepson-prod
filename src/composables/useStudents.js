// /Users/rd/CaseManageVue/src/composables/useStudents.js

import { ref } from 'vue'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Helper function to convert Firestore Maps to plain objects
function convertFirestoreMaps(obj) {
  if (!obj || typeof obj !== 'object') return obj
  
  // If it's a Firestore Map, convert to plain object
  if (obj.toJSON && typeof obj.toJSON === 'function') {
    return obj.toJSON()
  }
  
  // If it's an array, convert each element
  if (Array.isArray(obj)) {
    return obj.map(convertFirestoreMaps)
  }
  
  // If it's a plain object, convert each property
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    // If this is a schedule map with teacherId, force teacherId to string
    if (key.toLowerCase().includes('schedule') && typeof value === 'object' && value !== null) {
      for (const [period, schedVal] of Object.entries(value)) {
        if (schedVal && typeof schedVal === 'object' && schedVal.teacherId !== undefined) {
          value[period].teacherId = String(schedVal.teacherId)
        }
      }
    }
    result[key] = convertFirestoreMaps(value)
  }
  return result
}

export default function useStudents() {
  const students = ref([])

  async function fetchStudents() {
    const studentSnap = await getDocs(collection(db, 'students'))
    students.value = studentSnap.docs.map(doc => {
      const data = doc.data()
      // Convert any Firestore Maps to plain objects
      const convertedData = convertFirestoreMaps(data)
      return { id: doc.id, ...convertedData }
    })
    
    // Debug: Log the first student with aeries data to see the structure
    const studentWithAeries = students.value.find(s => s.aeries)
    if (studentWithAeries) {
      console.log('🔍 useStudents DEBUG - Student with aeries:', studentWithAeries)
      console.log('🔍 useStudents DEBUG - aeries.schedule:', studentWithAeries.aeries?.schedule)
      console.log('🔍 useStudents DEBUG - aeries.schedule type:', typeof studentWithAeries.aeries?.schedule)
      if (studentWithAeries.aeries?.schedule) {
        console.log('🔍 useStudents DEBUG - schedule keys:', Object.keys(studentWithAeries.aeries.schedule))
      }
    }
  }

  // Admin functions
  async function fetchAllStudents() {
    const studentSnap = await getDocs(collection(db, 'students'))
    return studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  async function updateStudent(id, updates) {
    await updateDoc(doc(db, 'students', id), updates)
  }

  async function deleteStudent(id) {
    await deleteDoc(doc(db, 'students', id))
  }

  async function deleteAllStudents() {
    const studentSnap = await getDocs(collection(db, 'students'))
    await Promise.all(studentSnap.docs.map(d => deleteDoc(doc(db, 'students', d.id))))
  }

  return { 
    students, 
    fetchStudents,
    fetchAllStudents,
    updateStudent,
    deleteStudent,
    deleteAllStudents
  }
}