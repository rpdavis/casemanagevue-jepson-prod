// scripts/students/components/filters.js

export function renderFilters(caseManagers, currentUserRole, teachers = [], currentUserId = "") {
  const existing = document.getElementById("student-filters");
  if (existing) return existing;

  const wrapper = document.createElement("div");
  wrapper.id = "student-filters";

  const showTeacherFilter = ["admin", "administrator", "administrator_504"].includes(currentUserRole);
  const showProviderRadios = ["case_manager", "administrator_504_CM", "Sped Chair"].includes(currentUserRole);

  wrapper.innerHTML = `
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
      <select id="sort-by">
        <option value="first_name">First Name</option>
        <option value="last_name">Last Name</option>
        <option value="review_date">Plan Review</option>
        <option value="reeval_date">Reevaluation</option>
        <option value="meeting_date">Meeting Date</option>
      </select>

      <select id="filter-cm">
        <option value="all">All Case Managers</option>
        ${caseManagers.map(cm => `<option value="${cm.id}">${cm.initials}</option>`).join("")}
      </select>

      ${showTeacherFilter ? `
        <select id="filter-teacher">
          <option value="all">All Teachers</option>
          ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join("")}
        </select>` : ""}

      <select id="filter-service">
        <option value="all">All Services</option>
        <option value="speech">Speech</option>
        <option value="ot">OT</option>
        <option value="mental health">Mental Health</option>
      </select>

      <select id="filter-plan">
        <option value="all">All Programs</option>
        <option value="IEP">IEP</option>
        <option value="504">504</option>
      </select>

      <select id="filter-grade">
        <option value="all">All Grades</option>
        <option value="7">7th</option>
        <option value="8">8th</option>
      </select>

      <button id="clear-filters">Clear Filters</button>
    </div>
  `;

  return wrapper;
}

/**
 * @param {HTMLElement} filters — the filters container
 * @param {Array} students — all student records
 * @param {Object} user     — currentUser, with .role and .uid
 * @param {Function} renderListView    (filtered, sortBy) => void
 * @param {Function} renderClassView   (filtered, teacherId) => void
 * @param {Function} renderCmView      (filtered) => void
 */
