import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Dynamically load SheetJS from CDN
function loadSheetJS() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Utility: Email -> Firestore-safe doc ID
function safeEmailId(email) {
  return email.replace(/[.#$[\]]/g, "_");
}

export function showAddUsersSection(main) {
  const section = document.createElement("section");
  section.style.marginTop = "2rem";
  section.innerHTML = `
    <h2>Add Individual User</h2>
    <form id="user-form">
      <label for="user-name">Name:</label><br>
      <input type="text" id="user-name" name="user-name" required><br><br>

      <label for="user-email">Email:</label><br>
      <input type="email" id="user-email" name="user-email" required><br><br>

      <label for="user-role">Role:</label><br>
      <select id="user-role" name="user-role" required>
        <option value="teacher">Teacher</option>
        <option value="case_manager">Case Manager</option>
        <option value="service_provider">Service Provider</option>
        <option value="admin">Admin</option>
      </select><br><br>

      <button type="submit">Add User</button>
    </form>
    <div id="add-user-status" style="margin-top:1rem;"></div>

    <hr style="margin:2rem 0;" />

    <h2>Bulk Upload Users</h2>
    <p>
      <b>Recommended:</b> Upload a <strong>CSV</strong> or <strong>Excel (.xlsx)</strong> file with columns: <code>name</code>, <code>email</code>, <code>role</code>.<br>
      Example: <code>Name,Email,Role</code> (header row required)
    </p>
    <input type="file" id="user-csv" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style="margin-bottom:0.5em;">
    <button id="upload-users">Upload Users</button>
    <div id="upload-status-users" style="margin-top:1rem;"></div>
    <a href="#" id="toggle-advanced" style="display:block; margin:1em 0 0.5em; font-size:0.95em;">Show advanced options (JSON upload)</a>
    <div id="advanced-json-upload" style="display:none;">
      <input type="file" id="user-json" accept="application/json">
      <button id="upload-json-users">Upload JSON</button>
      <div id="upload-status-json-users" style="margin-top:1rem;"></div>
    </div>
  `;

  main.appendChild(section);
  const db = getFirestore();

  // === Add Individual User ===
  section.querySelector("#user-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = section.querySelector("#user-name").value.trim();
    const email = section.querySelector("#user-email").value.trim().toLowerCase();
    const role = section.querySelector("#user-role").value;
    const status = section.querySelector("#add-user-status");

    if (!name || !email || !role) {
      status.textContent = "All fields are required.";
      return;
    }

    try {
      const userRef = doc(db, "users", safeEmailId(email));
      const existingSnap = await getDoc(userRef);

      if (existingSnap.exists()) {
        status.textContent = "⚠️ User already exists.";
        return;
      }

      await setDoc(userRef, { name, email, role });
      status.textContent = `✅ ${name} added as ${role}.`;

      section.querySelector("#user-name").value = "";
      section.querySelector("#user-email").value = "";
      section.querySelector("#user-role").value = "teacher";
    } catch (err) {
      console.error("Add user error:", err);
      status.textContent = "❌ Error adding user. See console.";
    }
  });

  // === Bulk Upload Users from CSV/Excel ===
  section.querySelector("#upload-users").addEventListener("click", async () => {
    await loadSheetJS();
    const fileInput = section.querySelector("#user-csv");
    const status = section.querySelector("#upload-status-users");
    status.textContent = "Processing...";
    if (!fileInput.files.length) {
      status.textContent = "No file selected.";
      return;
    }

    const file = fileInput.files[0];
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let users = [];
        let errors = [];
        let added = 0, skipped = 0;

        try {
          // Parse with SheetJS
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          users = window.XLSX.utils.sheet_to_json(firstSheet, { header: 0, defval: "" });
        } catch (csvErr) {
          // Try as plain CSV string
          try {
            users = window.XLSX.utils.sheet_to_json(
              window.XLSX.read(e.target.result, { type: "binary" }).Sheets.Sheet1,
              { header: 0, defval: "" }
            );
          } catch (fail) {
            status.textContent = "❌ Could not parse file. Make sure it's a valid CSV or Excel file.";
            return;
          }
        }

        // Validate and import
        for (const [i, user] of users.entries()) {
          const name = (user.name || user.Name || "").trim();
          const email = ((user.email || user.Email || "") + "").trim().toLowerCase();
          const role = (user.role || user.Role || "").trim().toLowerCase();
          if (!name || !email || !role) {
            errors.push(`Row ${i + 2}: Missing name, email, or role`);
            continue;
          }
          if (!["teacher", "case_manager", "service_provider", "admin"].includes(role)) {
            errors.push(`Row ${i + 2}: Invalid role "${role}"`);
            continue;
          }
          const userRef = doc(db, "users", safeEmailId(email));
          const existingSnap = await getDoc(userRef);
          if (existingSnap.exists()) {
            skipped++;
            continue;
          }
          await setDoc(userRef, { name, email, role });
          added++;
        }
        let msg = `✅ ${added} users uploaded.`;
        if (skipped) msg += ` ${skipped} skipped (already exist).`;
        if (errors.length) msg += `\n❌ Errors:\n${errors.join("\n")}`;
        status.textContent = msg;
      };

      // Read as array buffer (to support both CSV and Excel)
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Failed to upload users.";
    }
  });

  // === Toggle advanced JSON upload ===
  section.querySelector("#toggle-advanced").addEventListener("click", (e) => {
    e.preventDefault();
    const advanced = section.querySelector("#advanced-json-upload");
    advanced.style.display = advanced.style.display === "none" ? "block" : "none";
    e.target.textContent = advanced.style.display === "none"
      ? "Show advanced options (JSON upload)"
      : "Hide advanced options (JSON upload)";
  });

  // === Bulk Upload Users from JSON (Advanced) ===
  section.querySelector("#upload-json-users").addEventListener("click", async () => {
    const fileInput = section.querySelector("#user-json");
    const status = section.querySelector("#upload-status-json-users");

    if (!fileInput.files.length) {
      status.textContent = "No file selected.";
      return;
    }

    try {
      const file = fileInput.files[0];
      const text = await file.text();
      const data = JSON.parse(text);
      const batch = data.users || [];

      let added = 0, skipped = 0;
      for (const user of batch) {
        if (!user.email) {
          skipped++;
          continue;
        }
        const safeId = safeEmailId(user.email);
        const userRef = doc(db, "users", safeId);
        const existingSnap = await getDoc(userRef);
        if (existingSnap.exists()) {
          skipped++;
          continue;
        }
        await setDoc(userRef, user);
        added++;
      }

      status.textContent = `✅ ${added} users uploaded, ${skipped} skipped (exists or missing email).`;
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Failed to upload users.";
    }
  });
}