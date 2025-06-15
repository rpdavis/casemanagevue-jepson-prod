import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

export function renderNav(user) {
  const nav = document.createElement("header");
  nav.id = "nav";
  nav.innerHTML = `
    <div class="nav-left">
      <div class="dropdown">
        <button class="dropbtn">&#9776;</button>
        <div class="dropdown-content">
          <a href="home.html">Students</a>
          <a href="add.html">Add Student</a>
          <a href="testing.html">Testing</a>
          ${user.role === 'admin' ? `<a href="admin.html">Admin Panel</a>` : ""}
          <a href="#" id="logout">Logout</a>
        </div>
      </div>
    </div>
    <div class="nav-right">
      <span id="user-info">Logged in as: ${user.name} (${user.role})</span>
    </div>
  `;

  setTimeout(() => {
    const dropBtn = nav.querySelector(".dropbtn");
    const dropdown = nav.querySelector(".dropdown");
    dropBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
    });
    nav.querySelector("#logout")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await signOut(getAuth());
      location.href = "/login.html";
    });
  }, 0);

  return nav;
}