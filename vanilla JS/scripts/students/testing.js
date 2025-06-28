import { db } from "../config/config.js";
import { showEditDialog } from "./components/studentDialogEdit.js";
import { renderStudentTable } from "./components/studentTable.js";
import { renderFilters, setupFilterHandlers } from "./components/filters.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Modular, no top-level code!
export async function showTestingView(main) {
  main.innerHTML = "";
  const container = document.createElement("div");
  container.innerHTML = `<h1>Testing - Separate Setting</h1>`;

  // Fetch students and users
  const [studentSnap, userSnap] = await Promise.all([
    getDocs(collection(db, "students")),
    getDocs(collection(db, "users"))
  ]);

  // Only students with flag2 (or adjust as needed)
  const students = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(s => s.flag2 === true); // Or use s.separate_setting === true
console.log("Students for testing page:", students);
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

  // Hide provider/class radios for this view
  const filters = renderFilters(
    caseManagers,
    window.currentUser?.role || "teacher",
    teacherList,
    window.currentUser?.uid || "",
    { hideProviderRadios: true } // No provider/class radios in testing view
  );

  main.appendChild(filters);
  main.appendChild(container);

  setupFilterHandlers(
    filters,
    students,
    window.currentUser,
    (filtered, sortBy) => renderStudentTable(
      container,
      filtered,
      userMap,
      window.currentUser,
      studentId => showEditDialog(main, studentId, () => showTestingView(main))
    ),
    null, // No class view for testing
    // Optionally, pass a base filter
    // { baseFilter: (s) => !!s.flag2 }
  );
}