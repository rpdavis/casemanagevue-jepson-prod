// Admin panel script Users/add.js
import {
  getFirestore,
  // doc, // No longer needed for adding new users to 'users' collection
  // setDoc // No longer needed for adding new users to 'users' collection
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
// NEW: Import Firebase Functions client SDK
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-functions.js";
import { VALID_ROLES, isApprovedRole } from "../../config/roles.js";  // Adjust import path as needed
// Assuming 'app' from config.js is implicitly available or passed. If not, add:
// import { app } from "../config/config.js";

const db = getFirestore();  // Firestore instance from initialized app
const functions = getFunctions(); // Initialize Firebase Functions client

// Get a reference to the HTTPS Callable Cloud Function
const addUserWithRoleCallable = httpsCallable(functions, 'addUserWithRole');

/**
 * Renders the "Add Users" section in the admin UI and sets up event handlers for 
 * adding users individually or via bulk upload.
 * @param {HTMLElement} sectionElement - The container element where this UI will be injected.
 */
export function showUsersAdd(sectionElement) {
  sectionElement.innerHTML = `
    

    <div class="add-user-wrapper"> 
    
    <div class="add-single">
    <h3>Add Single User</h3>
      <form id="add-user-form" class="form-grid">
        <div>
          <label>Name: <input type="text" id="new-user-name" required autocomplete="off" data-lpignore="true"></label>
        </div>
        <div>
          <label>Email: <input autocomplete="off" data-lpignore="true" type="email" id="new-user-email" required></label>
        </div>
        <div>
          <label>Role: 
            <select id="new-user-role" required>
              <option value="" disabled selected>Select role...</option>
              ${VALID_ROLES.map(role => `<option value="${role}">${role}</option>`).join("")}
            </select>
          </label>
        </div>
        <button type="submit">Add User</button>
      </form>
    </div>
    <div class="add-bulk">
      <h3>Bulk Upload Users</h3>
          <div>
            <input type="file" id="bulk-user-file" accept=".csv, .xls, .xlsx" />
            <button id="bulk-upload-btn">Upload Users</button>
          </div>
              <h4>example formating</h4>
              <div>File needs to be in .csv, .xls, .xlsx format, like an Excel spreadsheet.</div>
        <div>
          <img src="../../assets/images/bulk_upload_ex.png" alt="Bulk User Upload Example Format" style="max-width:100%; height:auto;">
        </div>
        </div>
    </div>
  `;

  const addUserForm = sectionElement.querySelector("#add-user-form");
  const nameInput = sectionElement.querySelector("#new-user-name");
  const emailInput = sectionElement.querySelector("#new-user-email");
  const roleSelect = sectionElement.querySelector("#new-user-role");
  const fileInput = sectionElement.querySelector("#bulk-user-file");
  const uploadBtn = sectionElement.querySelector("#bulk-upload-btn");

  // Handle single-user form submission
  addUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const role = roleSelect.value;

    if (!name || !email || !role) {
      alert("Please fill out name, email, and role.");
      return;
    }
    if (!isApprovedRole(role)) {
      alert("Invalid role. Please select a valid role.");
      return;
    }

    try {
      const result = await addUserWithRoleCallable({ name, email, role });
      alert(`✅ ${result.data.message}`); // Display success message from Cloud Function
      addUserForm.reset();
      roleSelect.selectedIndex = 0;
    } catch (error) {
      console.error("Error adding user via Cloud Function:", error);
      // Access the error message from the Cloud Function's HttpsError
      alert(`❌ Error adding user: ${error.message}`); 
    }
  });

  // Helper function for bulk upload - now calls the new Cloud Function
  const addUserToFirestore = async (name, email, role, lineInfo = "") => {
    try {
      // Call the HTTPS Callable Cloud Function
      await addUserWithRoleCallable({ name, email, role });
      return null; // null indicates success
    } catch (err) {
      console.error(`${lineInfo}Error adding user "${email}" via Cloud Function:`, err);
      // Return an error message prefixed with line number info (for bulk uploads)
      return `${lineInfo}Error adding user "${email}": ${err.message}`;
    }
  };

  // Handle bulk upload (CSV or Excel file)
  uploadBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a CSV or Excel file to upload.");
      return;
    }
    const fileName = file.name.toLowerCase();
    if (!(fileName.endsWith(".csv") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx"))) {
      alert("Unsupported file type. Please upload a .csv, .xls, or .xlsx file.");
      return;
    }

    if (fileName.endsWith(".csv")) {
      // ** CSV File Processing **
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        try {
          const lines = text.trim().split(/\r?\n/);
          if (lines.length === 0) {
            alert("The CSV file is empty.");
            return;
          }
          let startIndex = 0;
          const colIndex = { name: 0, email: 1, role: 2 };
          const firstLineCols = lines[0].split(",");
          const headerDetected = firstLineCols.map(h => h.toLowerCase())
                                             .some(h => h.includes("name") || h.includes("email") || h.includes("role"));
          if (headerDetected) {
            firstLineCols.forEach((header, idx) => {
              const headerLC = header.trim().toLowerCase();
              if (headerLC === "name" || headerLC === "displayname") colIndex.name = idx;
              if (headerLC === "email") colIndex.email = idx;
              if (headerLC === "role") colIndex.role = idx;
            });
            startIndex = 1;
          }
          let successCount = 0;
          const errorMessages = [];
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(",");
            const name = (parts[colIndex.name] || "").trim();
            const email = (parts[colIndex.email] || "").trim();
            const role = (parts[colIndex.role] || "").trim();
            if (!name || !email || !role) {
              errorMessages.push(`Line ${i+1}: Missing name, email, or role.`);
              continue;
            }
            if (!isApprovedRole(role)) {
              errorMessages.push(`Line ${i+1}: Invalid role "${role}".`);
              continue;
            }
            const errMsg = await addUserToFirestore(name, email, role, `Line ${i+1}: `);
            if (errMsg) {
              errorMessages.push(errMsg);
            } else {
              successCount++;
            }
          }
          let summary = `${successCount} users added successfully.`;
          if (errorMessages.length > 0) {
            summary += `\n${errorMessages.length} errors:\n` + errorMessages.join("\n");
          }
          alert(summary);
          fileInput.value = "";
        } catch (err) {
          console.error("Error processing CSV file:", err);
          alert("❌ Error processing CSV file: " + err.message);
        }
      };
      reader.onerror = () => {
        alert("Failed to read the CSV file. Please check the file and try again.");
      };
      reader.readAsText(file);
    } else {
      // ** Excel (.xls or .xlsx) File Processing **
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (typeof XLSX === "undefined") {
            alert("Excel upload requires SheetJS (XLSX) library. Please include it in your page.");
            return;
          }
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          if (rows.length === 0) {
            alert("The Excel file is empty or unrecognized.");
            return;
          }
          let successCount = 0;
          const errorMessages = [];
          for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            let name = "", email = "", role = "";
            for (const key in row) {
              const keyLC = key.toLowerCase();
              const value = ("" + row[key]).trim();
              if ((keyLC === "name" || keyLC === "displayname") && !name) name = value;
              else if (keyLC === "email" && !email) email = value;
              else if (keyLC === "role" && !role) role = value;
            }
            if (!name || !email || !role) {
              const rowValues = Object.values(row).map(val => ("" + val).trim());
              if (!name && rowValues[0]) name = rowValues[0];
              if (!email && rowValues[1]) email = rowValues[1];
              if (!role && rowValues[2]) role = rowValues[2];
            }
            if (!name || !email || !role) {
              errorMessages.push(`Row ${index+1}: Missing name, email, or role.`);
              continue;
            }
            if (!isApprovedRole(role)) {
              errorMessages.push(`Row ${index+1}: Invalid role "${role}".`);
              continue;
            }
            const errMsg = await addUserToFirestore(name, email, role, `Row ${index+1}: `);
            if (errMsg) {
              errorMessages.push(errMsg);
            } else {
              successCount++;
            }
          }
          let summary = `${successCount} users added successfully.`;
          if (errorMessages.length > 0) {
            summary += `\n${errorMessages.length} errors:\n` + errorMessages.join("\n");
          }
          alert(summary);
          fileInput.value = "";
        } catch (err) {
          console.error("Error processing Excel file:", err);
          alert("❌ Error processing Excel file: " + err.message);
        }
      };
      reader.onerror = () => {
        alert("Failed to read the Excel file. Please check the file and try again.");
      };
      reader.readAsArrayBuffer(file);
    }
  });
}
