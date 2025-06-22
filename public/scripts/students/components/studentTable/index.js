// scripts/students/components/studentTable/index.js
import {
  renderInfoCell,
  renderServicesCell,
  renderScheduleCell,
  renderInstructionCell,
  renderAssessmentCell,
  renderDocsCell,
  renderActionsCell
} from "./renderers.js";  // :contentReference[oaicite:4]{index=4}
import { showStudentEmailDialog } from "./studentEmailDialog.js";

/**
 * @typedef {Object} StudentTableOptions
 * @property {HTMLElement}   container
 * @property {Array<Object>} data
 * @property {Object}        userMap
 * @property {Object}        currentUser
 * @property {Function}      onEdit
 */

export class StudentTable {
  /**
   * @param {StudentTableOptions} opts
   */
  constructor({ container, data, userMap, currentUser, onEdit }) {
    this.container   = container;
    this.data        = data || [];
    this.userMap     = userMap;
    this.currentUser = currentUser;
    this.onEdit      = onEdit;
  }

  render() {
    this.container.innerHTML = "";
    const table = document.createElement("table");
    table.className = "students-table";

    table.innerHTML = `
      <thead>
        <tr>
          <th class="print">Student Info</th>
          <th class="print">Services</th>
          <th class="print">Schedule</th>
          <th class="print">Instruction Accom.</th>
          <th class="print">Assessment Accom.</th>
          <th class="print">Docs</th>
          <th class="print">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    this.data.forEach(student => {
      const row = document.createElement("tr");
      row.innerHTML =
        renderInfoCell(student, this.userMap) +
        renderServicesCell(student, this.userMap) +
        renderScheduleCell(student, this.userMap) +
        renderInstructionCell(student) +
        renderAssessmentCell(student) +
        renderDocsCell(student) +
        renderActionsCell(student, this.currentUser, this.onEdit);
      tbody.appendChild(row);
    });

    // wire up row buttons
    tbody.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", () => this.onEdit(btn.dataset.id))
    );
    tbody.querySelectorAll(".email-btn").forEach(btn =>
      btn.addEventListener("click", () => showStudentEmailDialog(btn.dataset.id))
    );
    tbody.querySelectorAll(".teacher-feedback-btn").forEach(btn =>
      btn.addEventListener("click", () => alert("Teacher Feedback: Coming soon!"))
    );

    this.container.appendChild(table);
  }

  update(data) {
    this.data = data;
    this.render();
  }
}