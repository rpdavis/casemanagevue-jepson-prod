/**
 * Returns the value for a given field, prioritizing sources:
 *   1. student.overrides[field] (Admin overrides - highest priority)
 *   2. student.app[category][field] (App form data - categorized)
 *   3. student.app[field] (App form data - legacy flat)
 *   4. student.aeries[field] (Aeries import data)
 *   5. student.seis[field] (SEIS import data)
 *   6. top-level student[field] (legacy/fallback - lowest priority)
 * @param {Object} student — Firestore student document data
 * @param {string} field — Field key to display (e.g. "firstName" or "programs.specialEducation")
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

  // Admin overrides take highest priority
  const overrideValue = getNestedValue(student.overrides, field)
  if (student.overrides && overrideValue != null && overrideValue !== "") {
    return overrideValue
  }
  
  // App form data - check categorized structure first
  if (student.app) {
    // Student data fields
    if (['firstName', 'lastName', 'grade', 'plan', 'ssid', 'caseManagerId'].includes(field)) {
      const appValue = getNestedValue(student.app, `studentData.${field}`)
      if (appValue != null && appValue !== "") {
        return appValue
      }
    }
    
    // Date fields
    if (['reviewDate', 'reevalDate', 'meetingDate'].includes(field)) {
      const appValue = getNestedValue(student.app, `dates.${field}`)
      if (appValue != null && appValue !== "") {
        return appValue
      }
    }
    
    // Accommodation fields
    if (['instruction', 'assessment'].includes(field)) {
      const appValue = getNestedValue(student.app, `accommodations.${field}`)
      if (appValue != null && appValue !== "") {
        return appValue
      }
    }
    
    // Legacy flat app structure (fallback)
    const appValue = getNestedValue(student.app, field)
    if (appValue != null && appValue !== "") {
      return appValue
    }
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
  
  // Top-level field last (legacy/fallback)
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
 * @returns {string} — One of "Override", "App", "Aeries", "SEIS", "Top-level", or "—"
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
    return "Override"
  }
  
  // App form data - check categorized structure first
  if (student.app) {
    // Student data fields
    if (['firstName', 'lastName', 'grade', 'plan'].includes(field)) {
      const appValue = getNestedValue(student.app, `studentData.${field}`)
      if (appValue != null && appValue !== "") {
        return "App"
      }
    }
    
    // Date fields
    if (['reviewDate', 'reevalDate', 'meetingDate'].includes(field)) {
      const appValue = getNestedValue(student.app, `dates.${field}`)
      if (appValue != null && appValue !== "") {
        return "App"
      }
    }
    
    // Accommodation fields
    if (['instruction', 'assessment'].includes(field)) {
      const appValue = getNestedValue(student.app, `accommodations.${field}`)
      if (appValue != null && appValue !== "") {
        return "App"
      }
    }
    
    // Legacy flat app structure (fallback)
    const appValue = getNestedValue(student.app, field)
    if (appValue != null && appValue !== "") {
      return "App"
    }
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
    .split(/\n|\r|\d+\.\s+|\-\s+|;/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(item => `<li>${item}</li>`)
    .join("");
  return `<ul class="bullet-list">${items}</ul>`;
}

export function getStudentSchedule(student) {
  if (!student) return null;
  // App schedule (new structure)
  if (student.app && student.app.schedule && student.app.schedule.periods) {
    return student.app.schedule.periods;
  }
  // Aeries schedule.periods structure (your current format)
  if (student.aeries && student.aeries.schedule && student.aeries.schedule.periods) {
    return student.aeries.schedule.periods;
  }
  // Aeries schedule (map "Period 1" -> "1", etc.)
  if (student.aeries && student.aeries.schedule) {
    const aeriesPeriods = student.aeries.schedule;
    // Convert keys like "Period 1" to "1"
    const mapped = {};
    Object.keys(aeriesPeriods).forEach(key => {
      const match = key.match(/^Period (\d+)$/);
      if (match) {
        mapped[match[1]] = aeriesPeriods[key];
      }
    });
    return Object.keys(mapped).length ? mapped : null;
  }
  // Legacy schedule
  if (student.schedule) {
    return student.schedule;
  }
  return null;
}