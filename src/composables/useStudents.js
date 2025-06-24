import { ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function useStudents() {
  const students = ref([])

  async function fetchStudents() {
    const studentSnap = await getDocs(collection(db, 'students'))
    students.value = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  return { students, fetchStudents }
}