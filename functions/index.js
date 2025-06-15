// functions/index.js

const functions = require("firebase-functions");
// Use the modular admin SDK imports:
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// Init
initializeApp();
const db = getFirestore();

exports.saveAccommodations = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");

  if (req.method !== "POST") {
    return res.status(405).json({error: "Only POST allowed"});
  }

  const {instruction, assessment} = req.body;
  if (!Array.isArray(instruction) || !Array.isArray(assessment)) {
    return res.status(400).json({
      error: "Invalid data format: instruction & assessment must be arrays",
      received: req.body,
    });
  }

  try {
    const docRef = await db.collection("accommodation_entries").add({
      instruction,
      assessment,
      timestamp: FieldValue.serverTimestamp(), // <-- now defined!
    });
    console.log("✅ Saved entry:", docRef.id);
    return res.status(200).json({
      message: "Accommodations saved successfully",
      docId: docRef.id,
    });
  } catch (err) {
    console.error("❌ Error saving accommodations:", err);
    return res.status(500).json({
      error: "Error saving accommodations",
      details: err.message,
      stack: err.stack,
    });
  }
});
