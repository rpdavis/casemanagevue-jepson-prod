// public/firebase/storage.js

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

/**
 * Uploads a File or Blob to Cloud Storage under the given path,
 * then returns its public download URL.
 *
 * @param {string} path - Storage path (e.g. "students/{id}/bip.pdf").
 * @param {File|Blob} file - Browser File or Blob to upload.
 * @returns {Promise<string>} - Download URL for the uploaded file.
 */
export async function uploadFile(path, file) {
  const storage = getStorage();
  const fileRef = storageRef(storage, path);
  const snapshot = await uploadBytes(fileRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Deletes an existing file from Cloud Storage.
 *
 * @param {string} path - Storage path of the file to delete.
 * @returns {Promise<void>}
 */
export async function deleteFile(path) {
  const storage = getStorage();
  const fileRef = storageRef(storage, path);
  await deleteObject(fileRef);
}