export function setupFilterHandlers(filters, students, user,
                                    renderListView,
                                    renderClassView,
                                    renderCmView) {
  const nav = document.getElementById("nav");

  // Clean up any old controls
  document.querySelectorAll("#search-name, #toggle-filters-btn, .radio-row").forEach(el => el.remove());

  // --- Search Bar ---
  const searchInput = document.createElement("input");
  searchInput.id = "search-name";
  searchInput.type = "text";
  searchInput.placeholder = "Search students...";
  searchInput.style.marginLeft = "auto";
  searchInput.style.marginRight = "1rem";
  nav?.appendChild(searchInput);

  // --- Toggle Filters Button ---
  const toggleButton = document.createElement("button");
  toggleButton.id = "toggle-filters-btn";
  toggleButton.textContent = "Filters";
  toggleButton.style.marginBottom = "0.5rem";
  filters.parentElement?.insertBefore(toggleButton, filters);
  filters.style.display = "none";
  toggleButton.addEventListener("click", () => {
    filters.style.display = filters.style.display === "none" ? "flex" : "none";
  });

  // --- Radio Row ---
  const radioRow = document.createElement("div");
  radioRow.classList.add("radio-row");
  radioRow.style.display = "flex";
  radioRow.style.gap = "1rem";
  radioRow.style.margin = "0.5rem 1rem";
  radioRow.style.alignItems = "center";
  radioRow.style.justifyContent = "right";

  if (["case_manager", "administrator_504_CM", "Sped Chair"].includes(user.role)) {
    radioRow.innerHTML += `
      <label><input type="radio" name="provider-view" value="all" checked> Show All</label>
      <label><input type="radio" name="provider-view" value="case_manager"> Case Manager</label>
      <label><input type="radio" name="provider-view" value="service_provider"> Service Provider</label>
    `;
    radioRow.innerHTML += `<span>|</span>`;
  }

  // Add the 3 view-mode options: List / By Class / By Case Manager
  radioRow.innerHTML += `
    <label><input type="radio" name="view-mode" value="list" checked> List</label>
    <label><input type="radio" name="view-mode" value="class"> By Class</label>
    <label><input type="radio" name="view-mode" value="cm"> By Case Manager</label>
  `;

  nav?.insertAdjacentElement("afterend", radioRow);

  // --- Filtering Logic ---
  function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const cm         = filters.querySelector("#filter-cm")?.value;
    const teacherId  = filters.querySelector("#filter-teacher")?.value || "all";
    const plan       = filters.querySelector("#filter-plan").value;
    const grade      = filters.querySelector("#filter-grade").value;
    const svc        = filters.querySelector("#filter-service").value;
    const providerV  = document.querySelector('input[name="provider-view"]:checked')?.value || "all";
    const viewMode   = document.querySelector('input[name="view-mode"]:checked')?.value || "list";
    const sortBy     = filters.querySelector("#sort-by").value;

    // Start with all students
    let filtered = students;

    // Provider‐view (case_manager / service_provider)
    if (providerV === "case_manager") {
      filtered = filtered.filter(s => s.casemanager_id === user.uid);
    } else if (providerV === "service_provider") {
      filtered = filtered.filter(s =>
        (Object.values(s.schedule || {}).includes(user.uid) ||
         (s.services || []).includes(user.uid)) &&
        s.casemanager_id !== user.uid
      );
    }

    // CM filter
    if (cm !== "all") {
      filtered = filtered.filter(s => s.casemanager_id === cm);
    }

    // Text search + teacher + service + plan + grade filters...
    filtered = filtered.filter(s => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (search && !fullName.includes(search)) return false;
      if (teacherId !== "all" && !Object.values(s.schedule||{}).includes(teacherId)) return false;
      if (svc !== "all") {
        const match = (s.services || []).some(x => x.toLowerCase().includes(svc)) ||
                      (svc === "speech" && s.speech_id) ||
                      (svc === "mental health" && s.mh_id) ||
                      (svc === "ot" && s.ot_id);
        if (!match) return false;
      }
      if (plan !== "all" && s.plan !== plan) return false;
      if (grade !== "all" && String(s.grade) !== grade) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (["review_date", "reeval_date", "meeting_date"].includes(sortBy)) {
        const pa = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
        const pb = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
        return pa - pb;
      }
      const va = (a[sortBy] || "").toString().toLowerCase();
      const vb = (b[sortBy] || "").toString().toLowerCase();
      return va.localeCompare(vb);
    });

    // View‐mode dispatch
    if (viewMode === "class") {
      renderClassView(filtered, teacherId !== "all" ? teacherId : user.uid);
    } else if (viewMode === "cm") {
      renderCmView(filtered);
    } else {
      renderListView(filtered, sortBy);
    }
  }

  // Wire up
  filters.querySelectorAll("select, input[type='checkbox']").forEach(el => el.addEventListener("input", applyFilters));
  document.querySelectorAll("input[name='view-mode'], input[name='provider-view']").forEach(el => el.addEventListener("input", applyFilters));
  searchInput.addEventListener("input", applyFilters);

 filters.querySelector("#clear-filters").addEventListener("click", () => {
  // reset search
  searchInput.value = "";

  // reset selects safely
  const cmEl        = filters.querySelector("#filter-cm");
  const teacherEl   = filters.querySelector("#filter-teacher");
  const planEl      = filters.querySelector("#filter-plan");
  const gradeEl     = filters.querySelector("#filter-grade");
  const serviceEl   = filters.querySelector("#filter-service");
  const sortEl      = filters.querySelector("#sort-by");

  if (cmEl)      cmEl.value = "all";
  if (teacherEl) teacherEl.value = "all";
  if (planEl)    planEl.value = "all";
  if (gradeEl)   gradeEl.value = "all";
  if (serviceEl) serviceEl.value = "all";
  if (sortEl)    sortEl.value = "first_name";

  // reset radios safely
  const provRadio = document.querySelector('input[name="provider-view"][value="all"]');
  const viewRadio = document.querySelector('input[name="view-mode"][value="list"]');

  if (provRadio) provRadio.checked = true;
  if (viewRadio) viewRadio.checked = true;

  applyFilters();
});
}
