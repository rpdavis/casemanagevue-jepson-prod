import {
  getFirestore,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { auth } from "../../config/config.js";
import { uploadFile } from "../../config/storage.js";

export async function loadUserRoles(db) {
  const snapshot = await getDocs(collection(db, "users"));
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {

    teachers: users.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role)),


    caseManagers: users.filter(u => ["case_manager", "sped_chair", "administrator_504_CM"].includes(u.role)),



    speech: users.filter(u => /speech|slp/i.test(u.title || "")),
    ot: users.filter(u => /ot|occupational/i.test(u.title || "")),
    mh: users.filter(u => /mental|counselor|therapist/i.test(u.title || ""))
  };
}



export function renderStudentForm(student = {}, users, mode = "new") {
  const periods = ["1", "2", "3", "4", "5", "6", "SH"];
  const teacherOptions = (selected = "") =>
    users.teachers.map(t =>
      `<option value="${t.id}" ${selected === t.id ? "selected" : ""}>${t.name || t.email || t.id}</option>`
    ).join("");




  const serviceSelect = (id, list, label) => `
    <label>${label}: 
      <select id="${id}">
        <option value="">--</option>
        ${list.map(p => `<option value="${p.id}" ${p.id === student[`${id}_id`] ? "selected" : ""}>${p.name}</option>`).join("")}
      </select>
    </label>`;

  const serviceCheckboxGroup = (label, items) => `
    <fieldset>
      <legend>${label}</legend>
      <div class="checkbox-inline-group">
        ${items.map(val => {
          const checked = (student.services || []).includes(`${label}: ${val}`);
          return `<label><input type="checkbox" class="service-check" value="${label}: ${val}" ${checked ? "checked" : ""}> ${val}</label>`;
        }).join("")}
      </div>
    </fieldset>`;

  return `
    <form id="student-form">
      <fieldset class="form-col">
        <legend>Student Info</legend>
        <div class="inner-grid-3">
          <label>First Name: <input type="text" id="first" value="${student.first_name || ""}" required></label>
          <label>Last Name: <input type="text" id="last" value="${student.last_name || ""}" required></label>
          <label>Grade:
            <select id="grade">
              <option value="7" ${student.grade == 7 ? "selected" : ""}>7</option>
              <option value="8" ${student.grade == 8 ? "selected" : ""}>8</option>
            </select>
          </label>
          <label>Plan Type:
            <select id="plan">
              <option value="IEP" ${student.plan === "IEP" ? "selected" : ""}>IEP</option>
              <option value="504" ${student.plan === "504" ? "selected" : ""}>504</option>
            </select>

          </label>
          <label>Review Date: <input type="date" id="review" value="${student.review_date || ""}"></label>
          <label>Reevaluation Date: <input type="date" id="reeval" value="${student.reeval_date || ""}"></label>
          <label>Meeting Date: <input type="date" id="meet-date" value="${student.meeting_date || ""}"></label>
          <label>Case Manager:
            <select id="cm">
              ${users.caseManagers.map(cm => `<option value="${cm.id}" ${cm.id === student.casemanager_id ? "selected" : ""}>${cm.name}</option>`).join("")}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset class="form-col">
        <legend>Schedule</legend>
        <div class="inner-grid-3">
          ${periods.map(p => `
            <label>Period ${p}:
              <select class="sched" data-period="${p}">
                <option value="">--</option>
                ${teacherOptions(student.schedule?.[p])}
              </select>
            </label>
          `).join("")}
        </div>
      </fieldset>
        
      <fieldset class="form-col">
        <legend>Services: classes</legend>
        <div class="inner-grid-3">
          ${serviceCheckboxGroup("Co-teach", ["English", "Math"])}
          ${serviceCheckboxGroup("RSP", ["English", "Math"])}
          ${serviceCheckboxGroup("SDC", ["English", "Math", "History", "Science"])}
          ${serviceCheckboxGroup("FA", [""])}
        </div>
      </fieldset>

      <fieldset>
        <legend>Services: providers</legend>
        <div class="inner-grid-3">
          ${serviceSelect("speech", users.speech, "Speech Provider")}
          ${serviceSelect("ot", users.ot, "OT Provider")}
          ${serviceSelect("mh", users.mh, "Mental Health Provider")}
          <input type="text" id="other-input" value="${(student.services || []).find(s => !s.includes(":")) || ""}" placeholder="Other service...">
          <input type="text" id="other-input2" value="${(student.services || []).find(s => !s.includes(":")) || ""}" placeholder="Other service...">
          <input type="text" id="other-input3" value="${(student.services || []).find(s => !s.includes(":")) || ""}" placeholder="Other service...">
        </div>
      </fieldset>

      <fieldset class="form-col">
        <legend>Documents</legend>
        <!-- BIP Upload & Actions -->
        <div class="document-section">
          <label for="bip-upload">BIP:</label>
          <div class="file-input-wrapper">
            <input type="file" id="bip-upload" accept="application/pdf">
            <div id="bip-file-status" class="file-status">
              ${mode === "edit" && student.bip_pdf_url ? `
                <span class="file-name">Current: <a href="${student.bip_pdf_url}" target="_blank">View BIP</a></span>
                <button type="button" class="delete-existing-file-btn" data-doc-type="bip" data-file-path="students/${student.id}/bip.pdf">🗑️</button>
              ` : `
                <span class="file-name">No file selected.</span>
                <button type="button" class="clear-staged-file-btn" data-input-id="bip-upload" style="display:none;">❌</button>
              `}
            </div>
          </div>
        </div>

        <!-- At-A-Glance Upload & Actions -->
        <div class="document-section">
          <label for="ataglance-upload">At-A-Glance PDF:</label>
          <div class="file-input-wrapper">
            <input type="file" id="ataglance-upload" accept="application/pdf">
            <div id="ataglance-file-status" class="file-status">
              ${mode === "edit" && student.ataglance_pdf_url ? `
                <span class="file-name">Current: <a href="${student.ataglance_pdf_url}" target="_blank">View At-A-Glance</a></span>
                <button type="button" class="delete-existing-file-btn" data-doc-type="ataglance" data-file-path="students/${student.id}/ataglance.pdf">🗑️</button>
              ` : `
                <span class="file-name">No file selected.</span>
                <button type="button" class="clear-staged-file-btn" data-input-id="ataglance-upload" style="display:none;">❌</button>
              `}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset class="form-col">
        <legend>Accommodations</legend>
        <div class="inner-grid-2">
          <label>Instruction:<textarea id="instruction">${student.instruction || ""}</textarea></label>
          <label>Assessment:<textarea id="assessment">${student.assessment || ""}</textarea></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Flags</legend>
        <div>
          <label><input type="checkbox" name="flag1" id="flag1" ${student.flag1 ? 'checked' : ''}> Separate setting</label>
          <label><input type="checkbox" name="flag2" id="flag2" ${student.flag2 ? 'checked' : ''}> Preferential seating</label>
        </div>
      </fieldset>

      ${mode === "new" ? `<button type="submit">Add Student</button>` : ``}
    </form>
  `;
}

