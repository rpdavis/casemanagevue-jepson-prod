export function getDisplayValue(student, key, defaultValue = '—') {
  return student.overrides?.[key] ?? student[key] ?? defaultValue;
}

export function getSourceValue(student, key) {
  return student[key] ?? '—';
}

export function labelize(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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