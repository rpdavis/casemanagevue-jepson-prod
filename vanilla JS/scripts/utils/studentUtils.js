// utils/studentUtils.js

/**
 * Returns the value for a given field, prioritizing sources:
 *   1. student.overrides[field]
 *   2. student.aeries[field]
 *   3. student.seis[field]
 *   4. top-level student[field]
 * @param {Object} student — Firestore student document data
 * @param {string} field — Field key to display (e.g. "first_name")
 * @param {*} [fallback="—"] — Value to return if all sources are missing or empty
 * @returns {*} — The display value from the highest-priority source
 */
export function getDisplayValue(student, field, fallback = "—") {
  // Admin overrides take highest priority
  if (student.overrides && student.overrides[field] != null && student.overrides[field] !== "") {
    return student.overrides[field];
  }
  // Aeries import next
  if (student.aeries && student.aeries[field] != null && student.aeries[field] !== "") {
    return student.aeries[field];
  }
  // SEIS import next
  if (student.seis && student.seis[field] != null && student.seis[field] !== "") {
    return student.seis[field];
  }
  // Top-level field last
  if (student[field] != null && student[field] !== "") {
    return student[field];
  }
  return fallback;
}

/**
 * Returns which source the displayed value came from.
 * @param {Object} student — Firestore student document data
 * @param {string} field — Field key to check
 * @returns {string} — One of "Override", "Aeries", "SEIS", "App", or "—"
 */
export function getSourceValue(student, field) {
  if (student.overrides && student.overrides[field] != null && student.overrides[field] !== "") {
    return "Override";
  }
  if (student.aeries && student.aeries[field] != null && student.aeries[field] !== "") {
    return "Aeries";
  }
  if (student.seis && student.seis[field] != null && student.seis[field] !== "") {
    return "SEIS";
  }
  if (student[field] != null && student[field] !== "") {
    return "App";
  }
  return "—";
}

/**
 * Converts snake_case or underscore_separated keys to Title Case labels.
 * E.g. "first_name" → "First Name"
 * @param {string} field
 * @returns {string}
 */
export function labelize(field) {
  return field
    .split(/[_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
