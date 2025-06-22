import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export async function showExportDialog(students) {
  // This function now returns a Promise to signal its outcome
  return new Promise(async (resolve, reject) => {
    const db = getFirestore();
    console.log("Export dialog opened.");

    // 🔹 Load users and build ID → displayName map
    const userSnap = await getDocs(collection(db, "users"));
    const userMap = {};
    userSnap.forEach(doc => {
      const data = doc.data();
      userMap[doc.id] = {
        displayName: data.displayName || data.name || ""
      };
    });

    const exportFields = [
      { key: "first_name", label: "First Name" },
      { key: "last_name", label: "Last Name" },
      { key: "grade", label: "Grade" },
      { key: "casemanager_id", label: "Case Manager" },
      { key: "review_date", label: "Plan Review" },
      { key: "reeval_date", label: "Reevaluation" },
      { key: "speech_id", label: "Speech" },
      { key: "mh_id", label: "Mental Health" },
      { key: "ot_id", label: "OT" },
      { key: "instruction", label: "Instructional Accommodation" },
      { key: "assessment", label: "Assessment Accommodations" },
      { key: "documents", label: "Documents" }
    ];

    const overlay = document.createElement("div");
    overlay.className = "ex-dialog-overlay";

    const dialog = document.createElement("div");
    dialog.className = "ex-dialog-box";
    overlay.appendChild(dialog);

    // MODIFIED: Added the div for actions and the Cancel button in the dialog's innerHTML.
    dialog.innerHTML = `
      <h2>Select Fields to Export</h2>
      <form id="export-form"></form>
    
    `;
const form = dialog.querySelector("form");

exportFields.forEach(field => {
  const label = document.createElement("label");
  label.innerHTML = `
    <input type="checkbox" name="fields" value="${field.key}" checked> ${field.label}
  `;
  form.appendChild(label);
});

form.appendChild(document.createElement("br"));

// Action buttons container
const actionWrapper = document.createElement("div");
actionWrapper.className = "ex-dialog-actions";

// Cancel button (added only once, via JS)
const cancelBtn = document.createElement("button");
cancelBtn.textContent = "Cancel";
cancelBtn.type = "button";
cancelBtn.id = "cancel-export-btn";

// Submit button
const submitBtn = document.createElement("button");
submitBtn.textContent = "Download CSV";
submitBtn.type = "submit";

// Append buttons
actionWrapper.appendChild(cancelBtn);
actionWrapper.appendChild(submitBtn);
form.appendChild(actionWrapper);


    // --- Event Listener for Form Submission (Download) ---
    // MODIFIED: Wrapped existing logic in try...catch and added Promise resolution/rejection.
    form.onsubmit = e => {
      e.preventDefault();
      console.log("Export form submitted.");
      const selected = [...form.elements.fields]
        .filter(el => el.checked)
        .map(el => el.value);

      try {
        exportSelectedFields(students, userMap, selected, exportFields);
        overlay.remove(); // Close dialog on successful export
        resolve('exported'); // Resolve the Promise when export is successful
        console.log("Export completed and dialog resolved 'exported'.");
      } catch (error) {
        console.error("Error during CSV export:", error);
        overlay.remove(); // Close dialog even if error occurs during export
        reject('export_failed'); // Reject the Promise if export fails
        console.log("Export failed and dialog rejected 'export_failed'.");
      }
    };

    // ADDED: Event Listener for Cancel Button
    cancelBtn.addEventListener('click', () => {
      overlay.remove(); // Close the dialog
      resolve('canceled'); // Resolve the Promise with a 'canceled' status
      console.log("Export dialog canceled and resolved 'canceled'.");
    });

    // ADDED: Handle closing via clicking outside the dialog (on the overlay)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) { // Check if the click was directly on the overlay
        overlay.remove();
        resolve('canceled'); // Treat as canceled if closed by clicking outside
        console.log("Export dialog closed by clicking outside and resolved 'canceled'.");
      }
    });

    document.body.appendChild(overlay);
  }); // End of Promise wrapper
}

function exportSelectedFields(students, userMap, selectedFields, fieldDefs) {
  const rows = students.map(student => {
    const row = {};

    selectedFields.forEach(fieldKey => {
      const label = fieldDefs.find(f => f.key === fieldKey)?.label || fieldKey;

      switch (fieldKey) {
        case "casemanager_id":
        case "speech_id":
        case "mh_id":
        case "ot_id": {
          const id = student[fieldKey];
          row[label] = id && userMap[id]?.displayName ? userMap[id].displayName : "";
          break;
        }

        case "documents": {
          const docs = [];
          if (student.ataglance_pdf_url) docs.push("At-A-Glance");
          if (student.bip_pdf_url) docs.push("BIP");
          row[label] = docs.join(", ");
          break;
        }

        default:
          row[label] = student[fieldKey] || "";
      }
    });

    return row;
  });

  if (rows.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_export.csv";
  a.click();
  URL.revokeObjectURL(url);
  console.log("CSV download initiated.");
}