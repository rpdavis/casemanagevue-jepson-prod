// scripts/students/components/studentTable/renderers.js
import { getDisplayValue, getSourceValue,labelize } from "../../../utils/studentUtils.js";
import { getMeetingUrgencyColor, getReviewUrgencyColor, getReevalUrgencyColor, formatListFromText } from "./helpers.js";
import { canEditStudent } from "../../../config/roles.js";
import { showStudentEmailDialog } from "./studentEmailDialog.js";

/** 1. Info cell */
export function renderInfoCell(student, userMap) {
  const first   = getDisplayValue(student, "first_name");
  const last    = getDisplayValue(student, "last_name");
  const name    = `${first} ${last}`;
  const grade   = getDisplayValue(student, "grade");
  const plan    = getDisplayValue(student, "plan");
  const cmInit  = userMap[student.casemanager_id]?.initials || "—";
  const meeting = getDisplayValue(student, "meeting_date", "Not set");
  const review  = getDisplayValue(student, "review_date");
  const reeval  = getDisplayValue(student, "reeval_date");

  const mClass = getMeetingUrgencyColor(student);
  const rClass = getReviewUrgencyColor(student);
  const eClass = getReevalUrgencyColor(student);

  return `
    <td>
      <div class="student-name"><strong>${name}</strong></div>
      <div class="std-info-subheading">
        <div>Grd: ${grade} | Prg: ${plan}</div>
        <div>CM: ${cmInit}</div>
      </div>
      <div class="student-dates print">
        <span class="badge badge-review ${rClass}">PR: ${review}</span>
        <span class="badge badge-reeval ${eClass}">RE: ${reeval}</span>
        <span class="badge badge-meeting ${mClass} ${meeting !== "Not set" ? "date-set" : ""}">
          🗓 ${meeting}
        </span>
      </div>
    </td>
  `;
}

/** 2. Services cell */
export function renderServicesCell(student, userMap) {
  const related = [];
  if (student.speech_id) related.push(`SP (${userMap[student.speech_id]?.initials || "?"})`);
  if (student.mh_id)     related.push(`MH (${userMap[student.mh_id]?.initials || "?"})`);
  if (student.ot_id)     related.push(`OT (${userMap[student.ot_id]?.initials || "?"})`);
  const classSvcs = student.services || [];

  let html = "";
  if (classSvcs.length) html += `<div><strong>Class Services:</strong> ${classSvcs.map(s => `<span class="service-pill">${s}</span>`).join("")}</div>`;
  if (related.length)  html += `<div><strong>Related Services:</strong> ${related.map(s => `<span class="service-pill">${s}</span>`).join("")}</div>`;

  return `<td>${html || "—"}</td>`;
}

/** 3. Schedule cell */
export function renderScheduleCell(student, userMap) {
  const items = Object.entries(student.schedule || {})
    .map(([p, t]) => `<li>${p === "SH" ? "SH" : `P${p}`}: ${userMap[t]?.initials || t}</li>`)
    .join("");
  return `<td><ul>${items}</ul></td>`;
}

/** 4. Instruction cell */
export function renderInstructionCell(student) {
  return `<td class="instruction-cell ${student.flag1 ? "with-flag" : ""}">` +
         (student.flag1 ? `<div class="flag-overlay flag-preferential-seating">Preferential Seating</div>` : "") +
         formatListFromText(student.instruction) + `</td>`;
}

/** 5. Assessment cell */
export function renderAssessmentCell(student) {
  return `<td class="instruction-cell ${student.flag2 ? "with-flag" : ""}">` +
         (student.flag2 ? `<div class="flag-overlay flag-separate-setting">Separate setting</div>` : "") +
         formatListFromText(student.assessment) + `</td>`;
}

/** 6. Docs cell */
export function renderDocsCell(student) {
  const items = [];
  if (student.ataglance_pdf_url) items.push(`📄 <a href="${student.ataglance_pdf_url}" target="_blank">At-A-Glance</a>`);
  if (student.bip_pdf_url)      items.push(`📄 <a href="${student.bip_pdf_url}" target="_blank">BIP</a>`);
  const html = items.map(i => `<div class="docs-item">${i}</div>`).join("");
  return `<td>${html || "—"}</td>`;
}

/** 7. Actions cell */
export function renderActionsCell(student, currentUser, onEditClick) {
  if (!canEditStudent(student, currentUser)) return `<td>—</td>`;
  return `<td>
    <button class="edit-btn" data-id="${student.id}">✏️</button>
    <button class="email-btn" data-id="${student.id}">✉️</button>
    <button class="teacher-feedback-btn" data-id="${student.id}">📝</button>
  </td>`;
}
