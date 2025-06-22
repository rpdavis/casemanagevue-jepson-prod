// scripts/students/components/studentTable/index.js

import { renderInfoCell, renderServicesCell, renderScheduleCell,
         renderInstructionCell, renderAssessmentCell,
         renderDocsCell, renderActionsCell } from "./renderers.js";
import { showStudentEmailDialog } from "./studentEmailDialog.js";

/**
 * Renders a table of students into the container.
 * @param {HTMLElement} container
 * @param {Array<Object>} students
 * @param {Object} userMap
 * @param {Object} currentUser
 * @param {Function} onEditClick
 */
export function renderStudentTable(container, students, userMap, currentUser, onEditClick) {
  container.innerHTML = "";
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

  students.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML =
      renderInfoCell(student, userMap) +
      renderServicesCell(student, userMap) +
      renderScheduleCell(student, userMap) +
      renderInstructionCell(student) +
      renderAssessmentCell(student) +
      renderDocsCell(student) +
      renderActionsCell(student, currentUser, onEditClick);
    tbody.appendChild(row);
  });

  container.appendChild(table);

  tbody.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => onEditClick(btn.dataset.id))
  );
  tbody.querySelectorAll(".email-btn").forEach(btn =>
    btn.addEventListener("click", () => showStudentEmailDialog(btn.dataset.id))
  );
  tbody.querySelectorAll(".teacher-feedback-btn").forEach(btn =>
    btn.addEventListener("click", () => alert("Teacher Feedback: Coming soon!"))
  );
}
/**
 * Renders students grouped by class/period for a selected teacher.
 */
export function renderByClassView(container, filteredStudents, userMap, selectedTeacherId, onEditClick) {
  container.innerHTML = "";
  const periods = {};
  filteredStudents.forEach(student => {
    Object.entries(student.schedule||{}).forEach(([period, teacherId]) => {
      if (teacherId !== selectedTeacherId) return;
      const key = period === "SH" ? "SH" : `P${period}`;
      periods[key] = periods[key] || [];
      periods[key].push({ ...student });
    });
  });

  const keys = Object.keys(periods).sort((a,b)=>(a==="SH"?1:(b==="SH"?-1:a.localeCompare(b))));
  if (!keys.length) {
    container.innerHTML = `<div class="no-results">⚠️ No students scheduled.</div>`;
    return;
  }
  keys.forEach(period => {
    const section = document.createElement("section");
    section.innerHTML = `<h2>${period}</h2>`;
    const sub = document.createElement("div");
    renderStudentTable(sub, periods[period], userMap, {id:selectedTeacherId}, onEditClick);
    section.appendChild(sub);
    container.appendChild(section);
  });
}

export function renderByCaseManagerView(
  container,
  students,
  userMap,
  currentUser,
  onEditClick
) {
  container.innerHTML = "";

  // Group by CM
  const groups = students.reduce((acc, s) => {
    (acc[s.casemanager_id] = acc[s.casemanager_id] || []).push(s);
    return acc;
  }, {});

  // For each CM, render a section
  Object.entries(groups).forEach(([cmId, cmStudents]) => {
    const section = document.createElement("section");
    const cmName = userMap[cmId]?.initials || userMap[cmId]?.fullName || cmId;
    section.innerHTML = `<h2>Case Manager: ${cmName}</h2>`;

    const subContainer = document.createElement("div");
    renderStudentTable(
      subContainer,
      cmStudents,
      userMap,
      currentUser,
      onEditClick
    );

    section.appendChild(subContainer);
    container.appendChild(section);
  });
}
