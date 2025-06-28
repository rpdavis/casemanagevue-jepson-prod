// scripts/components/searchBar.js

export function createSearchBar(container, {
  placeholder,
  types = ['name'],            // default to name-only
  onSearch,
  onDeleteAll
}) {
  // Build the markup
  let html = '';
  if (types.length > 1) {
    html += types.map(t => `
      <input type="radio" name="search-type" value="${t}" id="srch-${t}"
             ${t===types[0]?'checked':''}>
      <label for="srch-${t}">Search by ${t.charAt(0).toUpperCase()+t.slice(1)}</label>
    `).join('');
  }
  html += `
    <input type="text" id="search-input" placeholder="${placeholder}"
           class="admin-search-input" autocomplete="off">
  `;
  if (onDeleteAll) {
    html += `<button id="delete-all" class="admin-btn">Delete All</button>`;
  }
  container.innerHTML = html;

  const input     = container.querySelector('#search-input');
  const radios    = types.length > 1
    ? container.querySelectorAll("input[name='search-type']")
    : null;
  const deleteBtn = onDeleteAll && container.querySelector('#delete-all');
  let debounceId;

  const trigger = () => {
    const type = radios
      ? container.querySelector("input[name='search-type']:checked").value
      : types[0];
    const term = input.value.trim();
    onSearch(type, term);
  };

  if (radios) {
    radios.forEach(r => r.addEventListener('change', () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(trigger, 300);
    }));
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(trigger, 300);
  });

  if (deleteBtn) {
    deleteBtn.addEventListener('click', onDeleteAll);
  }
}
