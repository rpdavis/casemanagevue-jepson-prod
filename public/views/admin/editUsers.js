import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { VALID_ROLES } from "../../firebase/roles.js";

const PAGE_SIZE = 20;
const DEFAULT_SUBJECTS = ["Math", "Science", "English", "History"];

function safeEmailId(email) {
  return email.replace(/[.#$[\]]/g, "_");
}

export function showEditUsersSection(main) {
  const db = getFirestore();

  let subjectOptions = [...DEFAULT_SUBJECTS];
  let usersPageDocs = [];
  let lastVisible = null;
  let currentPage = 1;
  let currentSearchType = "name";
  let currentSearchTerm = "";
  let activeRowId = null; // Only one row can be edited at a time

  // ---- Styles for UI/UX ----
  if (!document.getElementById("edit-users-style")) {
    const style = document.createElement("style");
    style.id = "edit-users-style";
    style.textContent = `
      .students-table th, .students-table td {
        border-right: 1px solid #d1d1d1;
      }
      .students-table th:last-child, .students-table td:last-child {
        border-right: none;
      }
      .students-table td, .students-table th {
        padding-top: 0.38rem;
        padding-bottom: 0.38rem;
        font-size: 1.09em;
      }
      .admin-form-row {
        display: flex;
        align-items: center;
        gap: 1em;
        margin-bottom: 1em;
        flex-wrap: wrap;
      }
      .admin-form-row label {
        font-weight: 500;
        margin-right: 0.5em;
      }
      .admin-form-row input[type="text"], .admin-form-row input[type="email"], .admin-form-row select {
        padding: 0.3em 0.5em;
        font-size: 1em;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-right: 0.5em;
      }
      .admin-form-row button {
        padding: 0.3em 1em;
        font-size: 1em;
        background: #005bb5;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .admin-form-row button:hover, .admin-form-row button:focus {
        background: #004799;
      }
      .admin-status-msg {
        margin: 1em 0 0.5em 0;
        font-size: 1em;
        color: #2d5c38;
        min-height: 1.2em;
      }
      .admin-status-msg.error {
        color: #b42c2c;
      }
      .admin-pagination {
        display: flex;
        gap: 1em;
        align-items: center;
        margin-top: 1em;
      }
      .admin-pagination button {
        padding: 0.3em 1em;
        background: #e2eaf7;
        color: #005bb5;
        border: 1px solid #bbb;
        border-radius: 3px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.13s;
      }
      .admin-pagination button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .admin-pagination button:not(:disabled):hover, .admin-pagination button:not(:disabled):focus {
        background: #d6e3fa;
      }
      .editable-input, .editable-select {
        font-size: 1.14em;
        padding: 0.17em 0.38em;
        border: none;
        background: transparent;
        outline: none;
        width: 96%;
        color: #222;
        transition: border 0.13s, box-shadow 0.13s;
        border-radius: 2.5px;
        min-height: 2.1em;
      }
      .editable-input[disabled], .editable-select[disabled] {
        color: #888;
        background: transparent;
        border: none;
        box-shadow: none;
        cursor: default;
      }
      .editable-input:focus, .editable-select:focus, .students-table tr.active-row .editable-input:not([disabled]), .students-table tr.active-row .editable-select:not([disabled]) {
        border: 1.5px solid #2196f3;
        background: #fff;
        box-shadow: 0 0 0 2px #b3e1fa4e;
      }
      .students-table tr.active-row {
        border-left: 6px solid #2196f3 !important;
        background: #e8f2fc;
      }
      .action-btns {
        display: flex;
        justify-content: center;
        gap: 0.5em;
      }
      .action-btns button {
        padding: 0.25em 0.5em;
        font-size: 1.25em;
        border: none;
        background: transparent;
        color: #005bb5;
        cursor: pointer;
        border-radius: 3px;
        transition: background 0.12s;
        outline: none;
      }
      .action-btns button:focus, .action-btns button:hover {
        background: #e0eafc;
      }
      .action-btns .edit-btn {
        color: #1976d2;
        font-size: 1.15em;
      }
      .action-btns .save-btn {
        color: #2a9d3a;
        font-size: 1.15em;
      }
      .action-btns .delete-btn {
        color: #d12c2c;
        font-size: 1.15em;
      }
      .action-btns .cancel-btn {
        color: #888;
        font-size: 1.1em;
      }
      .action-btns button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  const section = document.createElement("section");
  section.style.marginTop = "2rem";
  section.innerHTML = `
    <h2>Edit Users</h2>
    <form id="search-user-form" class="admin-form-row">
      <input type="radio" name="search-type" value="name" id="srch-name" checked>
      <label for="srch-name">Search by Name</label>
      <input type="radio" name="search-type" value="email" id="srch-email">
      <label for="srch-email">Search by Email</label>
      <input type="text" id="user-search-input" placeholder="Enter name or email" style="min-width:12em;">
      <button type="submit">Search</button>
      <button type="button" id="clear-search">Clear</button>
    </form>
    <div class="admin-form-row" style="margin-top:-0.75em;">
      <label for="subject-dropdown">Edit Subjects:</label>
      <select id="subject-dropdown"></select>
      <input type="text" id="new-subject-input" placeholder="New subject" style="width:10em;">
      <button id="add-subject-btn" type="button">Add</button>
      <button id="del-subject-btn" type="button">Delete Selected</button>
    </div>
    <div id="edit-user-status" class="admin-status-msg"></div>
    <div id="users-table-container"></div>
    <div id="pagination-controls" class="admin-pagination"></div>
  `;
  main.appendChild(section);

  // ---- Subject Management ----
  function renderSubjectDropdown() {
    const dropdown = section.querySelector("#subject-dropdown");
    dropdown.innerHTML = subjectOptions.map(s =>
      `<option value="${s}">${s}</option>`
    ).join("");
  }
  renderSubjectDropdown();

  section.querySelector("#add-subject-btn").onclick = () => {
    const newVal = section.querySelector("#new-subject-input").value.trim();
    if (newVal && !subjectOptions.includes(newVal)) {
      subjectOptions.push(newVal);
      renderSubjectDropdown();
      section.querySelector("#new-subject-input").value = "";
    }
  };
  section.querySelector("#del-subject-btn").onclick = () => {
    const dropdown = section.querySelector("#subject-dropdown");
    const selected = dropdown.value;
    subjectOptions = subjectOptions.filter(s => s !== selected);
    renderSubjectDropdown();
  };

  // ---- User Table ----

  async function fetchUsers(pageDirection = "first") {
    statusMsg("");
    let q;
    const usersRef = collection(db, "users");

    if (currentSearchTerm) {
      if (currentSearchType === "name") {
        q = query(
          usersRef,
          orderBy("name"),
          where("name", ">=", currentSearchTerm),
          where("name", "<=", currentSearchTerm + "\uf8ff"),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          usersRef,
          orderBy("email"),
          where("email", ">=", currentSearchTerm),
          where("email", "<=", currentSearchTerm + "\uf8ff"),
          limit(PAGE_SIZE)
        );
      }
    } else {
      q = query(usersRef, orderBy("name"), limit(PAGE_SIZE));
    }

    if (pageDirection === "next" && usersPageDocs.length) {
      q = query(
        usersRef,
        orderBy(currentSearchType),
        startAfter(usersPageDocs[usersPageDocs.length - 1]),
        limit(PAGE_SIZE)
      );
    } else if (pageDirection === "prev") {
      statusMsg("Prev page not implemented.", true);
      return;
    }

    const snap = await getDocs(q);
    usersPageDocs = snap.docs;
    activeRowId = null; // always reset after table render
    renderTable(usersPageDocs.map(doc => ({ id: doc.id, ...doc.data() })));
    renderPaginationControls(snap.size === PAGE_SIZE);
  }

  function renderPaginationControls(hasNext) {
    const pag = section.querySelector("#pagination-controls");
    pag.innerHTML = `
      <button id="prev-page-btn" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
      <span>Page ${currentPage}</span>
      <button id="next-page-btn" ${hasNext ? "" : "disabled"}>Next</button>
    `;
    pag.querySelector("#next-page-btn").onclick = async () => {
      currentPage++;
      await fetchUsers("next");
    };
    pag.querySelector("#prev-page-btn").onclick = () => {
      if (currentPage > 1) {
        currentPage = 1;
        usersPageDocs = [];
        fetchUsers("first");
      }
    };
  }

  function deactivateAllRows() {
    const table = section.querySelector(".students-table");
    if (!table) return;
    table.querySelectorAll("tr.active-row").forEach(row => {
      row.classList.remove("active-row");
      Array.from(row.querySelectorAll(".editable-input, .editable-select")).forEach(
        el => { el.disabled = true; el.blur(); }
      );
      const actCell = row.querySelector(".action-btns");
      if (actCell) {
        actCell.innerHTML = `
          <button class="edit-btn" title="Edit row" aria-label="Edit"><span role="img" aria-label="Edit">✏️</span></button>
        `;
      }
    });
    table.querySelectorAll(".edit-btn").forEach(btn => { btn.disabled = false; });
    activeRowId = null;
  }

  function renderTable(users) {
    const container = section.querySelector("#users-table-container");
    if (!users.length) {
      container.innerHTML = "<p>No users found.</p>";
      return;
    }
    container.innerHTML = `
      <table class="students-table user-admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Email</th>
            <th>Role</th>
            <th>Subject</th>
            <th style="text-align:center;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((user) => `
            <tr data-userid="${user.id}">
              <td><input type="text" value="${user.name || ""}" class="editable-input" disabled></td>
              <td><input type="text" value="${user.title || ""}" class="editable-input" disabled></td>
              <td>${user.email}</td>
              <td>
                <select class="editable-select" disabled>
                  ${VALID_ROLES.map(role =>
                    `<option value="${role}"${role === user.role ? " selected" : ""}>${role.replace(/_/g, " ")}</option>`
                  ).join("")}
                </select>
              </td>
              <td>
                <select class="editable-select" disabled>
                  <option value="">None</option>
                  ${subjectOptions.map(subject =>
                    `<option value="${subject}"${subject === user.subject ? " selected" : ""}>${subject}</option>`
                  ).join("")}
                </select>
              </td>
              <td class="action-btns" style="text-align:center;">
                <button class="edit-btn" title="Edit row" aria-label="Edit"><span role="img" aria-label="Edit">✏️</span></button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // Attach edit/save/cancel/delete handlers
    container.querySelectorAll(".edit-btn").forEach(btn => {
      btn.onclick = (e) => {
        if (activeRowId) return;
        const row = e.target.closest("tr");
        activeRowId = row.dataset.userid;
        row.classList.add("active-row");
        Array.from(row.querySelectorAll(".editable-input, .editable-select")).forEach(
          el => { el.disabled = false; }
        );
        const actCell = row.querySelector(".action-btns");
        actCell.innerHTML = `
          <button class="save-btn" title="Save row" aria-label="Save"><span role="img" aria-label="Save">💾</span></button>
          <button class="cancel-btn" title="Cancel edit" aria-label="Cancel"><span role="img" aria-label="Cancel">❌</span></button>
          <button class="delete-btn" title="Delete user" aria-label="Delete"><span role="img" aria-label="Delete">🗑️</span></button>
        `;
        container.querySelectorAll(".edit-btn").forEach(b => { b.disabled = true; });

        row.querySelector(".save-btn").onclick = async () => {
          const userId = row.dataset.userid;
          const [nameEl, titleEl] = row.querySelectorAll(".editable-input");
          const [roleEl, subjectEl] = row.querySelectorAll(".editable-select");
          const name = nameEl.value.trim();
          const title = titleEl.value.trim();
          const role = roleEl.value;
          const subject = subjectEl.value;
          const userRef = doc(db, "users", userId);
          try {
            await updateDoc(userRef, { name, title, role, subject });
            statusMsg("✅ User updated.", false);
          } catch (err) {
            statusMsg("❌ Error updating user.", true);
          }
          activeRowId = null;
          fetchUsers("first");
        };
        row.querySelector(".cancel-btn").onclick = () => {
          activeRowId = null;
          fetchUsers("first");
        };
        row.querySelector(".delete-btn").onclick = async () => {
          const userId = row.dataset.userid;
          if (!confirm("Are you sure you want to delete this user?")) return;
          try {
            const userRef = doc(db, "users", safeEmailId(userId));
            await deleteDoc(userRef);
            row.remove();
            statusMsg("✅ User deleted.", false);
          } catch (err) {
            statusMsg("❌ Error deleting user.", true);
            console.error("Delete user error:", err);
          }
          activeRowId = null;
          fetchUsers("first");
        };
      };
    });
  }

  section.querySelector("#search-user-form").onsubmit = async (e) => {
    e.preventDefault();
    currentSearchType = section.querySelector("input[name='search-type']:checked").value;
    currentSearchTerm = section.querySelector("#user-search-input").value.trim();
    currentPage = 1;
    usersPageDocs = [];
    await fetchUsers("first");
  };
  section.querySelector("#clear-search").onclick = () => {
    section.querySelector("#user-search-input").value = "";
    currentSearchTerm = "";
    currentPage = 1;
    usersPageDocs = [];
    fetchUsers("first");
  };

  function statusMsg(msg, isError = false) {
    const div = section.querySelector("#edit-user-status");
    div.textContent = msg || "";
    div.className = "admin-status-msg" + (isError ? " error" : "");
  }

  fetchUsers("first");
}