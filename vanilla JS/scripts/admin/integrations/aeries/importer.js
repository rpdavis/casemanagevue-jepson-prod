// aeries/importer.js

import { db } from "../../../config/config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm";

/**
 * Parses an Aeries CSV file and ensures SSID column exists.
 * @param {File} file - CSV file selected by the user.
 * @returns {Promise<Array<Object>>} - Array of row objects.
 */
export async function parseAeriesCSVAndPreview(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (!rows || !rows.length) {
          return reject(new Error("No data rows found in the CSV."));
        }
        // Check for SSID column (case-insensitive)
        const headerKeys = Object.keys(rows[0]).map(h => h.trim().toLowerCase());
        const hasSSID = headerKeys.includes("ssid") || headerKeys.includes("statestudentid");
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
 * Imports selected Aeries fields into Firestore under the 'students/{ssid}/aeries' sub-object.
 * @param {Array<Object>} data - Parsed CSV rows
 * @param {Array<string>} fieldsToImport - Array of CSV header names to import
 * @returns {Promise<number>} - Count of records successfully updated
 */
export async function importFilteredAeriesRecords(data, fieldsToImport) {
  let importedCount = 0;

  for (const entry of data) {
    // Extract SSID (case-insensitive keys)
    const ssid = (entry["SSID"] || entry["ssid"] || entry["StateStudentID"] || entry["stateStudentId"])?.trim();
    if (!ssid) {
      console.warn("Skipping row with missing SSID:", entry);
      continue;
    }

    // Build the nested aeries object
    const aeriesData = {};
    for (const field of fieldsToImport) {
      aeriesData[field] = entry[field] != null ? entry[field].trim() : null;
    }

    // Add import timestamp
    aeriesData.lastAeriesImport = new Date().toISOString();

    try {
      // Merge into 'aeries' subfield
      const studentRef = doc(db, "students", ssid);
      await setDoc(studentRef, { aeries: aeriesData }, { merge: true });
      importedCount++;
    } catch (error) {
      console.error(`Failed to import Aeries data for SSID ${ssid}:`, error);
    }
  }

  return importedCount;
}
