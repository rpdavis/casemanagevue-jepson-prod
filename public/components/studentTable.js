import { canEditStudent } from "../firebase/roles.js";
import { showStudentEmailDialog } from "./studentEmailDialog.js";

/**
 * Renders the student table.
 * @param {HTMLElement} container
 * @param {Array} students
 * @param {Object} userMap
 * @param {Object} currentUser
 * @param {Function} onEditClick
 */
export function renderStudentTable(container, students, userMap, currentUser, onEditClick) {
  const table = document.createElement("table");
  table.className = "students-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Student</th>
        <th>Services</th>
        <th>Case Manager</th>
        <th>Schedule</th>
        <th>Instruction</th>
        <th>Assessment</th>
        <th>Docs</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${students.map(student => {
        const studentInfo = `${student.last_name}, ${student.first_name}`;
        const scheduleList = (student.schedule ? Object.entries(student.schedule).map(([period, teacherId]) =>
          `<li>${period}: ${userMap[teacherId]?.initials || teacherId}</li>`
        ).join("") : "—");
        const docs = (student.docs ? student.docs.map(doc =>
          `<a href="${doc.url}" target="_blank">${doc.name}</a>`
        ).join(", ") : "");

        let cmInitials = "";
        if (student.casemanager_id && userMap[student.casemanager_id])
          cmInitials = userMap[student.casemanager_id].initials;

        const serviceList = [];
        if (student.mh_id) serviceList.push(`MH (${userMap[student.mh_id]?.initials || "?"})`);
        if (student.ot_id) serviceList.push(`OT (${userMap[student.ot_id]?.initials || "?"})`);
        (student.services || []).forEach(s => serviceList.push(s));

        const instructionHTML = `<td class="instruction-cell ${student.flag1 ? 'with-flag' : ''}">
          ${student.flag1 ? `<div class="flag-overlay flag-preferential-seating">Preferential Seating</div>` : ""}
          ${formatListFromText(student.instruction)}</td>`;

        const assessmentHTML = `<td class="instruction-cell ${student.flag2 ? 'with-flag' : ''}">
          ${student.flag2 ? `<div class="flag-overlay flag-separate-setting">Separate setting</div>` : ""}
          ${formatListFromText(student.assessment)}</td>`;

        return `
          <tr>
            <td>${studentInfo}</td>
            <td><ul>${serviceList.map(s => `<li>${s}</li>`).join("")}</ul></td>
            <td>${cmInitials}</td>
            <td><ul>${scheduleList}</ul></td>
            ${instructionHTML}
            ${assessmentHTML}
            <td>${docs || "—"}</td>
            <td>
              ${canEditStudent(student, currentUser)
                ? `
                  <button class="edit-btn" data-id="${student.id}">Edit</button>
                  <button class="email-btn" data-id="${student.id}" style="display:block;margin-top:6px;">Email</button>
                  <button class="teacher-feedback-btn" data-id="${student.id}" style="display:block;margin-top:6px;">Teacher Feedback</button>
                `
                : ""}
            </td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;

  container.innerHTML = "";
  container.appendChild(table);

  // Edit button event
  container.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", () => onEditClick(button.dataset.id));
  });

  // Email button event
  container.querySelectorAll(".email-btn").forEach(button => {
    button.addEventListener("click", () => showStudentEmailDialog(button.dataset.id));
  });

  // Teacher Feedback button event (placeholder)
  container.querySelectorAll(".teacher-feedback-btn").forEach(button => {
    button.addEventListener("click", () => alert("Teacher Feedback: Coming soon!"));
  });
}

export function renderByClassView(container, filteredStudents, userMap, selectedTeacherId, onEditClick) {
  container.innerHTML = "";
  const periods = {};

  filteredStudents.forEach(student => {
    Object.entries(student.schedule || {}).forEach(([period, teacherId]) => {
      if (teacherId !== selectedTeacherId) return;
      const key = period === "SH" ? "SH" : `P${period}`;
      if (!periods[key]) periods[key] = [];
      periods[key].push({ ...student, teacherInitials: userMap[teacherId]?.initials || teacherId });
    });
  });

  const sortedPeriods = Object.keys(periods).sort((a, b) => (a === "SH" ? 1 : b === "SH" ? -1 : a.localeCompare(b)));
  if (sortedPeriods.length === 0) {
    container.innerHTML = `<div class="no-results">⚠️ No students scheduled in any class periods.</div>`;
    return;
  }

  sortedPeriods.forEach(period => {
    const section = document.createElement("section");
    section.innerHTML = `<h2>${period}</h2>`;

    const subContainer = document.createElement("div");
    renderStudentTable(subContainer, periods[period], userMap, { id: selectedTeacherId }, onEditClick);
    section.appendChild(subContainer);
    container.appendChild(section);
  });
}

function formatListFromText(text) {
  if (!text) return "<div>—</div>";
  return `<ul class="bullet-list">` +
    text.split(/\n|\r|\d+\.\s+|\-\s+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(item => `<li>${item}</li>`)
      .join("") +
    `</ul>`;
}