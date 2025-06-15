// studentForm.js

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export async function loadUserRoles(db) {
  const snapshot = await getDocs(collection(db, "users"));
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    // Teachers include teacher, case_manager, and sped_chair
    teachers: users.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role)),

    // Case Managers include case_manager, sped_chair, and administrator_504_CM
    caseManagers: users.filter(u =>
      ["case_manager", "sped_chair", "administrator_504_CM"].includes(u.role)
    ),

    speech: users.filter(u => /speech|slp/i.test(u.title || "")),
    ot: users.filter(u => /ot|occupational/i.test(u.title || "")),
    mh: users.filter(u => /mental|counselor|therapist/i.test(u.title || ""))
  };
}



export function renderStudentForm(student = {}, users, mode = "new") {
  const periods = ["1", "2", "3", "4", "5", "6", "SH"];
const teacherOptions = (selected = "") =>
  users.teachers.map(t =>
    `<option value="${t.id}" ${selected === t.id ? "selected" : ""}>
      ${t.name || t.email || t.id}
    </option>`
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
    <form id="student-form" >
      <fieldset class="form-col">
    
        <legend>Student Info</legend><div class="inner-grid-3">
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
        `).join("")}</div>
      </fieldset>


<fieldset class="form-col">
        <legend>Services: classes</legend><div class="inner-grid-3">
        ${serviceCheckboxGroup("Co-teach", ["English", "Math"])}
        ${serviceCheckboxGroup("RSP", ["English", "Math"])}
        ${serviceCheckboxGroup("SDC", ["English", "Math", "History", "Science"])}
        ${serviceCheckboxGroup("FA", [""])}</div>
      </fieldset>

                  <fieldset class="">
        <legend>Services: providers</legend><div class="inner-grid-3">
        ${serviceSelect("speech", users.speech, "Speech Provider")}
        ${serviceSelect("ot", users.ot, "OT Provider")}
        ${serviceSelect("mh", users.mh, "Mental Health Provider")}
                <input type="text" id="other-input" value="${(student.services || []).find(s => !s.includes(":")) || ""}" placeholder="Other service...">
                        <input type="text" id="other-input2" value="${(student.services || []).find(s => !s.includes(":")) || ""}" placeholder="Other service...">
                        <input type="text" id="other-input3" value="${(student.services || []).find(s => !s.includes(":")) || ""}" placeholder="Other service...">
      </div> </fieldset> 

      


   <fieldset class="">
        <legend>Documents</legend><div class="inner-grid-3"><div>
        <label><input type="checkbox" id="bip-check" ${student.has_bip ? "checked" : ""}> BIP
        <input type="file" id="bip-upload" accept="application/pdf"></label></div><div>
        <label>At-A-Glance PDF: <input type="file" id="ataglance-upload" accept="application/pdf"></label>
      </div></fieldset>
   

      <fieldset class="form-col">
        <legend>Accommodations</legend><div class="inner-grid-2">
        <label>Instruction:<textarea id="instruction">${student.instruction || ""}</textarea></label>
        <label>Assessment:<textarea id="assessment">${student.assessment || ""}</textarea></label>
</fieldset>



<fieldset>
  <legend>Flags</legend>
  <div>
    <label><input type="checkbox" name="flag1" id="flag1"> Separate setting</label>
    <label><input type="checkbox" name="flag2" id="flag2"> Preferential seating</label>
  </div>
</fieldset>
         ${mode === "new" ? `<button type="submit">Add Student</button>` : ""}
     
    </form>
  `;
}



export function collectStudentFormData(formElement) {
  const schedule = {};
  formElement.querySelectorAll(".sched").forEach(sel => {
    if (sel.value) schedule[sel.dataset.period] = sel.value;
  });
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
    has_bip: formElement.querySelector("#bip-check").checked,
    instruction: formElement.querySelector("#instruction").value.trim(),
    assessment: formElement.querySelector("#assessment").value.trim(),
    services: [
      ...Array.from(formElement.querySelectorAll(".service-check"))
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      formElement.querySelector("#other-input")?.value.trim(),
      formElement.querySelector("#other-input2")?.value.trim(),
      formElement.querySelector("#other-input3")?.value.trim()
    ].filter(Boolean),
  };
}
