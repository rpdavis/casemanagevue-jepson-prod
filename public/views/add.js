// admin.js

import { showAddUsersSection } from "./admin/addUsers.js";
import { showEditUsersSection } from "./admin/editUsers.js";
import { showPeriodsSection } from "./admin/periods.js";
import { showPermissionsSection } from "./admin/permissions.js";
import { showPresentationSection } from "./admin/presentation.js";

/**
 * Main admin panel view, now tabbed!
 * @param {HTMLElement} main 
 */
export function showAdminView(main) {
  main.innerHTML = "";

  // Tab navigation
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

  // Only show one at a time
  Object.entries(sectionMap).forEach(([key, section]) => {
    section.style.display = key === "add" ? "block" : "none";
    section.className = "admin-section";
    main.appendChild(section);
  });

  // Handlers to show/hide sections
  tabBar.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const tab = e.target.getAttribute("data-tab");
      // Highlight active tab
      tabBar.querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn === e.target));
      // Show the selected section
      Object.entries(sectionMap).forEach(([key, section]) => {
        section.style.display = key === tab ? "block" : "none";
      });
    }
  });

  main.prepend(tabBar);

  // Render each section once (you can optimize if needed)
  showAddUsersSection(sectionMap.add);
  showEditUsersSection(sectionMap.edit);
  showPeriodsSection(sectionMap.periods);
  showPermissionsSection(sectionMap.permissions);
  showPresentationSection(sectionMap.presentation);
}