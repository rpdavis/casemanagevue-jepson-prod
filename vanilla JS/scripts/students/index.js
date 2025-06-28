// /public/scripts/students/index.js

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { db } from "../config/config.js";
//import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { showEditDialog } from "./components/studentDialogEdit.js";
import { renderStudentTable, renderByClassView, renderByCaseManagerView } from "./components/studentTable/index.js";
import { renderFilters, setupFilterHandlers } from "./components/filters.js";
import { showStudentEmailDialog } from "./components//studentTable/studentEmailDialog.js";
import { showExportDialog } from "./components/studentExport.js";

export async function showStudentsView(main) {

  main.innerHTML = "";

  const db = getFirestore();
  const container = document.createElement("div");
  container.innerHTML = `<h1>All Students</h1>`;

  const [studentSnap, userSnap] = await Promise.all([
    getDocs(collection(db, "students")),
    getDocs(collection(db, "users"))
  ]);
const exportButton = document.createElement("div");
exportButton.className = `ex-button`;
exportButton.innerHTML = `<button id="export-button">Export</button>`;
  const students = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const userMap = {};
  const caseManagers = [];
  const teacherList = [];

  userSnap.forEach(doc => {
    const data = doc.data();
    const { name, role } = data;
    if (name) {
      const [first, ...rest] = name.trim().split(" ");
      const last = rest.join(" ");
      const initials = `${first[0]}. ${last}`;
      userMap[doc.id] = { fullName: name, initials };
      if (["case_manager", "sped_chair", "administrator_504_CM"].includes(role)) {
        caseManagers.push({ id: doc.id, initials });
      }
      if (["teacher", "case_manager", "sped_chair"].includes(role)) {
        teacherList.push({ id: doc.id, name });
      }
    }

  });

  const filters = renderFilters(
    caseManagers,
    window.currentUser?.role || "teacher",
    teacherList,
    window.currentUser?.uid || ""
  );
   main.appendChild(exportButton);
  main.appendChild(filters);
 
  main.appendChild(container);

  const cmSelect = filters.querySelector("#filter-cm");
  if (cmSelect && window.currentUser?.role === "case_manager") {
    cmSelect.value = window.currentUser.uid;
    cmSelect.disabled = true;
    cmSelect.setAttribute("data-locked", "true");
  }

  const providerRadio = filters.querySelector("input[name='provider-view'][value='all']");
  if (providerRadio) providerRadio.checked = true;
// --- Disable Export Button on Click and Re-enable on Cancel/Complete ---
  const exportBtn = document.getElementById("export-button");
  exportBtn.addEventListener("click", async () => {
    console.log("Export button clicked. Disabling...");
    exportBtn.disabled = true;
    exportBtn.textContent = "Exporting...";

    try {
      // Call your export function and await its result
      // showExportDialog now fetches userMap internally, so it's not needed as an argument here.
      const result = await showExportDialog(students);
      console.log(`showExportDialog resolved with: ${result}`);

      if (result === 'canceled' || result === 'export_failed') {
        // If canceled or export failed, re-enable the button immediately
        console.log("Export process was canceled or failed. Re-enabling button.");
        exportBtn.disabled = false;
        exportBtn.textContent = "Export";
        if (result === 'export_failed') {
          alert("Export failed. Please try again.");
        }
      } else if (result === 'exported') {
        // If exported successfully, re-enable the button
        console.log("Export completed successfully. Re-enabling button.");
        exportBtn.disabled = false;
        exportBtn.textContent = "Export";
      }
    } catch (error) {
      // This catch block will handle any unexpected errors (e.g., a Promise rejection that wasn't 'export_failed')
      console.error("An unexpected error occurred during export process:", error);
      exportBtn.disabled = false;
      exportBtn.textContent = "Export";
      alert("An unexpected error occurred during export. Please try again.");
    }
  });

  

 
setupFilterHandlers(
  filters,
  students,
  window.currentUser,

  // 1) List view
  (filtered, sortBy) =>
    renderStudentTable(
      container,
      filtered,
      userMap,
      window.currentUser,
      studentId => showEditDialog(main, studentId, () => showStudentsView(main))
    ),

  // 2) By Class view
  (filtered, selectedTeacherId) =>
    renderByClassView(
      container,
      filtered,
      userMap,
      selectedTeacherId || window.currentUser.uid,
      studentId => showEditDialog(main, studentId, () => showStudentsView(main))
    ),

  // 3) By Case Manager view
  filtered =>
    renderByCaseManagerView(
      container,
      filtered,
      userMap,
      window.currentUser,
      studentId => showEditDialog(main, studentId, () => showStudentsView(main))
    )
);


  cmSelect?.dispatchEvent(new Event("input", { bubbles: true }));
}