const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

initializeApp({ projectId: "case-manager-app-9125d" }); // Match your project ID
const db = getFirestore();
db.settings({ host: "localhost:8080", ssl: false }); // Connect to Firestore Emulator

async function loadSeedData() {
  const data = JSON.parse(fs.readFileSync("./seed/firestore_seed_data.json", "utf8"));

  for (const user of data.users) {
    await db.collection("users").doc(user.user_id).set(user);
  }

  for (const student of data.students) {
    await db.collection("students").doc(student.student_id).set(student);
  }

  for (const goal of data.iep_goals) {
    await db.collection("iep_goals").doc(goal.goal_id).set(goal);
  }

  for (const acc of data.accommodations) {
    await db.collection("accommodations").doc(acc.accommodation_id).set(acc);
  }

  for (const sca of data.student_class_assignments) {
    await db.collection("student_class_assignments").doc(sca.assignment_id).set({
      ...sca,
      period: String(sca.period), // ✅ Force period to be string
    });
  }

  console.log("✅ Seed data loaded into Firestore Emulator");
  process.exit(0);
}

loadSeedData();
