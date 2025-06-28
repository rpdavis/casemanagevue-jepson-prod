// aeries/ui.js

import { parseAeriesCSVAndPreview, importFilteredAeriesRecords } from "./importer.js";

/**
 * Renders the Aeries CSV import UI and handles preview & import actions.
 * @param {HTMLElement} container - The DOM element to render into.
 */
export function showAeriesImport(container) {
  container.innerHTML = `
    <div class="aeries-import">
      <h3>Upload Aeries CSV</h3>
      <input type="file" id="aeries-csv" accept=".csv" />
      <button id="preview-aeries-btn">Preview</button>

      <div id="aeries-field-options"></div>
      <div id="aeries-preview-container" style="margin-top:1rem;"></div>
      <button id="upload-aeries-btn" disabled>Import to Firestore</button>
      <p id="aeries-status" class="status-msg"></p>
    </div>
  `;

  let parsedData = [];
  const status = container.querySelector('#aeries-status');
  const uploadBtn = container.querySelector('#upload-aeries-btn');

  // PREVIEW handler
  container.querySelector('#preview-aeries-btn').addEventListener('click', async () => {
    const fileInput = container.querySelector('#aeries-csv');
    const preview = container.querySelector('#aeries-preview-container');
    const fieldOptions = container.querySelector('#aeries-field-options');

    const file = fileInput.files[0];
    if (!file) {
      status.textContent = '❌ Please select a CSV file.';
      status.style.color = 'red';
      return;
    }

    status.textContent = 'Parsing file...';
    status.style.color = 'black';
    preview.innerHTML = '';
    fieldOptions.innerHTML = '';
    uploadBtn.disabled = true;

    try {
      parsedData = await parseAeriesCSVAndPreview(file);
      status.textContent = `✅ Loaded ${parsedData.length} rows.`;
      status.style.color = 'green';

      // Field selector
      const fields = Object.keys(parsedData[0]);
      fieldOptions.innerHTML = `
        <h4>Select fields to import:</h4>
        ${fields.map(f => `
          <label>
            <input type="checkbox" name="aeries-fields" value="${f}" checked /> ${f}
          </label>
        `).join('<br>')}
      `;

      // Preview table
      const previewTable = `
        <table border="1" cellpadding="4">
          <thead><tr>${fields.map(f => `<th>${f}</th>`).join('')}</tr></thead>
          <tbody>
            ${parsedData.slice(0, 5).map(row => `
              <tr>${fields.map(f => `<td>${row[f] || ''}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
        <p>Showing first 5 of ${parsedData.length} rows.</p>
      `;
      preview.innerHTML = previewTable;
      uploadBtn.disabled = false;
    } catch (err) {
      status.textContent = `❌ Error: ${err.message}`;
      status.style.color = 'red';
      console.error('Aeries Parse Error:', err);
    }
  });

  // IMPORT handler
  container.querySelector('#upload-aeries-btn').addEventListener('click', async () => {
    const checkboxes = container.querySelectorAll('input[name="aeries-fields"]:checked');
    const fieldsToImport = Array.from(checkboxes).map(cb => cb.value);

    if (!parsedData.length) {
      status.textContent = '❌ No parsed data available.';
      status.style.color = 'red';
      return;
    }

    status.textContent = 'Importing...';
    status.style.color = 'black';

    try {
      const count = await importFilteredAeriesRecords(parsedData, fieldsToImport);
      status.textContent = `✅ Imported ${count} records with selected fields.`;
      status.style.color = 'green';
    } catch (err) {
      status.textContent = `❌ Import failed: ${err.message}`;
      status.style.color = 'red';
      console.error('Aeries Import Error:', err);
    }
  });
}
