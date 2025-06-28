// /Users/rd/CaseManageVue/src/composables/useStudents.js

import { ref } from 'vue'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function useStudents() {
  const students = ref([])

  async function fetchStudents() {
    const studentSnap = await getDocs(collection(db, 'students'))
    students.value = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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