// components/studentTable.js

import { canEditStudent } from "../../config/roles.js";
import { showStudentEmailDialog } from "./studentEmailDialog.js";
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  }

/**
 * Parse an ISO “YYYY-MM-DD” string as local midnight.
 */
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns a CSS class based on how soon `dateStr` is.
 * @param {string|null} dateStr — ISO date string
 * @returns {string} one of "flag-critical", "flag-high", …, or "" if no date
 */
//  function getDateUrgencyColor(dateStr) {
//    if (!dateStr) return "";
//    const today = new Date();
//    const target = parseLocalDate(dateStr);
//   const daysDiff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
//   if (daysDiff <= 0)  return "flag-critical";
//   if (daysDiff <= 7)  return "flag-high";
//   if (daysDiff <= 14) return "flag-medium";
//   if (daysDiff <= 21) return "flag-mid";
//   if (daysDiff <= 28) return "flag-low";
//   return "";
// }
function getDateUrgencyColor(dateStr) {
  if (!dateStr) return "";
  const today = new Date();
  const target = parseLocalDate(dateStr);
  const daysDiff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 0)  return "flag-critical";
  if (daysDiff <= 7)  return "flag-high";
  if (daysDiff <= 14) return "flag-medium";
  if (daysDiff <= 21) return "flag-mid";
  if (daysDiff <= 28) return "flag-low";
  if (daysDiff <= 35) return "flag-prep";
  if (daysDiff <= 60) return "flag-prep-reeval";
  return "";
}

/** Urgency for the next IEP **meeting** date */
export function getMeetingUrgencyColor(student) {
  return getDateUrgencyColor(student.meeting_date);
}

/** Urgency for the **plan‐review** date */
export function getReviewUrgencyColor(student) {
  return getDateUrgencyColor(student.review_date);
}

/** Urgency for the **reevaluation** date */
export function getReevalUrgencyColor(student) {
  return getDateUrgencyColor(student.reeval_date);
}



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
        <th class="print">Student Info</th>
        <th class="print">Services</th>
        
        <th class="print">Schedule</th>
        <th class="print">Instruction Accom.</th>
        <th class="print">Assessment Accom.</th>
        <th class="print">Docs</th>
        <th class="print">Actions</th>
      </tr>
    </thead>
    <tbody>
      ${students.map(student => {
        const name = `${student.first_name} ${student.last_name}`;
        const review = formatDate(student.review_date);
        const reeval = formatDate(student.reeval_date);
        const cmInitials = userMap[student.casemanager_id]?.initials || "—";
        // const urgencyClass = getMeetingUrgencyColor(student);
        const meetingClass = getMeetingUrgencyColor(student);
        const reviewClass  = getReviewUrgencyColor(student);
        const reevalClass  = getReevalUrgencyColor(student);

      const studentInfo = `
          <div class="student-name"><strong>${name}</strong></div>
         <div class="std-info-subheading"> <div>Grd: ${student.grade || "—"} | Prg: ${student.plan || "—"}</div>
<div>CM: ${cmInitials}</div></div>
          <div class="student-dates print">
            <span id="plan-review" class="badge badge-review ${reviewClass}">PR: ${review}</span>
            
            
            <span id="reeval-due" class="badge badge-reeval ${reevalClass}">RE: ${reeval}</span>
            
            <span id="meeting-date" class="badge badge-meeting ${meetingClass} ${student.meeting_date ? "date-set" : ""}">
            🗓 ${student.meeting_date ? formatDate(student.meeting_date) : "Not set"}
            </span>
          </div>
`;
        const scheduleList = Object.entries(student.schedule || {}).map(([p, t]) => {
          const label = p === "SH" ? "SH" : `P${p}`;
          return `<li>${label}: ${userMap[t]?.initials || t}</li>`;
        }).join("");

        // Build Docs column: At-a-Glance link and BIP link if available
        const docsItems = [];
        if (student.ataglance_pdf_url) {
          docsItems.push(`<div class="docs-item">📄 <a href="${student.ataglance_pdf_url}" target="_blank">At-A-Glance</a></div>`);
        }
        if (student.bip_pdf_url) {
          docsItems.push(`<div class="docs-item">📄 <a href="${student.bip_pdf_url}" target="_blank">BIP</a></div>`);
        }
        const docsHTML = docsItems.length ? docsItems.join("<br>") : "—";

        // const serviceList = [];
        // if (student.speech_id) serviceList.push(`SP (${userMap[student.speech_id]?.initials || "?"})`);
        // if (student.mh_id) serviceList.push(`MH (${userMap[student.mh_id]?.initials || "?"})`);
        // if (student.ot_id) serviceList.push(`OT (${userMap[student.ot_id]?.initials || "?"})`);
        // (student.services || []).forEach(s => serviceList.push(s));

        const relatedServices = [];
const classServices = [];

if (student.speech_id) relatedServices.push(`SP (${userMap[student.speech_id]?.initials || "?"})`);
if (student.mh_id) relatedServices.push(`MH (${userMap[student.mh_id]?.initials || "?"})`);
if (student.ot_id) relatedServices.push(`OT (${userMap[student.ot_id]?.initials || "?"})`);

(student.services || []).forEach(service => classServices.push(service));



        const instructionHTML = `<td class="instruction-cell ${student.flag1 ? 'with-flag' : ''}">
          ${student.flag1 ? `<div class="flag-overlay flag-preferential-seating">Preferential Seating</div>` : ""}
          ${formatListFromText(student.instruction)}
        </td>`;

        const assessmentHTML = `<td class="instruction-cell ${student.flag2 ? 'with-flag' : ''}">
          ${student.flag2 ? `<div class="flag-overlay flag-separate-setting">Separate setting</div>` : ""}
          ${formatListFromText(student.assessment)}
        </td>`;

        const actions = canEditStudent(student, currentUser)
          ? `
            <button class="edit-btn" data-id="${student.id}">✏️</button>
            <button class="email-btn" data-id="${student.id}" style="display:block;margin-top:6px;"> ✉️ </button>
            <button class="teacher-feedback-btn" data-id="${student.id}" style="display:block;margin-top:6px;">📝</button>
          `
          : "";

        return `
          <tr>
            <td>${studentInfo}</td>
           
            
 <td>
  ${classServices.length ? `<div><strong>Class Services:</strong> ${classServices.map(s => `<span class="service-pill">${s}</span>`).join("")}</div>` : ""}
  ${relatedServices.length ? `<div><strong>Related Services:</strong> ${relatedServices.map(s => `<span class="service-pill">${s}</span>`).join("")}</div>` : ""}
</td>


            <td><ul>${scheduleList}</ul></td>
            ${instructionHTML}
            ${assessmentHTML}
            <td>${docsHTML}</td>
            <td>${actions}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;

  container.innerHTML = "";
container.appendChild(table);


  // Attach button handlers
  container.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", () => onEditClick(btn.dataset.id)));
  container.querySelectorAll(".email-btn").forEach(btn => btn.addEventListener("click", () => showStudentEmailDialog(btn.dataset.id)));
  container.querySelectorAll(".teacher-feedback-btn").forEach(btn => btn.addEventListener("click", () => alert("Teacher Feedback: Coming soon!")));
}

/**
 * Renders students by class/period for a selected teacher.
 */
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
  if (!sortedPeriods.length) {
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

/**
 * Formats text into a bullet list.
 */
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
