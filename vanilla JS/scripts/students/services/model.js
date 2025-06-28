// public/scripts/students/services/studentService.js
import { db } from "../../config/config.js";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Creates a new student document.
 * @param {Object} studentData
 * @returns {Promise<string>} The new document ID
 */
export async function createStudent(studentData) {
  const ref = doc(collection(db, "students"));
  await setDoc(ref, {
    ...studentData,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

/**
 * Updates an existing student document.
 * @param {string} studentId
 * @param {Object} updates
 */
export async function updateStudent(studentId, updates) {
  const ref = doc(db, "students", studentId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}
