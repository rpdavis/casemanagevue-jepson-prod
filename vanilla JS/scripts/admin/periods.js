// Admin: Manage class periods and times
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export function showPeriodsSection(main) {
  const db = getFirestore();
  const section = document.createElement("section");
  section.style.marginTop = "2rem";

  section.innerHTML = `
    <h2>Periods & Times</h2>
    <form id="period-form">
      <input type="hidden" id="period-id" />
      <div style="margin-bottom:0.7em;">
        <label>Name: <input type="text" id="period-name" required style="margin-left:0.5em;"/></label>
      </div>
      <div style="margin-bottom:0.7em;">
        <label>Start Time: <input type="time" id="period-start" required style="margin-left:0.5em;"/></label>
      </div>
      <div style="margin-bottom:0.7em;">
        <label>End Time: <input type="time" id="period-end" required style="margin-left:0.5em;"/></label>
      </div>
      <button type="submit" id="period-submit-btn">Add Period</button>
      <button type="button" id="period-cancel-btn" style="display:none;margin-left:0.7em;">Cancel</button>
    </form>
    <div id="period-status" style="margin:0.7em 0 0.7em 0;color:#267838;min-height:1.5em;"></div>
    <h3 style="margin-top:2em;">Existing Periods</h3>
    <table id="periods-table" style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;">Name</th>
          <th style="text-align:left;">Start</th>
          <th style="text-align:left;">End</th>
          <th style="text-align:left;">Actions</th>
        </tr>
      </thead>
      <tbody id="periods-list"><tr><td colspan="4">Loading…</td></tr></tbody>
    </table>
  `;

  main.appendChild(section);

  const form = section.querySelector("#period-form");
  const nameInput = section.querySelector("#period-name");
  const startInput = section.querySelector("#period-start");
  const endInput = section.querySelector("#period-end");
  const idInput = section.querySelector("#period-id");
  const submitBtn = section.querySelector("#period-submit-btn");
  const cancelBtn = section.querySelector("#period-cancel-btn");
  const statusDiv = section.querySelector("#period-status");
  const periodsList = section.querySelector("#periods-list");

  let editingId = null;

  // Load and render all periods
  async function renderPeriods() {
    periodsList.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
    const periodsCol = collection(db, "periods");
    const snapshot = await getDocs(periodsCol);
    const periods = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      periods.push({ id: docSnap.id, ...data });
    });
    if (!periods.length) {
      periodsList.innerHTML = `<tr><td colspan="4">No periods defined.</td></tr>`;
      return;
    }
    periodsList.innerHTML = "";
    for (const period of periods) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${period.name}</td>
        <td>${period.start}</td>
        <td>${period.end}</td>
        <td>
          <button type="button" class="edit-period" data-id="${period.id}">Edit</button>
          <button type="button" class="delete-period" data-id="${period.id}" style="margin-left:0.7em;">Delete</button>
        </td>
      `;
      periodsList.appendChild(tr);
    }
  }

  // Add or update period
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const start = startInput.value;
    const end = endInput.value;
    if (!name || !start || !end) {
      statusDiv.textContent = "All fields are required.";
      statusDiv.style.color = "#b42c2c";
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, "periods", editingId), { name, start, end });
        statusDiv.textContent = "Period updated.";
      } else {
        await addDoc(collection(db, "periods"), { name, start, end });
        statusDiv.textContent = "Period added.";
      }
      statusDiv.style.color = "#267838";
      form.reset();
      editingId = null;
      submitBtn.textContent = "Add Period";
      cancelBtn.style.display = "none";
      await renderPeriods();
    } catch (err) {
      statusDiv.textContent = "Error: " + err.message;
      statusDiv.style.color = "#b42c2c";
    }
  };

  // Row edit/delete
  periodsList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-period")) {
      const id = e.target.getAttribute("data-id");
      const periodsCol = collection(db, "periods");
      const snapshot = await getDocs(periodsCol);
      let found = null;
      snapshot.forEach(docSnap => {
        if (docSnap.id === id) found = docSnap.data();
      });
      if (found) {
        editingId = id;
        idInput.value = id;
        nameInput.value = found.name;
        startInput.value = found.start;
        endInput.value = found.end;
        submitBtn.textContent = "Save Changes";
        cancelBtn.style.display = "";
        statusDiv.textContent = "";
      }
    }
    if (e.target.classList.contains("delete-period")) {
      const id = e.target.getAttribute("data-id");
      if (confirm("Delete this period?")) {
        await deleteDoc(doc(db, "periods", id));
        await renderPeriods();
      }
    }
  });

  // Cancel editing
  cancelBtn.onclick = () => {
    editingId = null;
    idInput.value = "";
    form.reset();
    submitBtn.textContent = "Add Period";
    cancelBtn.style.display = "none";
    statusDiv.textContent = "";
  };

  renderPeriods();
}