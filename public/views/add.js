// /views/add.js

import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

import {
  renderStudentForm,
  collectStudentFormData,
  loadUserRoles
} from "../components/studentForm.js"; // ✅ make sure this path is correct

export async function showAddStudentView(main) {
  const db = getFirestore();
  const storage = getStorage();
  const users = await loadUserRoles(db); // ✅ this is where it's called

  const formHTML = renderStudentForm({}, users, "new");
  const container = document.createElement("div");
  container.innerHTML = `<h1>Add New Student</h1>${formHTML}`;

  main.innerHTML = "";
  main.appendChild(container);

  const form = container.querySelector("#student-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectStudentFormData(form);
    const id = `${data.first_name.toLowerCase()}_${data.last_name.toLowerCase()}_${Date.now()}`;

    const storagePaths = {};
    const bipFile = form.querySelector("#bip-upload").files[0];
    if (bipFile) {
      const bipPath = `bips/${id}.pdf`;
      await uploadBytes(storageRef(storage, bipPath), bipFile);
      storagePaths.bip_pdf_url = await getDownloadURL(storageRef(storage, bipPath));
    }

    const ataglanceFile = form.querySelector("#ataglance-upload").files[0];
    if (ataglanceFile) {
      const path = `ataglance/${id}.pdf`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, ataglanceFile);
      storagePaths.ataglance_pdf_url = await getDownloadURL(ref);
    }

    await setDoc(doc(db, "students", id), {
      ...data,
      ...storagePaths
    });

    alert("Student added.");
    form.reset();
  });
}
