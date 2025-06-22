import { parseSeisCSVAndPreview, importFilteredSeisRecords } from "./importer.js";

export function showSeisImport(container) {
  container.innerHTML = `
    <div class="seis-import">
      <h3>Upload SEIS CSV</h3>
      <input type="file" id="seis-csv" accept=".csv" />
      <button id="preview-seis-btn">Preview</button>

      <div id="seis-field-options"></div>
      <div id="seis-preview-container" style="margin-top:1rem;"></div>
      <button id="upload-seis-btn" disabled>Import to Firestore</button>
      <p id="seis-status" class="status-msg"></p>
    </div>
  `;

  let parsedData = [];

  // PREVIEW CSV
  document.getElementById("preview-seis-btn").addEventListener("click", async () => {
    const file = document.getElementById("seis-csv").files[0];
    const preview = document.getElementById("seis-preview-container");
    const status = document.getElementById("seis-status");
    const uploadBtn = document.getElementById("upload-seis-btn");

    if (!file) {
      status.textContent = "❌ Please select a CSV file.";
      return;
    }

    status.textContent = "Parsing file...";
    status.style.color = "black";

    try {
      parsedData = await parseSeisCSVAndPreview(file);

      const fields = Object.keys(parsedData[0]);
      status.textContent = `✅ Loaded ${parsedData.length} rows.`;
      status.style.color = "green";

      // Render field selector
      const fieldOptions = document.getElementById("seis-field-options");
      fieldOptions.innerHTML = `
        <h4>Select fields to import:</h4>
        ${fields.map(f => `
          <label>
            <input type="checkbox" name="fields" value="${f}" checked /> ${f}
          </label>
        `).join("<br>")}
      `;

      // Render preview table (first 5 rows)
      const previewTable = `
        <table border="1" cellpadding="4">
          <thead><tr>${fields.map(f => `<th>${f}</th>`).join("")}</tr></thead>
          <tbody>
            ${parsedData.slice(0, 5).map(row => `
              <tr>${fields.map(f => `<td>${row[f] || ""}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
        <p>Showing first 5 of ${parsedData.length} rows.</p>
      `;
      preview.innerHTML = previewTable;

      uploadBtn.disabled = false;
    } catch (err) {
      status.textContent = `❌ Error: ${err.message}`;
      status.style.color = "red";
      document.getElementById("seis-preview-container").innerHTML = "";
      document.getElementById("seis-field-options").innerHTML = "";
      document.getElementById("upload-seis-btn").disabled = true;
      console.error("SEIS Parse Error:", err);
    }
  });

  // IMPORT TO FIRESTORE
  document.getElementById("upload-seis-btn").addEventListener("click", async () => {
    const status = document.getElementById("seis-status");
    const checkboxes = document.querySelectorAll("input[name='fields']:checked");
    const fieldsToImport = Array.from(checkboxes).map(cb => cb.value);

    if (!parsedData.length) {
      status.textContent = "❌ No parsed data available.";
      status.style.color = "red";
      return;
    }

    status.textContent = "Importing...";
    status.style.color = "black";

    try {
      const count = await importFilteredSeisRecords(parsedData, fieldsToImport);
      status.textContent = `✅ Imported ${count} records with selected fields.`;
      status.style.color = "green";
    } catch (err) {
      status.textContent = `❌ Import failed: ${err.message}`;
      status.style.color = "red";
      console.error("SEIS Import Error:", err);
    }
  });
}
