// views/add.js
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import {
  loadUserRoles,
  renderStudentForm,
  collectStudentFormData
} from "./components/studentForm.js";

import { uploadFile } from "../config/storage.js";
import { showStudentsView } from "./index.js";

export async function showAddStudentView(main) {
  const db = getFirestore();

  // 1. load all the dropdown data
  const users = await loadUserRoles(db);

  // 2. render the blank form (new mode)
  main.innerHTML = renderStudentForm({}, users, "new");

  // 3. wire up submit
  const formEl = document.getElementById("student-form");
  formEl.addEventListener("submit", async e => {
    e.preventDefault();

    // a) pull out fields + files
    const {
      bipFile,
      atAGlanceFile,
      ...studentData
    } = collectStudentFormData(formEl);

    // b) upload any PDFs
    let bipUrl = null;
    if (bipFile) {
      bipUrl = await uploadFile(
        `bips/${studentData.first_name}_${studentData.last_name}_${Date.now()}.pdf`,
        bipFile
      );
    }

    let atAGlanceUrl = null;
    if (atAGlanceFile) {
      atAGlanceUrl = await uploadFile(
        `ataglance/${studentData.first_name}_${studentData.last_name}_${Date.now()}.pdf`,
        atAGlanceFile
      );
    }

    // c) compose the Firestore record,
    //    using the exact same field names your edit flow writes
    const newRecord = {
      ...studentData,
      ...(bipUrl        && { bip_pdf_url: bipUrl }),
      ...(atAGlanceUrl  && { ataglance_pdf_url: atAGlanceUrl }),
      createdAt: serverTimestamp()
    };

    // d) save it
    await addDoc(collection(db, "students"), newRecord);

    // e) refresh the list in-place
    showStudentsView(main);
  });
}
