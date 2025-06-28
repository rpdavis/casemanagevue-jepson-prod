// scripts/admin/students/index.js
import { fetchAllStudents, deleteAllStudents } from "./model.js";
import { renderStudentsShell }                from "./ui.js";
import { attachStudentHandlers }              from "./controller.js";

export async function showAdminStudents(container) {
  container.innerHTML = ""; 
  renderStudentsShell(container, {
    onSearch: (_, term) => {
      // filter in controller
      filtered = allStudents.filter(s =>
        (`${s.first_name} ${s.last_name}`).toLowerCase().includes(term.toLowerCase())
      );
      currentPage = 1;
      attachStudentHandlers(container, filtered);
    },
    onDeleteAll: async () => {
      if (prompt("Type DELETE ALL STUDENTS to confirm:") !== "DELETE ALL STUDENTS") return;
      await deleteAllStudents();
      // reload
      allStudents = [];
      attachStudentHandlers(container, []);
    }
  });

  let allStudents = await fetchAllStudents();
  let currentPage = 1;      // tracked in controller
  let filtered    = allStudents;

  attachStudentHandlers(container, filtered);
}
