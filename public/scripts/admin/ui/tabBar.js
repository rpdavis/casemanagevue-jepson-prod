// scripts/admin/tabBar.js
export function createTabBar(tabs, onSelect) {
  const bar = document.createElement("div");
  bar.id = "tab-bar";
  bar.className = "admin-tab0bar";
  tabs.forEach(({ key, label }, i) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = key;
    if (i===0) btn.classList.add("active");
    btn.addEventListener("click", () => onSelect(key));
    bar.appendChild(btn);
  });
  return bar;
}
