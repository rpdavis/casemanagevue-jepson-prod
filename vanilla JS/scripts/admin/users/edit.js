// scripts/admin/users/edit.js
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
import { VALID_ROLES }        from "../../config/roles.js";
import { createSearchBar }    from "../../components/searchBar.js";

const PAGE_SIZE = 20;

function safeEmailId(email) {
  return email.replace(/[.#$[\]]/g, "_");
}

export function showUsersEdit(main) {
  const db = getFirestore();
  let usersPageDocs     = [];
  let currentPage       = 1;
  let currentSearchType = "name";
  let currentSearchTerm = "";
  let activeRowId       = null;
  let fetchDebounce;

  // 1) Build static UI once
  main.innerHTML = `
    <h2>Edit Users</h2>
    <div id="user-search-container" class="admin-form-row"></div>
    <div id="edit-user-status" class="admin-status-msg"></div>
    <div id="users-table-container">
      <table class="user-admin-table users-table striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Email</th>
            <th>Role</th>
            <th style="text-align:center;">Actions</th>
          </tr>
        </thead>
        <tbody id="users-table-body"></tbody>
      </table>
    </div>
    <div id="pagination-controls" class="admin-pagination"></div>
  `;

  // 2) Cache elements
  const statusDiv      = main.querySelector("#edit-user-status");
  const tbody          = main.querySelector("#users-table-body");
  const pagControls    = main.querySelector("#pagination-controls");
  const searchContainer= main.querySelector("#user-search-container");

  // 3) Render & wire the search-bar (name+email)
  createSearchBar(searchContainer, {
    placeholder: "Search by name or email",
    types:       ["name","email"],
    onSearch:    (type, term) => {
      currentSearchType = type;
      currentSearchTerm = term;
      currentPage       = 1;
      scheduleFetch();
    },
    onDeleteAll: async () => {
      if (prompt("Type DELETE ALL USERS to confirm:") !== "DELETE ALL USERS") return;
      const snapAll = await getDocs(collection(db, "users"));
      await Promise.all(snapAll.docs.map(d => deleteDoc(doc(db, "users", d.id))));
      statusMsg("✅ All users deleted.");
      currentPage = 1;
      scheduleFetch();
    }
  });

  // 4) Status helper
  function statusMsg(msg, isError = false) {
    statusDiv.textContent = msg;
    statusDiv.className = "admin-status-msg" + (isError ? " error" : "");
  }

  // 5) Debounce fetch
  function scheduleFetch(direction = "first") {
    clearTimeout(fetchDebounce);
    fetchDebounce = setTimeout(() => fetchUsers(direction), 300);
  }

  // 6) Fetch & render rows + pagination
  async function fetchUsers(pageDirection = "first") {
    statusMsg("");
    const usersRef = collection(db, "users");
    let q; 

    // client-side name search
    if (currentSearchTerm && currentSearchType === "name") {
      const snapAll = await getDocs(query(usersRef, orderBy("name"), limit(1000)));
      const filtered = snapAll.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => (u.name || "").toLowerCase().includes(currentSearchTerm.toLowerCase()));
      activeRowId = null;
      renderRows(filtered);
      renderPaginationControls(false);
      return;
    }

    // email or default search
    if (currentSearchTerm && currentSearchType === "email") {
      q = query(
        usersRef,
        orderBy("email"),
        where("email", ">=", currentSearchTerm),
        where("email", "<=", currentSearchTerm + "\uf8ff"),
        limit(PAGE_SIZE)
      );
    } else if (!currentSearchTerm) {
      q = query(usersRef, orderBy("name"), limit(PAGE_SIZE));
    } else {
      q = query(
        usersRef,
        orderBy("name"),
        where("name", ">=", currentSearchTerm),
        where("name", "<=", currentSearchTerm + "\uf8ff"),
        limit(PAGE_SIZE)
      );
    }

    // cursor‐based paging
    if (pageDirection === "next" && usersPageDocs.length) {
      q = query(
        usersRef,
        orderBy(currentSearchType),
        startAfter(usersPageDocs[usersPageDocs.length - 1]),
        limit(PAGE_SIZE)
      );
    }

    const snap = await getDocs(q);
    usersPageDocs = snap.docs;
    activeRowId   = null;
    renderRows(usersPageDocs.map(d => ({ id: d.id, ...d.data() })));
    renderPaginationControls(snap.size === PAGE_SIZE);
  }

  // 7) Render only the table rows
  function renderRows(users) {
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5">No users found.</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(user => `
      <tr data-userid="${user.id}">
        <td><input type="text" value="${user.name||""}" class="editable-input" disabled></td>
        <td><input type="text" value="${user.title||""}" class="editable-input" disabled></td>
        <td>${user.email}</td>
        <td>
          <select class="editable-select" disabled>
            ${VALID_ROLES.map(r => `
              <option value="${r}"${r===user.role?" selected":""}>${r.replace(/_/g," ")}</option>
            `).join("")}
          </select>
        </td>
        <td class="action-btns">
          <button class="edit-btn">✏️</button>
        </td>
      </tr>
    `).join("");

    // re‐attach edit/save/cancel/delete handlers
    tbody.querySelectorAll(".edit-btn").forEach(btn => {
      btn.onclick = () => {
        if (activeRowId) return;
        const row = btn.closest("tr");
        activeRowId = row.dataset.userid;
        row.classList.add("active-row");
        row.querySelectorAll(".editable-input, .editable-select")
           .forEach(el => el.disabled = false);

        const cell = row.querySelector(".action-btns");
        cell.innerHTML = `
          <button class="save-btn">💾</button>
          <button class="cancel-btn">❌</button>
          <button class="delete-btn">🗑️</button>
        `;

        cell.querySelector(".save-btn").onclick = async () => {
          const [nameEl, titleEl] = row.querySelectorAll(".editable-input");
          const [roleEl]          = row.querySelectorAll(".editable-select");
          try {
            await updateDoc(doc(db, "users", activeRowId), {
              name:  nameEl.value.trim(),
              title: titleEl.value.trim(),
              role:  roleEl.value
            });
            statusMsg("✅ User updated.");
            // update local copy
            usersPageDocs = usersPageDocs.map(d =>
              d.id === activeRowId
                ? { ...d, name: nameEl.value, title: titleEl.value, role: roleEl.value }
                : d
            );
          } catch {
            statusMsg("❌ Error updating user.", true);
          }
          activeRowId = null;
          fetchUsers();
        };

        cell.querySelector(".cancel-btn").onclick = () => {
          activeRowId = null;
          renderRows(usersPageDocs.map(d => ({ id: d.id, ...d.data() })));
        };

        cell.querySelector(".delete-btn").onclick = async () => {
          if (!confirm("Delete this user?")) return;
          try {
            await deleteDoc(doc(db, "users", safeEmailId(activeRowId)));
            statusMsg("✅ User deleted.");
          } catch {
            statusMsg("❌ Error deleting user.", true);
          }
          activeRowId = null;
          fetchUsers();
        };
      };
    });
  }

  // 8) Render pagination controls
  function renderPaginationControls(hasNext) {
    pagControls.innerHTML = `
      <button id="prev-page-btn" class="admin-btn" ${currentPage===1?"disabled":""}>Prev</button>
      <span>Page ${currentPage}</span>
      <button id="next-page-btn" class="admin-btn" ${hasNext?"":"disabled"}>Next</button>
    `;
    pagControls.querySelector("#prev-page-btn").onclick = () => {
      currentPage = 1;
      fetchUsers();
    };
    pagControls.querySelector("#next-page-btn").onclick = () => {
      currentPage++;
      fetchUsers("next");
    };
  }

  // 9) Initial load
  fetchUsers();
}
