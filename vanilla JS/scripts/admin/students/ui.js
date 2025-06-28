// scripts/admin/students/ui.js
import { createSearchBar } from "../../components/searchBar.js";
import { format } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const PAGE_SIZE = 20;

/**
 * Render search bar (with Delete All), status, table shell, and pagination.
 */
export function renderStudentsShell(container, { onSearch, onDeleteAll }) {
  container.innerHTML = `
    <h2>Edit Students</h2>
    <div id="student-search-container" class="admin-form-row"></div>
    <div id="edit-student-status" class="admin-status-msg"></div>
    <table class="user-admin-table students-table striped">
      <thead>
        <tr>
          <th>ID</th><th>First Name</th><th>Last Name</th>
          <th>Grade</th><th>Case Manager</th><th>Date Added</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="student-table-body"></tbody>
    </table>
    <div id="student-pagination" class="admin-pagination"></div>
  `;

  createSearchBar(container.querySelector("#student-search-container"), {
    placeholder: "Search by name",
    types:       ["name"],
    onSearch,
    onDeleteAll
  });
}

/**
 * Fill the table body + pagination controls.
 */
export function renderStudentsTable(container, students, page) {
  const tbody = container.querySelector("#student-table-body");
  const paginationDiv = container.querySelector("#student-pagination");

  const total = students.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = students.slice(start, start + PAGE_SIZE);

  // rows
  if (!pageItems.length) {
    tbody.innerHTML = `<tr><td colspan="7">No students found.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(s => `
      <tr data-id="${s.id}">
        <td>${s.id}</td>
        <td><input class="editable-input" data-field="first_name" value="${s.first_name||''}" disabled></td>
        <td><input class="editable-input" data-field="last_name"  value="${s.last_name||''}"  disabled></td>
        <td><input class="editable-input" data-field="grade"      value="${s.grade||''}"      disabled></td>
        <td><input class="editable-input" data-field="casemanager_id" value="${s.casemanager_id||''}" disabled></td>
        <td>${s.created_at?.toDate ? format(s.created_at.toDate(),'MM/dd/yyyy') : '—'}</td>
        <td class="action-btns"><button class="btn-edit" title="Edit">✏️</button></td>
      </tr>
    `).join("");
  }

  // pager
  paginationDiv.innerHTML = `
    <button id="prev-student-page" class="admin-btn"${page===1?" disabled":""}>Prev</button>
    <span>Page ${page} of ${totalPages}</span>
    <button id="next-student-page" class="admin-btn"${page===totalPages?" disabled":""}>Next</button>
  `;
}
