import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { showEditDialog } from "../components/studentDialogEdit.js";
import { renderStudentTable, renderByClassView } from "../components/studentTable.js";
import { renderFilters, setupFilterHandlers } from "../components/filters.js";

export async function showStudentsView(main) {
  main.innerHTML = "";

  const db = getFirestore();
  const container = document.createElement("div");
  container.innerHTML = `<h1>All Students</h1>`;

  const [studentSnap, userSnap] = await Promise.all([
    getDocs(collection(db, "students")),
    getDocs(collection(db, "users"))
  ]);

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

  setupFilterHandlers(
    filters,
    students,
    window.currentUser,
    (filtered, sortBy) => renderStudentTable(container, filtered, userMap, window.currentUser, studentId => {
      showEditDialog(main, studentId, () => showStudentsView(main));
    }),
    (filtered, selectedTeacherId) => renderByClassView(
      container,
      filtered,
      userMap,
      selectedTeacherId || window.currentUser?.uid,
      studentId => {
        showEditDialog(main, studentId, () => showStudentsView(main));
      }
    )
  );

  cmSelect?.dispatchEvent(new Event("input", { bubbles: true }));
}