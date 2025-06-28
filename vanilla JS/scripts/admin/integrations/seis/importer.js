import { db } from "../../../config/config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm";

/**
 * Parses a SEIS CSV and verifies that it contains data and SSID field.
 */
export async function parseSeisCSVAndPreview(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        if (!rows || !rows.length) {
          return reject(new Error("No data rows found in the CSV."));
        }

        const hasSSID = Object.keys(rows[0]).some(
          key => key.trim().toLowerCase() === "ssid"
        );

        if (!hasSSID) {
          return reject(new Error("Missing required 'SSID' column."));
        }

        resolve(rows);
      },
      error: err => reject(new Error("Failed to parse CSV: " + err.message))
    });
  });
}

/**
 * Imports only the selected fields from parsed SEIS records and syncs them to Firestore using SSID.
 */
export async function importFilteredSeisRecords(data, fieldsToImport) {
  let importedCount = 0;

  for (const entry of data) {
    const ssid = entry["SSID"]?.trim() || entry["ssid"]?.trim();
    if (!ssid) {
      console.warn("Skipping row with missing SSID:", entry);
      continue;
    }

    const record = {};

    for (const field of fieldsToImport) {
      if (field === "iep_services") {
        record[field] = entry[field]?.split(";").map(s => s.trim()) || [];
      } else {
        record[field] = entry[field];
      }
    }

    record.last_imported = new Date().toISOString();

    try {
      const studentRef = doc(db, "students", ssid);
      await setDoc(studentRef, record, { merge: true });
      importedCount++;
    } catch (error) {
      console.error(`Failed to import SSID ${ssid}:`, error);
    }
  }

  return importedCount;
}
