// Admin: App presentation and appearance settings
export function showPresentationSection(main) {
  const section = document.createElement("section");
  section.style.marginTop = "2rem";
  section.innerHTML = `<h2>App Presentation</h2>
    <p>Functionality for customizing app appearance will go here.</p>`;
  main.appendChild(section);
}