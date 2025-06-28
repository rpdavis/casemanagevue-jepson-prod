// scripts/admin/students/controller.js
import {
  updateStudent,
  deleteStudent
} from "./model.js";
import { renderStudentsTable } from "./ui.js";

const PAGE_SIZE = 20;

export function attachStudentHandlers(container, studentsRef) {
  let studentsList = studentsRef.slice();
  let currentPage  = 1;
  let activeId     = null;

  const statusDiv     = container.querySelector("#edit-student-status");

  function statusMsg(msg, isError = false) {
    statusDiv.textContent = msg;
    statusDiv.className = "admin-status-msg" + (isError ? " error" : "");
  }

  function wireRows() {
    container.querySelectorAll("tbody tr").forEach(row => {
      const id = row.dataset.id;
      row.querySelector(".btn-edit").onclick = () => {
        if (activeId) return;
        activeId = id;
        row.classList.add("active-row");
        row.querySelectorAll(".editable-input").forEach(i => i.disabled = false);

        const cell = row.querySelector(".action-btns");
        cell.innerHTML = `
          <button class="btn-save">💾</button>
          <button class="btn-cancel">❌</button>
          <button class="btn-delete">🗑️</button>
        `;

        cell.querySelector(".btn-save").onclick = async () => {
          const updates = {};
          row.querySelectorAll(".editable-input").forEach(el => {
            updates[el.dataset.field] = el.value.trim();
          });
          try {
            await updateStudent(id, updates);
            statusMsg("✅ Student updated.");
            studentsList = studentsList.map(s =>
              s.id === id ? { ...s, ...updates } : s
            );
          } catch {
            statusMsg("❌ Update failed.", true);
          }
          activeId = null;
          renderAndWire();
        };

        cell.querySelector(".btn-cancel").onclick = () => {
          activeId = null;
          renderAndWire();
        };

        cell.querySelector(".btn-delete").onclick = async () => {
          if (!confirm("Delete this student?")) return;
          try {
            await deleteStudent(id);
            statusMsg("✅ Student deleted.");
            studentsList = studentsList.filter(s => s.id !== id);
          } catch {
            statusMsg("❌ Delete failed.", true);
          }
          activeId = null;
          renderAndWire();
        };
      };
    });
  }

  function wirePagination(filtered) {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const prev = container.querySelector("#prev-student-page");
    const next = container.querySelector("#next-student-page");

    prev.disabled = currentPage === 1;
    next.disabled = currentPage === totalPages;

    prev.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderAndWire(filtered);
      }
    };
    next.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderAndWire(filtered);
      }
    };
  }

  function renderAndWire(filteredList = studentsList) {
    renderStudentsTable(container, filteredList, currentPage);
    wireRows();
    wirePagination(filteredList);
  }

  // initial render
  renderAndWire();
}
