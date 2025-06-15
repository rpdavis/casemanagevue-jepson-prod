import {
  getFirestore,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  setDoc,
  collection
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

import { showStudentsView } from "/views/students.js";
import {
  renderStudentForm,
  collectStudentFormData,
  loadUserRoles
} from "./studentForm.js";

export async function showEditDialog(main, studentId) {

  // debug
  console.log("window.currentUser", window.currentUser);
const { getAuth } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js");
const auth = getAuth();
console.log("auth.currentUser", auth.currentUser);
//-----
  const db = getFirestore();
  const storage = getStorage();

  // Load all students & user‐roles once
  const [studentSnap, users] = await Promise.all([
    getDocs(collection(db, "students")),
    loadUserRoles(db)
  ]);

  // Find target student
  const studentDoc = studentSnap.docs.find(d => d.id === studentId);
  if (!studentDoc) return alert("Student not found");
  const student = studentDoc.data();

  // Build the modal
  const modal = document.createElement("div");
  modal.classList.add("dialog-box");
  modal.innerHTML = `
    <h2>Edit Student</h2>
    ${renderStudentForm(student, users, "edit")}
    <div class="dialog-buttons">
      <button id="cancel-edit" class="cancel-btn">Cancel</button>
      <button id="save-edit" class="save-btn" disabled>Save</button>
    </div>
  `;

  const backdrop = document.createElement("div");
  backdrop.classList.add("dialog-backdrop");
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Grab the form element
  const form = modal.querySelector("#student-form");

  // --- Initialize flag checkboxes from student data ---
  const flagNames = ["flag1", "flag2"]; // Add "flag3" here if you have more flags!
  flagNames.forEach(name => {
    const chk = form.querySelector(`input[name="${name}"]`);
    if (chk) chk.checked = !!student[name];
  });
  // --- end flag init ---

  // Wire up save-button enabling
  const fields = modal.querySelectorAll("input, select, textarea");
  const saveBtn = modal.querySelector("#save-edit");
  saveBtn.addEventListener("click", () => form.requestSubmit());
  fields.forEach(f => f.addEventListener("change", () => {
    saveBtn.disabled = false;
  }));

  // Cancel handler
  modal.querySelector("#cancel-edit").addEventListener("click", () => {
    backdrop.remove();
  });

  // Form submit => save
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const updated = collectStudentFormData(form);
// debug check student ID
      console.log("Writing student:", studentId, updated);
  console.log("Writing flagged:", studentId, updated.flag1);
    // --- Handle flagged collection for permissions ---
    if (updated.flag1) {
      await setDoc(doc(db, "flagged", studentId), { studentId });
    } else {
      await deleteDoc(doc(db, "flagged", studentId));
    }
    // --- end flagged logic ---

    // Handle BIP PDF
    const bipFile = form.querySelector("#bip-upload").files[0];
    if (bipFile) {
      if (student.bip_pdf_url) {
        await deleteObject(ref(storage, student.bip_pdf_url)).catch(console.warn);
      }
      const r = ref(storage, `bips/${studentId}.pdf`);
      await uploadBytes(r, bipFile);
      updated.bip_pdf_url = await getDownloadURL(r);
    }

    // Handle At-A-Glance PDF
    const ataglanceFile = form.querySelector("#ataglance-upload").files[0];
    if (ataglanceFile) {
      if (student.ataglance_pdf_url) {
        await deleteObject(ref(storage, student.ataglance_pdf_url)).catch(console.warn);
      }
      const r2 = ref(storage, `ataglance/${studentId}.pdf`);
      await uploadBytes(r2, ataglanceFile);
      updated.ataglance_pdf_url = await getDownloadURL(r2);
    }

    // Re-collect flags into the update payload (in case checkboxes changed)
    flagNames.forEach(name => {
      const chk = form.querySelector(`input[name="${name}"]`);
      updated[name] = chk ? chk.checked : false;
    });

    // Persist to Firestore
    await updateDoc(doc(db, "students", studentId), updated);

    // Teardown & refresh
    backdrop.remove();
    showStudentsView(main);
  });
}