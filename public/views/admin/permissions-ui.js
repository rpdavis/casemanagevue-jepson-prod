// admin/permissions-ui.js
console.log("admin/permissions-ui.js");
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { VALID_ROLES, PERMISSION_ACTIONS } from "./permissions-model.js";

// Actions and labels
const ACTION_LIST = [
  PERMISSION_ACTIONS.VIEW_USERS,
  PERMISSION_ACTIONS.EDIT_USER,
  PERMISSION_ACTIONS.DELETE_USER,
  PERMISSION_ACTIONS.MANAGE_SUBJECTS,
  PERMISSION_ACTIONS.MANAGE_ROLES,
];

const ACTION_LABELS = {
  [PERMISSION_ACTIONS.VIEW_USERS]: "View Users",
  [PERMISSION_ACTIONS.EDIT_USER]: "Edit User",
  [PERMISSION_ACTIONS.DELETE_USER]: "Delete User",
  [PERMISSION_ACTIONS.MANAGE_SUBJECTS]: "Manage Subjects",
  [PERMISSION_ACTIONS.MANAGE_ROLES]: "Manage Roles",
};

/**
 * Render the permissions matrix UI into the given container element.
 * @param {HTMLElement} container
 */
export async function showPermissionsMatrix(container) {
  const db = getFirestore();
  const MATRIX_DOC_PATH = "config/permissions_matrix";
  let matrix = await loadPermissionsMatrix(db, MATRIX_DOC_PATH);

  // Render table
  container.innerHTML = `
    <h3>Role Permissions Matrix</h3>
    <table class="permissions-table-admin" style="margin-bottom:12px;">
      <thead>
        <tr>
          <th style="min-width:120px;">Role</th>
          ${ACTION_LIST.map(action =>
            `<th style="min-width:110px;">${ACTION_LABELS[action]}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody id="permissions-matrix-body">
        ${VALID_ROLES.map(role =>
          `<tr>
            <td style="font-weight:bold;">${role}</td>
            ${ACTION_LIST.map(action =>
              `<td style="text-align:center;">
                <input type="checkbox"
                  data-role="${role}"
                  data-action="${action}"
                  ${matrix[role]?.includes(action) ? "checked" : ""}>
              </td>`
            ).join('')}
          </tr>`
        ).join('')}
      </tbody>
    </table>
    <button id="save-permissions-matrix-btn" style="padding:0.5em 1.4em;font-size:1.08em;">Save</button>
    <span id="perm-matrix-status" style="margin-left:1em;font-size:1em;"></span>
  `;

  // Save changes handler
  container.querySelector('#save-permissions-matrix-btn').onclick = async () => {
    // Build new matrix from UI
    const newMatrix = {};
    VALID_ROLES.forEach(role => newMatrix[role] = []);
    container.querySelectorAll('input[type="checkbox"][data-role]').forEach(cb => {
      if (cb.checked) newMatrix[cb.dataset.role].push(cb.dataset.action);
    });
    // Save to Firestore
    try {
      await setDoc(doc(db, MATRIX_DOC_PATH), newMatrix);
      matrix = newMatrix; // update local
      showMatrixStatus("✅ Permissions updated.", false);
    } catch (e) {
      showMatrixStatus("❌ Error saving: " + e.message, true);
    }
  };

  function showMatrixStatus(msg, isError) {
    const el = container.querySelector('#perm-matrix-status');
    el.textContent = msg;
    el.style.color = isError ? "#b42c2c" : "#267838";
  }
}

/**
 * Loads the permissions matrix from Firestore.
 * @param {Firestore} db
 * @param {string} docPath
 * @returns {Promise<Object>} The matrix object: { [role]: [actions] }
 */
async function loadPermissionsMatrix(db, docPath) {
  try {
    const snap = await getDoc(doc(db, docPath));
    if (snap.exists()) return snap.data();
  } catch (err) {
    // ignore, fallback to default
  }
  // Fallback: default matrix (view-only for all except ADMIN)
  const matrix = {};
  const ACTION_LIST = [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.MANAGE_SUBJECTS,
    PERMISSION_ACTIONS.MANAGE_ROLES,
  ];
  VALID_ROLES.forEach(role => matrix[role] = role === "ADMIN" ? ACTION_LIST.slice() : [PERMISSION_ACTIONS.VIEW_USERS]);
  return matrix;
}