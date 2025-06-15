// studentFilters.js

export function renderFilters(caseManagers, currentUserRole, teachers = [], currentUserId = "") {
  const existing = document.getElementById("student-filters");
  if (existing) return existing;


const radioRow = document.createElement("div");
radioRow.classList.add("radio-row");
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
export function setupFilterHandlers(filters, students, user, renderListView, renderClassView) {
  const nav = document.getElementById("nav");

  // Remove old search input, toggle button, and radio row if they exist
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
  }

  radioRow.innerHTML += `<span>|</span>`;

  radioRow.innerHTML += `
    <label><input type="radio" name="view-mode" value="list" checked> List</label>
    <label><input type="radio" name="view-mode" value="class"> By Class</label>
  `;

  nav?.insertAdjacentElement("afterend", radioRow);

  // --- Filtering Logic ---

  function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const cm = filters.querySelector("#filter-cm")?.value;
    const teacherId = filters.querySelector("#filter-teacher")?.value || "all";
    const plan = filters.querySelector("#filter-plan").value;
    const grade = filters.querySelector("#filter-grade").value;
    const svc = filters.querySelector("#filter-service").value;
    const providerView = document.querySelector('input[name="provider-view"]:checked')?.value || "all";
    const viewMode = document.querySelector('input[name="view-mode"]:checked')?.value || "list";
    const sortBy = filters.querySelector("#sort-by").value;

    let filtered = students;

    if (providerView === "case_manager") {
      filtered = students.filter(s => s.casemanager_id === user.uid);
    } else if (providerView === "service_provider") {
      filtered = students.filter(s =>
        (Object.values(s.schedule || {}).includes(user.uid) ||
         (s.services || []).includes(user.uid)) &&
        s.casemanager_id !== user.uid
      );
    }

    if (cm !== "all") {
      filtered = filtered.filter(s =>
        s.casemanager_id === cm ||
        Object.values(s.schedule || {}).includes(cm) ||
        (s.services || []).includes(cm)
      );
    }

    filtered = filtered.filter(s => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (search && !fullName.includes(search)) return false;

      if (teacherId !== "all") {
        const teachesThisStudent = Object.values(s.schedule || {}).includes(teacherId);
        if (!teachesThisStudent) return false;
      }

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

    filtered.sort((a, b) => {
      const parseDate = (d) => d ? new Date(d).getTime() : 0;
      if (["review_date", "reeval_date", "meeting_date"].includes(sortBy)) {
        return parseDate(a[sortBy]) - parseDate(b[sortBy]);
      } else {
        const valA = a[sortBy]?.toLowerCase?.() || "";
        const valB = b[sortBy]?.toLowerCase?.() || "";
        return valA.localeCompare(valB);
      }
    });

    if (viewMode === "class") {
      renderClassView(filtered, teacherId !== "all" ? teacherId : user.uid);
    } else {
      renderListView(filtered, sortBy);
    }
  }

  filters.querySelectorAll("select, input[type='checkbox']").forEach(el => {
    el.addEventListener("input", applyFilters);
  });

  document.querySelectorAll("input[name='view-mode'], input[name='provider-view']").forEach(el => {
    el.addEventListener("input", applyFilters);
  });

  searchInput.addEventListener("input", applyFilters);

  filters.querySelector("#clear-filters").addEventListener("click", () => {
    searchInput.value = "";
    const cmEl = filters.querySelector("#filter-cm");
    if (cmEl && !cmEl.disabled && cmEl.getAttribute("data-locked") !== "true") cmEl.value = "all";

    const teacherEl = filters.querySelector("#filter-teacher");
    if (teacherEl) teacherEl.value = "all";

    filters.querySelector("#filter-plan").value = "all";
    filters.querySelector("#filter-grade").value = "all";
    filters.querySelector("#filter-service").value = "all";
    const providerRadio = document.querySelector("input[name='provider-view'][value='all']");
    if (providerRadio) providerRadio.checked = true;
    const viewRadio = document.querySelector("input[name='view-mode'][value='list']");
    if (viewRadio) viewRadio.checked = true;
    filters.querySelector("#sort-by").value = "first_name";
    applyFilters();
  });

  applyFilters();
}