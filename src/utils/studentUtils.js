/**
 * Returns the value for a given field, prioritizing sources:
 *   1. student.overrides[field] (App data - highest priority)
 *   2. student.aeries[field] (Aeries import data)
 *   3. student.seis[field] (SEIS import data)
 *   4. top-level student[field] (lowest priority)
 * @param {Object} student — Firestore student document data
 * @param {string} field — Field key to display (e.g. "first_name" or "programs.specialEducation")
 * @param {*} [fallback="—"] — Value to return if all sources are missing or empty
 * @returns {*} — The display value from the highest-priority source
 */
export function getDisplayValue(student, field, fallback = "—") {
  // Helper function to get nested object value
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  // App overrides take highest priority
  const overrideValue = getNestedValue(student.overrides, field)
  if (student.overrides && overrideValue != null && overrideValue !== "") {
    return overrideValue
  }
  
  // Aeries import next
  const aeriesValue = getNestedValue(student.aeries, field)
  if (student.aeries && aeriesValue != null && aeriesValue !== "") {
    return aeriesValue
  }
  
  // SEIS import next
  const seisValue = getNestedValue(student.seis, field)
  if (student.seis && seisValue != null && seisValue !== "") {
    return seisValue
  }
  
  // Top-level field last
  const topLevelValue = getNestedValue(student, field)
  if (topLevelValue != null && topLevelValue !== "") {
    return topLevelValue
  }
  
  return fallback
}

/**
 * Returns which source the displayed value came from.
 * @param {Object} student — Firestore student document data
 * @param {string} field — Field key to check
 * @returns {string} — One of "App", "Aeries", "SEIS", "Top-level", or "—"
 */
export function getSourceValue(student, field) {
  // Helper function to get nested object value
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  const overrideValue = getNestedValue(student.overrides, field)
  if (student.overrides && overrideValue != null && overrideValue !== "") {
    return "App"
  }
  
  const aeriesValue = getNestedValue(student.aeries, field)
  if (student.aeries && aeriesValue != null && aeriesValue !== "") {
    return "Aeries"
  }
  
  const seisValue = getNestedValue(student.seis, field)
  if (student.seis && seisValue != null && seisValue !== "") {
    return "SEIS"
  }
  
  const topLevelValue = getNestedValue(student, field)
  if (topLevelValue != null && topLevelValue !== "") {
    return "Top-level"
  }
  
  return "—"
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

export function formatListFromText(text) {
  if (!text) return "<div>—</div>";
  const items = text
    .split(/\n|\r|\d+\.\s+|\-\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(item => `<li>${item}</li>`)
    .join("");
  return `<ul class="bullet-list">${items}</ul>`;
}