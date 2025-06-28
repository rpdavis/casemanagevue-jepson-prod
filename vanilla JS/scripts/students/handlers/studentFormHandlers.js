// studentFormHandlers.js in public/components/handlers

import { db } from "../../config/config.js";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc, // ADDED: for createStudent
  deleteDoc, // ADDED: for deleting flagged records and documents
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { uploadFile, deleteFile } from "../../config/storage.js"; // ADDED: for file operations
import { collectStudentFormData } from "../components/studentForm.js"; // ADDED: to collect form data

/**
 * Extracts the Cloud Storage path segment from a full download URL.
 * @param {string} url
 * @returns {string}
 */
function extractStoragePathFromUrl(url) {
  if (!url) return "";
  const match = url.match(/\/o\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Handles the creation of a new student record, including file uploads.
 * @param {HTMLElement} formElement - The form element from which to collect data.
 * @returns {Promise<string>} - Resolves with the new student's Firestore doc ID.
 */
export async function createStudentRecord(formElement) {
  const {
    bipFile,
    atAGlanceFile,
    ...studentData
  } = collectStudentFormData(formElement);

  let bipUrl = null;
  let atAGlanceUrl = null;

  try {
    // Upload BIP file if selected
    if (bipFile) {
      const bipPath = `bips/${studentData.first_name}_${studentData.last_name}_${Date.now()}.pdf`;
      bipUrl = await uploadFile(bipPath, bipFile);
    }

    // Upload At-A-Glance file if selected
    if (atAGlanceFile) {
      const agPath = `ataglance/${studentData.first_name}_${studentData.last_name}_${Date.now()}.pdf`;
      atAGlanceUrl = await uploadFile(agPath, atAGlanceFile);
    }

    // Compose the Firestore record
    const newRecord = {
      ...studentData,
      ...(bipUrl && { bip_pdf_url: bipUrl }),
      ...(atAGlanceUrl && { ataglance_pdf_url: atAGlanceUrl }),
      createdAt: serverTimestamp()
    };

    // Save the new student document to Firestore
    const docRef = await addDoc(collection(db, "students"), newRecord);
    
    // Handle flagging if necessary (assuming flag1 determines if student is flagged)
    if (studentData.flag1) {
      await setDoc(doc(db, "flagged", docRef.id), { studentId: docRef.id });
    }

    return docRef.id; // Return the ID of the newly created document
  } catch (err) {
    console.error("Error creating student record:", err);
    // Optionally, clean up uploaded files if Firestore save fails
    if (bipUrl) await deleteFile(extractStoragePathFromUrl(bipUrl)).catch(e => console.error("Failed to cleanup BIP:", e));
    if (atAGlanceUrl) await deleteFile(extractStoragePathFromUrl(atAGlanceUrl)).catch(e => console.error("Failed to cleanup At-A-Glance:", e));
    throw new Error("Failed to create student record: " + err.message);
  }
}

/**
 * Handles the update of an existing student record, including file uploads/deletions.
 * @param {string} studentId - The Firestore doc ID of the student to update.
 * @param {HTMLElement} formElement - The form element from which to collect data.
 * @param {Object} currentStudentData - The existing student data from Firestore (needed for file URL comparison).
 * @param {Object} deleteFlags - Object indicating which existing files to delete (e.g., { bip: true, ataglance: false }).
 */
export async function updateStudentRecord(studentId, formElement, currentStudentData, deleteFlags = {}) {
  const {
    bipFile,
    atAGlanceFile,
    ...updatedData
  } = collectStudentFormData(formElement);

  const updates = { ...updatedData }; // Start with collected form data

  try {
    // 1. Handle deletion of existing files (if deleteFlags are set)
    if (deleteFlags.bip && currentStudentData.bip_pdf_url) {
      const oldPath = extractStoragePathFromUrl(currentStudentData.bip_pdf_url);
      if (oldPath) {
        await deleteFile(oldPath);
        updates.bip_pdf_url = null; // Mark for removal from Firestore
      }
    }
    if (deleteFlags.ataglance && currentStudentData.ataglance_pdf_url) {
      const oldPath = extractStoragePathFromUrl(currentStudentData.ataglance_pdf_url);
      if (oldPath) {
        await deleteFile(oldPath);
        updates.ataglance_pdf_url = null; // Mark for removal from Firestore
      }
    }

    // 2. Handle upload/replacement of BIP file
    if (bipFile) {
      // If there was an old BIP and it's being replaced, delete the old one first
      if (currentStudentData.bip_pdf_url && !deleteFlags.bip) { // Don't delete if already explicitly marked for deletion
        const oldPath = extractStoragePathFromUrl(currentStudentData.bip_pdf_url);
        if (oldPath) await deleteFile(oldPath);
      }
      const bipPath = `bips/${studentId}.pdf`; // Standardize filename
      updates.bip_pdf_url = await uploadFile(bipPath, bipFile);
    } else if (updates.bip_pdf_url === undefined && currentStudentData.bip_pdf_url && !deleteFlags.bip) {
      // If no new file selected, and not explicitly deleted, keep existing URL
      updates.bip_pdf_url = currentStudentData.bip_pdf_url;
    }


    // 3. Handle upload/replacement of At-A-Glance file
    if (atAGlanceFile) {
      // If there was an old At-A-Glance and it's being replaced, delete the old one first
      if (currentStudentData.ataglance_pdf_url && !deleteFlags.ataglance) { // Don't delete if already explicitly marked for deletion
        const oldPath = extractStoragePathFromUrl(currentStudentData.ataglance_pdf_url);
        if (oldPath) await deleteFile(oldPath);
      }
      const agPath = `ataglance/${studentId}.pdf`; // Standardize filename
      updates.ataglance_pdf_url = await uploadFile(agPath, atAGlanceFile);
    } else if (updates.ataglance_pdf_url === undefined && currentStudentData.ataglance_pdf_url && !deleteFlags.ataglance) {
      // If no new file selected, and not explicitly deleted, keep existing URL
      updates.ataglance_pdf_url = currentStudentData.ataglance_pdf_url;
    }

    // 4. Update flagged collection based on new flag1 status
    if (updates.flag1) {
      await setDoc(doc(db, "flagged", studentId), { studentId });
    } else {
      await deleteDoc(doc(db, "flagged", studentId));
    }

    // 5. Persist updated student data to Firestore
    updates.updatedAt = serverTimestamp(); // Set updatedAt timestamp
    await updateDoc(doc(db, "students", studentId), updates);

  } catch (err) {
    console.error("Error updating student record:", err);
    throw new Error("Failed to update student record: " + err.message);
  }
}
