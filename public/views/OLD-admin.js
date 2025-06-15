import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export async function showAdminView(main) {
  const db = getFirestore();
  const container = document.createElement("div");

  container.innerHTML = `
    <h1>Admin Panel</h1>

    <section>
      <h2>Upload Teachers from JSON</h2>
      <input type="file" id="teacher-json" accept="application/json">
      <button id="upload-teachers">Upload Teachers</button>
      <div id="upload-status-teachers" style="margin-top:1rem;"></div>
    </section>

    <section style="margin-top:2rem;">
      <h2>Upload Students from JSON</h2>
      <input type="file" id="student-json" accept="application/json">
      <button id="upload-students">Upload Students</button>
      <div id="upload-status-students" style="margin-top:1rem;"></div>
    </section>

    <section style="margin-top:2rem;">
      <h2>Add Individual User</h2>
      <label for="user-name">Name:</label>
      <input type="text" id="user-name" placeholder="Full Name"><br><br>

      <label for="user-email">Email:</label>
      <input type="email" id="user-email" placeholder="user@school.org"><br><br>

      <label for="user-role">Role:</label>
      <select id="user-role">
        <option value="teacher">Teacher</option>
        <option value="case_manager">Case Manager</option>
        <option value="service_provider">Service Provider</option>
        <option value="admin">Admin</option>
      </select><br><br>

      <button id="add-user-button">Add User</button>
      <div id="add-user-status" style="margin-top: 1rem;"></div>
    </section>
  `;

  main.innerHTML = "";
  main.appendChild(container);

  // === Upload Teachers from JSON ===
  document.getElementById("upload-teachers").addEventListener("click", async () => {
    const fileInput = document.getElementById("teacher-json");
    const status = document.getElementById("upload-status-teachers");

    if (!fileInput.files.length) {
      status.textContent = "No file selected.";
      return;
    }

    try {
      const file = fileInput.files[0];
      const text = await file.text();
      const data = JSON.parse(text);
      const batch = data.users || [];

      for (const user of batch) {
        const safeId = user.email.replace(/[.#$[\]]/g, "_");
        await setDoc(doc(db, "users", safeId), user);
      }

      status.textContent = "✅ Teachers uploaded successfully.";
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Failed to upload teachers.";
    }
  });

  // === Upload Students from JSON ===
  document.getElementById("upload-students").addEventListener("click", async () => {
    const fileInput = document.getElementById("student-json");
    const status = document.getElementById("upload-status-students");

    if (!fileInput.files.length) {
      status.textContent = "No file selected.";
      return;
    }

    try {
      const file = fileInput.files[0];
      const text = await file.text();
      const data = JSON.parse(text);
      const batch = data.students || [];

      for (const student of batch) {
        const id = student.student_id || `${student.first_name}_${student.last_name}_${Date.now()}`;
        await setDoc(doc(db, "students", id), student);
      }

      status.textContent = "✅ Students uploaded successfully.";
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Failed to upload students.";
    }
  });

  // === Add Individual User ===
  document.getElementById("add-user-button").addEventListener("click", async () => {
    const name = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim().toLowerCase();
    const role = document.getElementById("user-role").value;
    const status = document.getElementById("add-user-status");

    if (!name || !email || !role) {
      status.textContent = "All fields are required.";
      return;
    }

    try {
      const safeEmailId = email.replace(/[.#$[\]]/g, "_");
      const userRef = doc(db, "users", safeEmailId);
      const existingSnap = await getDoc(userRef);

      if (existingSnap.exists()) {
        status.textContent = "⚠️ User already exists.";
        return;
      }

      await setDoc(userRef, { name, email, role });
      status.textContent = `✅ ${name} added as ${role}.`;

      document.getElementById("user-name").value = "";
      document.getElementById("user-email").value = "";
      document.getElementById("user-role").value = "teacher";
    } catch (err) {
      console.error("Add user error:", err);
      status.textContent = "❌ Error adding user. See console.";
    }
  });
}
