import { db } from "../firebase/config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/**
 * Show the Email dialog for a student
 * @param {string} studentId - Firestore student document ID
 */
export async function showStudentEmailDialog(studentId) {
  function create(tag, className = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  // ---- Fetch student ----
  const studentSnap = await getDoc(doc(db, "students", studentId));
  if (!studentSnap.exists()) {
    alert("Student not found");
    return;
  }
  const student = studentSnap.data();

  // ---- Gather teachers from schedule ----
  const teacherIds = student.schedule ? Object.values(student.schedule) : [];
  const uniqueTeacherIds = [...new Set(teacherIds.filter(Boolean))];

  // ---- Gather service providers ----
  const serviceProviderIds = [];
  for (const key of Object.keys(student)) {
    if (
      key.endsWith("_id") &&
      !["casemanager_id"].includes(key) &&
      student[key]
    ) {
      serviceProviderIds.push(student[key]);
    }
  }
  const serviceProviderIdsOnly = serviceProviderIds.filter(
    id => !uniqueTeacherIds.includes(id)
  );

  // ---- Fetch all involved users ----
  const allUserIds = [...uniqueTeacherIds, ...serviceProviderIdsOnly];
  const uniqAllUserIds = [...new Set(allUserIds)];
  const userSnaps = await Promise.all(
    uniqAllUserIds.map(id => getDoc(doc(db, "users", id)))
  );
  const userMap = {};
  userSnaps.forEach(snap => {
    if (snap.exists()) userMap[snap.id] = snap.data();
  });

  // Build lists of teachers and service providers with name/email
  const teachers = uniqueTeacherIds
    .map(id => ({ id, ...userMap[id] }))
    .filter(u => u && u.email);
  const serviceProviders = serviceProviderIdsOnly
    .map(id => ({ id, ...userMap[id] }))
    .filter(u => u && u.email);

  // ---- State ----
  let sendTo = null;
  let checkedMembers = [];

  // ---- Build dialog ----
  const overlay = create("div", "email-dialog-overlay");
  const dialog = create("div", "email-dialog");
  overlay.appendChild(dialog);

  function closeDialog() {
    overlay.remove();
  }

  function clearDialog() {
    dialog.innerHTML = "";
  }

  function renderDialog() {
    clearDialog();
    const title = create("h2");
    title.textContent = "Send Email To:";
    dialog.appendChild(title);

    const form = create("form");
    form.onsubmit = e => e.preventDefault(); // Prevent submit/reload!
    form.innerHTML = `
      <label><input type="radio" name="sendTo" value="Teachers"> Teachers</label><br>
      <label><input type="radio" name="sendTo" value="TeachersAndService"> Teachers and service providers</label><br>
      <label><input type="radio" name="sendTo" value="Individual"> Individual member of the IEP team</label>
    `;
    dialog.appendChild(form);

    // Show checkboxes if 'Individual' is selected
    const membersDiv = create("div", "members-list");
    form.appendChild(membersDiv);

    function renderMembers() {
      membersDiv.innerHTML = "";
      if (form.elements.sendTo.value === "Individual") {
        membersDiv.appendChild(document.createTextNode("Select members:"));
        [...teachers, ...serviceProviders].forEach(p => {
          const id = "member-" + p.id;
          const label = create("label");
          label.htmlFor = id;
          label.style.display = "block";
          const checkbox = create("input");
          checkbox.type = "checkbox";
          checkbox.id = id;
          checkbox.value = p.id;
          if (checkedMembers.includes(p.id)) checkbox.checked = true;
          checkbox.onchange = () => {
            if (checkbox.checked) checkedMembers.push(p.id);
            else checkedMembers = checkedMembers.filter(x => x !== p.id);
            sendBtn.disabled =
              !form.elements.sendTo.value ||
              (form.elements.sendTo.value === "Individual" && checkedMembers.length === 0);
          };
          label.appendChild(checkbox);
          label.appendChild(
            document.createTextNode(
              " " +
                (p.name || p.displayName || p.email || p.id) +
                (p.email ? ` (${p.email})` : "")
            )
          );
          membersDiv.appendChild(label);
        });
      }
    }

    // Preselect if already chosen
    if (sendTo) {
      form.elements.sendTo.value = sendTo;
      renderMembers();
    }

    const actions = create("div", "dialog-actions");
    const cancelBtn = create("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.type = "button";
    cancelBtn.onclick = e => {
      e.preventDefault();
      closeDialog();
    };

    const sendBtn = create("button");
    sendBtn.textContent = "Send Email";
    sendBtn.type = "button";
    sendBtn.disabled =
      !form.elements.sendTo.value ||
      (form.elements.sendTo.value === "Individual" && checkedMembers.length === 0);

    actions.append(cancelBtn, sendBtn);
    dialog.appendChild(actions);

    form.onchange = () => {
      renderMembers();
      sendBtn.disabled =
        !form.elements.sendTo.value ||
        (form.elements.sendTo.value === "Individual" && checkedMembers.length === 0);
    };

    sendBtn.onclick = e => {
      e.preventDefault();
      sendTo = form.elements.sendTo.value;
      let recipients = [];
      if (sendTo === "Teachers") recipients = teachers;
      else if (sendTo === "TeachersAndService")
        recipients = [...teachers, ...serviceProviders];
      else if (sendTo === "Individual")
        recipients = [...teachers, ...serviceProviders].filter(p =>
          checkedMembers.includes(p.id)
        );
      const emails = recipients.map(p => p.email).filter(Boolean).join(",");
      if (!emails) {
        alert("No email addresses found for the selected recipients.");
        return;
      }
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        emails
      )}&su=Student%20Update&body=See%20attached.`;
      window.open(gmailUrl, "_blank", "noopener");
      closeDialog();
    };

    renderMembers();
  }

  // ---- Insert dialog into DOM and show ----
  document.body.appendChild(overlay);
  if (!document.getElementById("email-dialog-style")) {
    const style = document.createElement("style");
    style.id = "email-dialog-style";
    style.textContent = `
      .email-dialog-overlay {
        position: fixed; left:0; top:0; width:100vw; height:100vh;
        background: rgba(0,0,0,0.3); z-index: 1000; display: flex; align-items: center; justify-content: center;
      }
      .email-dialog {
        background: #fff; border-radius: 8px; padding: 24px; min-width: 300px; max-width: 90vw;
        box-shadow: 0 4px 24px rgba(0,0,0,0.2); position: relative;
      }
      .email-dialog h2 { margin-top:0; }
      .dialog-actions { margin-top: 24px; display: flex; gap: 12px; }
      .members-list { margin: 12px 0; }
    `;
    document.head.appendChild(style);
  }

  renderDialog();
}