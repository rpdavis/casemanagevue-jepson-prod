import { showPermissionsMatrix } from './ui.js';

/**
 * Permissions Section for Admin Panel
 * @param {HTMLElement} main
 */
export function showPermissionsSection(main) {
  const section = document.createElement('section');
  section.id = 'admin-permissions-section';
  section.style.margin = '2em 0';
  main.appendChild(section);
  showPermissionsMatrix(section);
}

console.log("perm");