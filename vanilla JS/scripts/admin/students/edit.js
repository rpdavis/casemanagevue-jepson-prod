// scripts/admin/editStudents.js
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { format }           from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { createSearchBar }  from "../../components/searchBar.js";

const PAGE_SIZE = 20;

export async function showEditStudents(rootEl) {
  const db = getFirestore();
  let students     = [];
  let activeRowId  = null;
  let currentPage  = 1;

  // 1) Build static UI once
  rootEl.innerHTML = `
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

  const statusDiv       = rootEl.querySelector("#edit-student-status");
  const tbody           = rootEl.querySelector("#student-table-body");
  const searchContainer = rootEl.querySelector("#student-search-container");
  const paginationDiv   = rootEl.querySelector("#student-pagination");

  // 2) Render & wire the name-only search bar + Delete All
  createSearchBar(searchContainer, {
    placeholder: "Search by name",
    types:       ["name"],  // only name
    onSearch:    (_, term) => {
      currentPage = 1;
      renderTable(filterList(term));
    },
    onDeleteAll: async () => {
      if (prompt("Type DELETE ALL STUDENTS to confirm:") !== "DELETE ALL STUDENTS")
        return;
      for (const s of [...students]) {
        await deleteDoc(doc(db, "students", s.id));
      }
      statusMsg("✅ All students deleted.");
      students = [];
      currentPage = 1;
      renderTable([]);
    }
  });

  // 3) Load all students once
  {
    const snap = await getDocs(collection(db, "students"));
    students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // 4) Helpers
  function statusMsg(msg, isError = false) {
    statusDiv.textContent = msg;
    statusDiv.className = "admin-status-msg" + (isError ? " error" : "");
  }

  function filterList(term) {
    const q = term.trim().toLowerCase();
    return students.filter(s => {
      const full = `${s.first_name||""} ${s.last_name||""}`.toLowerCase();
      return full.includes(q);
    });
  }

  // 5) Paginate + render rows
  function renderTable(list) {
    const total = list.length;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);

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
          <td class="action-btns"><button class="edit-btn" title="Edit">✏️</button></td>
        </tr>
      `).join("");
    }

    // Wire row-level editing
    tbody.querySelectorAll("button.edit-btn").forEach(btn => {
      btn.onclick = () => {
        if (activeRowId) return;
        const row = btn.closest("tr");
        activeRowId = row.dataset.id;
        row.classList.add("active-row");
        row.querySelectorAll(".editable-input").forEach(i => i.disabled = false);

        const cell = row.querySelector(".action-btns");
        cell.innerHTML = `
          <button class="save-btn" title="Save">💾</button>
          <button class="cancel-btn" title="Cancel">❌</button>
          <button class="delete-btn" title="Delete">🗑️</button>
        `;

        // Save handler
        cell.querySelector(".save-btn").onclick = async () => {
          const updates = {};
          row.querySelectorAll(".editable-input").forEach(el => {
            updates[el.dataset.field] = el.value.trim();
          });
          try {
            await updateDoc(doc(db, "students", activeRowId), updates);
            statusMsg("✅ Student updated.");
            students = students.map(s => s.id === activeRowId ? { ...s, ...updates } : s);
          } catch (e) {
            statusMsg("❌ Update failed.", true);
          }
          activeRowId = null;
          renderTable(filterList(searchContainer.querySelector("#search-input").value));
        };

        // Cancel handler
        cell.querySelector(".cancel-btn").onclick = () => {
          activeRowId = null;
          renderTable(filterList(searchContainer.querySelector("#search-input").value));
        };

        // Delete handler
        cell.querySelector(".delete-btn").onclick = async () => {
          if (!confirm("Delete this student?")) return;
          try {
            await deleteDoc(doc(db, "students", activeRowId));
            statusMsg("✅ Student deleted.");
            students = students.filter(s => s.id !== activeRowId);
          } catch (e) {
            statusMsg("❌ Delete failed.", true);
          }
          activeRowId = null;
          renderTable(filterList(searchContainer.querySelector("#search-input").value));
        };
      };
    });

    // 6) Render pagination controls
    const totalPages = Math.ceil(total / PAGE_SIZE);
    paginationDiv.innerHTML = `
      <button id="prev-student-page" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
      <span>Page ${currentPage} of ${totalPages}</span>
      <button id="next-student-page" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;
    paginationDiv.querySelector("#prev-student-page").onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable(list);
      }
    };
    paginationDiv.querySelector("#next-student-page").onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable(list);
      }
    };
  }

  // 7) Initial render: unfiltered list
  renderTable(students);
}
