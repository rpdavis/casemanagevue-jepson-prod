// admin.js
console.log("model");
//Import implemented admin sections
import { showAddUsersSection } from "./admin/addUsers.js";
import { showEditUsersSection } from "./admin/editUsers.js";
import { showPeriodsSection } from "./admin/periods.js";
import { showPermissionsSection } from "./admin/permissions.js"; // Uncomment when implemented
import { showPresentationSection } from "./admin/presentation.js"; // Uncomment when implemented

/**
 * Main admin panel view
 * @param {HTMLElement} main 
 */
export function showAdminView(main) {
  main.innerHTML = "";
  
  // Add Users section
  showAddUsersSection(main);

  // Edit Users section
  showEditUsersSection(main);

  // Periods & Times section
  // showPeriodsSection(main);

  // Permissions section (stub)
  showPermissionsSection(main);

  // App Presentation section (stub)
  showPresentationSection(main);
}console.log("mwwodel");