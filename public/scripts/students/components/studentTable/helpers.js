// scripts/students/components/studentTable/helpers.js
// Shared utilities for studentTable cell renderers

import { getDisplayValue } from "../../../utils/studentUtils.js";

/**
 * Parse an ISO “YYYY-MM-DD” string as a Date at local midnight.
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns a CSS class based on how soon `dateStr` is.
 * @param {string|null} dateStr — ISO date string
 * @returns {string} one of "flag-critical", "flag-high", …, or "" if no date
 */
export function getDateUrgencyColor(dateStr) {
  if (!dateStr) return "";
  const today = new Date();
  const target = parseLocalDate(dateStr);
  const daysDiff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 0)  return "flag-critical";
  if (daysDiff <= 7)  return "flag-high";
  if (daysDiff <= 14) return "flag-medium";
  if (daysDiff <= 21) return "flag-mid";
  if (daysDiff <= 28) return "flag-low";
  if (daysDiff <= 35) return "flag-prep";
  if (daysDiff <= 60) return "flag-prep-reeval";
  return "";
}

/**
 * IEP meeting due date urgency badge
 */
export function getMeetingUrgencyColor(student) {
  return getDateUrgencyColor(getDisplayValue(student, "meeting_date"));
}

/**
 * Plan review due date urgency badge
 */
export function getReviewUrgencyColor(student) {
  return getDateUrgencyColor(getDisplayValue(student, "review_date"));
}

/**
 * Reevaluation due date urgency badge
 */
export function getReevalUrgencyColor(student) {
  return getDateUrgencyColor(getDisplayValue(student, "reeval_date"));
}

/**
 * Formats a newline- or bullet-delimited text block into an HTML list.
 * @param {string} text
 * @returns {string} HTML string for a bullet list or a placeholder
 */
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
