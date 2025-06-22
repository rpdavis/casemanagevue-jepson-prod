// scripts/admin/students/model.js
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const db = getFirestore();

/** Fetch all students */
export async function fetchAllStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Update one student */
export async function updateStudent(id, updates) {
  await updateDoc(doc(db, "students", id), updates);
}

/** Delete one student */
export async function deleteStudent(id) {
  await deleteDoc(doc(db, "students", id));
}

/** Delete all students */
export async function deleteAllStudents() {
  const snap = await getDocs(collection(db, "students"));
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "students", d.id))));
}