export function collectStudentFormData(formElement) {
  const schedule = {};
  formElement.querySelectorAll(".sched").forEach(sel => {
    if (sel.value) schedule[sel.dataset.period] = sel.value;
  });

  // The file inputs will be handled dynamically with event listeners now,
  // so we'll collect the file objects directly in studentDialogEdit.js
  // and pass them separately to the save function.
  // These will now just represent the *current* selection, not necessarily files for upload.
  const bipInput = formElement.querySelector('#bip-upload');
  const bipFile = bipInput?.files?.[0] || null;

  const ataglanceInput = formElement.querySelector('#ataglance-upload');
  const atAGlanceFile = ataglanceInput?.files?.[0] || null;


  return {
    flag1: formElement.querySelector('[name="flag1"]').checked,
    flag2: formElement.querySelector('[name="flag2"]').checked,
    first_name: formElement.querySelector("#first").value.trim(),
    last_name: formElement.querySelector("#last").value.trim(),
    grade: formElement.querySelector("#grade").value,
    plan: formElement.querySelector("#plan").value,
    review_date: formElement.querySelector("#review").value,
    reeval_date: formElement.querySelector("#reeval").value,
    meeting_date: formElement.querySelector("#meet-date").value,
    casemanager_id: formElement.querySelector("#cm").value,
    speech_id: formElement.querySelector("#speech")?.value || null,
    ot_id: formElement.querySelector("#ot")?.value || null,
    mh_id: formElement.querySelector("#mh")?.value || null,
    schedule,
    services: [
      ...Array.from(formElement.querySelectorAll(".service-check"))
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      formElement.querySelector("#other-input")?.value.trim(),
      formElement.querySelector("#other-input2")?.value.trim(),
      formElement.querySelector("#other-input3")?.value.trim()
    ].filter(Boolean),
    instruction: formElement.querySelector("#instruction").value.trim(),
    assessment:  formElement.querySelector("#assessment").value.trim(),
    created_at: serverTimestamp(), 
    // bipFile and atAGlanceFile are still collected here, but their state management
    // (clearing, displaying selection) will be done in the parent component.
    bipFile,
    atAGlanceFile
  };
}
