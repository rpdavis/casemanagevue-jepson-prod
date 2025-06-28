// public/scripts/utils/studentUtils.js

/**
 * Returns the value for a given field, prioritizing:
 *   1. student.aeries[field]
 *   2. student.app.override[field]
 *   3. student[field] (any top-level app data)
 *   4. fallback (default "—")
 *
 * @param {Object} student — Firestore doc data for the student
 * @param {string} field — The key to look up (e.g. "first_name", "grade")
 * @param {*} fallback — What to return if all sources are missing
 */
export function getDisplayValue(student, field, fallback = "—") {
  if (student.aeries?.[field] != null && student.aeries[field] !== "") {
    return student.aeries[field];
  }
  if (student.app?.override?.[field] != null && student.app.override[field] !== "") {
    return student.app.override[field];
  }
  if (student[field] != null && student[field] !== "") {
    return student[field];
  }
  return fallback;
}
