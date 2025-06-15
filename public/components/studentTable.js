// studentTable.js

import { canEditStudent } from "../firebase/roles.js";

export function renderStudentTable(container, students, userMap, currentUser, onEditClick) {
  const table = document.createElement("table");
  table.classList.add("students-table");

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  }

  function getMeetingUrgencyColor(student) {
    const today = new Date();
    const parseDate = str => str ? new Date(str) : null;
    const targetDate = parseDate(student.meeting_date) || parseDate(student.review_date) || parseDate(student.reeval_date);
    if (!targetDate) return "";
    const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 0) return "flag-critical";
    if (daysDiff <= 7) return "flag-high";
    if (daysDiff <= 14) return "flag-medium";
    if (daysDiff <= 21) return "flag-mid";
    if (daysDiff <= 28) return "flag-low";
    return "";
  }

  const sorted = [...students];

  table.innerHTML = `
    <thead>
      <tr>
        <th>Student Info</th>
        <th>Services</th>
        <th>CM</th>
        <th>Schedule</th>
        <th>Instruction Accom.</th>
        <th>Assessment Accom.</th>
        <th>Docs</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${sorted.map(student => {
        const name = `${student.first_name} ${student.last_name}`;
        const review = formatDate(student.review_date);
        const reeval = formatDate(student.reeval_date);
        const cmInitials = userMap[student.casemanager_id]?.initials || "—";
        const urgencyClass = getMeetingUrgencyColor(student);

        const studentInfo = `
          <div class="student-name ${urgencyClass}"><strong>${name}</strong></div>
          <div>Grade: ${student.grade}</div>
          <div>Program: ${student.plan}</div>
          <div>Plan Review: ${review}</div>
          <div>Reevaluations: ${reeval}</div>
        `;

        const scheduleList = Object.entries(student.schedule || {}).map(([p, t]) => {
          const label = p === "SH" ? "SH" : `P${p}`;
          return `<li>${label}: ${userMap[t]?.initials || t}</li>`;
        }).join("");

        const docs = [
          student.has_bip ? "BIP" : null,
          student.ataglance_pdf_url ? `<a href="${student.ataglance_pdf_url}" target="_blank">At-A-Glance</a>` : null
        ].filter(Boolean).join("<br>");

        const serviceList = [];
        if (student.speech_id) serviceList.push(`SP (${userMap[student.speech_id]?.initials || "?"})`);
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
            <td>${canEditStudent(student, currentUser)
              ? `<button class="edit-btn" data-id="${student.id}">Edit</button>` : ""}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;

  container.innerHTML = "";
  container.appendChild(table);

  container.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", () => onEditClick(button.dataset.id));
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
