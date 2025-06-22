// components/studentDialogEdit.js

import {
  getFirestore,
  // updateDoc, // REMOVED: Now handled by studentFormHandlers
  doc,
  getDoc,
  setDoc, // Still used for flagged collection update directly
  deleteDoc // Still used for flagged collection update directly
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { 
  // uploadFile, // REMOVED: Now handled by studentFormHandlers
  // deleteFile // REMOVED: Now handled by studentFormHandlers
} from "../../config/storage.js";
import { db } from "../../config/config.js"; // ADDED: Import db for Firestore operations here

import { showStudentsView } from "../index.js";
import {
  renderStudentForm,
  collectStudentFormData,
  loadUserRoles
} from "./studentForm.js";
import { updateStudentRecord } from "../handlers/studentFormHandlers.js"; 

// REMOVED: extractStoragePathFromUrl is now in studentFormHandlers.js
// /**
//  * Extracts the Cloud Storage path segment from a full download URL.
//  * @param {string} url
//  * @returns {string}
//  */
// function extractStoragePathFromUrl(url) {
//   if (!url) return "";
//   const match = url.match(/\/o\/([^?]+)/);
//   return match ? decodeURIComponent(match[1]) : "";
// }

export async function showEditDialog(main, studentId, onSaveCallback = () => {}) {
  const db = getFirestore();

  // 1) Fetch the student record
  const studentSnap = await getDoc(doc(db, "students", studentId));
  if (!studentSnap.exists()) {
    alert("Student not found");
    return;
  }
  const student = studentSnap.data();

  // 2) Load user role lists for dropdowns
  const users = await loadUserRoles(db);

  // 3) Build the modal HTML
  const modal = document.createElement("div");
  modal.classList.add("dialog-box");
  modal.innerHTML = `
    <h2>Edit Student</h2>
    ${renderStudentForm(student, users, "edit")}
    <div class="dialog-buttons">
      <button id="cancel-edit" class="cancel-btn">Cancel</button>
      <button id="save-edit" class="save-btn" disabled>Save</button>
    </div>

    <!-- Confirmation Dialog -->
    <div id="confirm-file-delete-modal" class="dialog-backdrop" style="display:none;">
      <div class="dialog-box">
        <h2>Confirm File Deletion</h2>
        <p id="file-delete-modal-text">Are you sure you want to delete this file?</p>
        <div class="dialog-buttons">
          <button id="confirm-file-delete-yes" class="save-btn">Yes</button>
          <button id="confirm-file-delete-no" class="cancel-btn">No</button>
        </div>
      </div>
    </div>
  `;

  // 4) Reference form controls
  const form      = modal.querySelector("#student-form");
  const saveBtn   = modal.querySelector("#save-edit");
  const cancelBtn = modal.querySelector("#cancel-edit");

  // 5) Helper functions for confirm dialog
function showModal(el) {
  // restore the CSS-defined flex display
  el.style.display = "flex";
  // if you have any animations tied to a “show” class, trigger them
  requestAnimationFrame(() => el.classList.add("show"));
}
function hideModal(el) {
  el.classList.remove("show");
  setTimeout(() => (el.style.display = "none"), 300);
}


 // 6) Create & show main dialog
  const backdrop = document.createElement("div");
  backdrop.classList.add("dialog-backdrop");
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // 7) Grab and **relocate** the confirm-delete dialog
  const fileDeleteModal     = modal.querySelector("#confirm-file-delete-modal");
  const fileDeleteModalText = fileDeleteModal.querySelector("#file-delete-modal-text");
  const fileDeleteYesBtn    = fileDeleteModal.querySelector("#confirm-file-delete-yes");
  const fileDeleteNoBtn     = fileDeleteModal.querySelector("#confirm-file-delete-no");

  // Detach confirm dialog from the transformed .dialog-box
  modal.removeChild(fileDeleteModal);
  // Append it at the top of the DOM so its fixed positioning works properly
  document.body.appendChild(fileDeleteModal);
    // ← add this so currentFileToDelete exists
  let currentFileToDelete = null;

  // 8) Handle file-input UI & staged-delete buttons
  form.querySelectorAll('input[type="file"]').forEach(input => {
    const wrapper           = input.closest(".file-input-wrapper");
    const statusDiv         = wrapper.querySelector(".file-status");
    const fileNameSpan      = statusDiv.querySelector(".file-name");
    const clearStagedBtn    = statusDiv.querySelector(".clear-staged-file-btn");
    const deleteExistingBtn = statusDiv.querySelector(".delete-existing-file-btn");

    // update name on file select
    input.addEventListener("change", () => {
      if (input.files.length) {
        fileNameSpan.textContent = `Selected: ${input.files[0].name}`;
        clearStagedBtn.style.display = "inline-block";
        deleteExistingBtn?.style.setProperty("display", "none");
      } else {
        fileNameSpan.textContent = "No file selected.";
        clearStagedBtn.style.display = "none";
        deleteExistingBtn?.style.setProperty("display", "inline-block");
      }
      saveBtn.disabled = false;
    });

    // clear staged file
    clearStagedBtn?.addEventListener("click", () => {
      input.value = "";
      fileNameSpan.textContent = "No file selected.";
      clearStagedBtn.style.display = "none";
      deleteExistingBtn?.style.setProperty("display", "inline-block");
      saveBtn.disabled = false;
    });

    // request confirm-delete for existing file
deleteExistingBtn?.addEventListener("click", () => {
  console.log("🗑️ deleteExistingBtn clicked", deleteExistingBtn);
  currentFileToDelete = {
    docType: deleteExistingBtn.dataset.docType,
    filePath: deleteExistingBtn.dataset.filePath,
    studentId: studentId   // make sure `studentId` is in scope here
  };
  showModal(fileDeleteModal);
});

  });

  // 9) Confirm-delete handlers
  fileDeleteYesBtn.addEventListener("click", async () => {
    hideModal(fileDeleteModal);
    if (!currentFileToDelete) return;

    const { docType, studentId: idToDeleteFrom } = currentFileToDelete;
    try {
      await updateStudentRecord(idToDeleteFrom, form, student, { [docType]: true });

      // reset UI for that input
      const inputEl  = form.querySelector(`#${docType}-upload`);
      const statusEl = inputEl.closest(".file-input-wrapper").querySelector(".file-status");
      statusEl.innerHTML = `
        <span class="file-name">No file selected.</span>
        <button type="button" class="clear-staged-file-btn" style="display:none;">❌</button>
      `;
      // re-attach clear-staged listener
      statusEl.querySelector(".clear-staged-file-btn")
        .addEventListener("click", () => {
          inputEl.value = "";
          statusEl.querySelector(".file-name").textContent = "No file selected.";
          statusEl.querySelector(".clear-staged-file-btn").style.display = "none";
          saveBtn.disabled = false;
        });

      alert(`${docType.toUpperCase()} file deleted successfully.`);
      onSaveCallback();
    } catch (err) {
      console.error(err);
      alert(`Failed to delete ${docType}: ${err.message}`);
    } finally {
      currentFileToDelete = null;
    }
  });

  fileDeleteNoBtn.addEventListener("click", () => {
    hideModal(fileDeleteModal);
    currentFileToDelete = null;
  });

  // 10) Initialize any flag checkboxes
  ["flag1", "flag2"].forEach(name => {
    const chk = form.querySelector(`input[name="${name}"]`);
    if (chk) chk.checked = !!student[name];
  });

  // 11) Enable save when fields change
  modal.querySelectorAll("input:not([type='file']), select, textarea")
    .forEach(el => el.addEventListener("change", () => (saveBtn.disabled = false)));

  // 12) Save button triggers form submit
  saveBtn.addEventListener("click", () => form.requestSubmit());

  // 13) Cancel closes the dialog
  cancelBtn.addEventListener("click", () => backdrop.remove());

  // 14) Handle form submission
  form.addEventListener("submit", async e => {
    e.preventDefault();
    saveBtn.disabled = true;
    try {
      await updateStudentRecord(studentId, form, student);
      alert("✅ Student saved successfully.");
      backdrop.remove();
      showStudentsView(main);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save student: " + err.message);
      saveBtn.disabled = false;
    }
  });
}


// ADDED: Simple status message function for the dialog
function statusMsg(msg, isError = false) {
    const div = document.querySelector('.dialog-box #edit-user-status'); // Adjust selector if needed
    if (div) {
        div.textContent = msg;
        div.className = 'admin-status-msg' + (isError ? ' error' : '');
    } else {
        console.log("Status message div not found in dialog.");
    }
}