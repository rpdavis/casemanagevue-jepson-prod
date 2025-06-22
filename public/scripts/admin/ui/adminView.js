// public/scripts/admin/ui/adminView.js
import { createTabBar }            from "./tabBar.js";
import { showUsersAdd }            from "../users/add.js";
import { showUsersEdit }           from "../users/edit.js";
// Permissions live under controller.js, not ui.js
import { showPermissionsSection }  from "../permissions/controller.js";
import { showPeriodsSection }      from "../periods.js";
import { showAdminStudents }       from "../students/index.js";
import { showSeisImport } from "../integrations/seis/ui.js"; // ADD THIS
import { showAeriesImport } from "../integrations/aeries/ui.js";

export function showAdminView() {
  const main = document.getElementById("main-content");
  main.innerHTML = ""; // clear existing content

  // 1) Create hidden section containers
  const sections = {
    usersAdd:    createSection(main, "Add Users"),
    usersEdit:   createSection(main, "Edit Users"),
    students:    createSection(main, "Students"),
    permissions: createSection(main, "Permissions"),
    periods:     createSection(main, "Periods"),
    seis:        createSection(main, "SEIS Import"),
    aeries: createSection(main, "Aeries Import"),
  };

  // 2) Define tab order & labels (match keys above)
  const tabs = [
    
    { key: "usersAdd",    label: "Add Users"    },
    { key: "usersEdit",   label: "Edit Users"   },
    { key: "students",    label: "Students"     },
    { key: "permissions", label: "Permissions"  },
    { key: "periods",     label: "Periods"      },
    { key: "seis",        label: "SEIS Import"  },
    { key: "aeries",      label: "Aeries Import"},
  ];

  // 3) Render tab bar and wire show/hide
  const tabBar = createTabBar(tabs, selectedKey => {
    tabs.forEach(({ key }) => {
      sections[key].style.display = key === selectedKey ? "block" : "none";
    });
  });
  main.prepend(tabBar);

  // 4) Populate each section
  showUsersAdd(sections.usersAdd);
  showUsersEdit(sections.usersEdit);
  showAdminStudents(sections.students);
  showPermissionsSection(sections.permissions);
  showPeriodsSection(sections.periods);
  showSeisImport(sections.seis); 
  showAeriesImport(sections.aeries);
}

// Helper: create a section with an <h2> title, hidden by default
function createSection(root, title) {
  const sec = document.createElement("section");
  sec.className = "admin-section";
  sec.style.display = "none";
  // optional: append a heading automatically
  const h2 = document.createElement("h2");
  h2.textContent = title;
  sec.appendChild(h2);
  root.appendChild(sec);
  return sec;
}
