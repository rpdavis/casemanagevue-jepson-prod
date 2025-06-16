// public/views/admin.js

// Import your admin section modules here
import { showAddUsersSection } from "./admin/addUsers.js";
import { showEditUsersSection } from "./admin/editUsers.js";
import { showPeriodsSection } from "./admin/periods.js";
import { showPermissionsSection } from "./admin/permissions.js";
import { showPresentationSection } from "./admin/presentation.js";

/**
 * Render the main admin panel with tabbed navigation.
 * @param {HTMLElement} main 
 */
export function showAdminView(main) {
  main.innerHTML = "";

  // Create tab navigation
  const tabBar = document.createElement("nav");
  tabBar.className = "admin-tab-bar";
  tabBar.innerHTML = `
    <button data-tab="add" class="active">Add Users</button>
    <button data-tab="edit">Edit Users</button>
    <button data-tab="periods">Periods & Times</button>
    <button data-tab="permissions">Permissions</button>
    <button data-tab="presentation">Presentation</button>
  `;

  // Section containers
  const sectionMap = {
    add: document.createElement("section"),
    edit: document.createElement("section"),
    periods: document.createElement("section"),
    permissions: document.createElement("section"),
    presentation: document.createElement("section"),
  };

  // Show only the "add" section by default
  Object.entries(sectionMap).forEach(([key, section]) => {
    section.style.display = key === "add" ? "block" : "none";
    section.className = "admin-section";
    main.appendChild(section);
  });

  // Tab switching logic
  tabBar.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const tab = e.target.getAttribute("data-tab");
      // Highlight the active tab
      tabBar.querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn === e.target));
      // Show the selected section, hide others
      Object.entries(sectionMap).forEach(([key, section]) => {
        section.style.display = key === tab ? "block" : "none";
      });
    }
  });

  main.prepend(tabBar);

  // Render each section (call your existing display functions)
  showAddUsersSection(sectionMap.add);
  showEditUsersSection(sectionMap.edit);
  showPeriodsSection(sectionMap.periods);
  showPermissionsSection(sectionMap.permissions);
  showPresentationSection(sectionMap.presentation);
}