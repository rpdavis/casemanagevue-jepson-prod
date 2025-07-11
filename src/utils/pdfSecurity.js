import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore'
import { storage, db, auth } from '@/firebase'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'

class SecurePdfHandler {
  constructor() {
    // In production, this key should come from environment variables
    this.encryptionKey = process.env.VUE_APP_PDF_ENCRYPTION_KEY || 'your-dev-key-here';
  }

  async encryptAndUploadPdf(file, studentId) {
    try {
      // Read PDF as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert to Base64 for encryption
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Encrypt the PDF content
      const encrypted = CryptoJS.AES.encrypt(base64, this.encryptionKey).toString();
      
      // Generate a unique filename
      const secureFileName = `${uuidv4()}.enc`;
      
      // Upload encrypted content
      const storageRef = ref(storage, `encrypted-pdfs/${studentId}/${secureFileName}`);
      await uploadString(storageRef, encrypted);
      
      // Store metadata in Firestore
      await setDoc(doc(db, 'pdfMetadata', secureFileName), {
        originalName: file.name,
        studentId: studentId,
        uploadedBy: auth.currentUser.uid,
        uploadedAt: serverTimestamp(),
        accessCount: 0,
        lastAccessed: null,
        encryptionVersion: '1.0',
        fileSize: file.size,
        mimeType: file.type
      });

      return secureFileName;
    } catch (error) {
      console.error('PDF encryption failed:', error);
      throw new Error('Failed to securely store PDF');
    }
  }

  async downloadAndDecryptPdf(secureFileName, studentId) {
    try {
      // Check access permissions
      const userHasAccess = await this.verifyAccess(studentId);
      if (!userHasAccess) {
        throw new Error('Access denied');
      }

      // Log access attempt
      await this.logAccess(secureFileName, studentId);

      // Download encrypted content
      const storageRef = ref(storage, `encrypted-pdfs/${studentId}/${secureFileName}`);
      const downloadUrl = await getDownloadURL(storageRef);
      const response = await fetch(downloadUrl);
      const encrypted = await response.text();

      // Decrypt content
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      
      // Convert back to PDF
      const pdfContent = atob(decrypted);
      
      // Create Blob for download
      const pdfBlob = new Blob(
        [new Uint8Array(pdfContent.split('').map(char => char.charCodeAt(0)))],
        { type: 'application/pdf' }
      );

      // Update access count
      await this.updateAccessMetadata(secureFileName);

      return pdfBlob;
    } catch (error) {
      console.error('PDF decryption failed:', error);
      throw new Error('Failed to retrieve PDF');
    }
  }

  async verifyAccess(studentId) {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Check role-based access
      if (['admin', 'administrator', 'sped_chair'].includes(userData.role)) {
        return true;
      }

      // Check case manager access
      if (userData.role === 'case_manager') {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        return studentDoc.data()?.app?.studentData?.caseManagerId === user.uid;
      }

      // Check if teacher has this student
      if (userData.role === 'teacher') {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const schedule = studentDoc.data()?.app?.schedule?.periods || {};
        return Object.values(schedule).includes(user.uid);
      }

      return false;
    } catch (error) {
      console.error('Access verification failed:', error);
      return false;
    }
  }

  async logAccess(fileId, studentId) {
    try {
      await setDoc(doc(db, 'pdfAccessLogs', `${fileId}_${Date.now()}`), {
        fileId,
        studentId,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        accessTime: serverTimestamp(),
        userAgent: navigator.userAgent,
        accessType: 'download'
      });
    } catch (error) {
      console.error('Failed to log access:', error);
      // Continue execution even if logging fails
    }
  }

  async updateAccessMetadata(fileId) {
    try {
      const metadataRef = doc(db, 'pdfMetadata', fileId);
      const metadata = await getDoc(metadataRef);
      
      if (metadata.exists()) {
        await setDoc(metadataRef, {
          ...metadata.data(),
          accessCount: (metadata.data().accessCount || 0) + 1,
          lastAccessed: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to update access metadata:', error);
    }
  }

  async getFileAccessHistory(fileId) {
    try {
      const q = query(
        collection(db, 'pdfAccessLogs'),
        where('fileId', '==', fileId),
        orderBy('accessTime', 'desc')
      );
      
      const logs = await getDocs(q);
      return logs.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Failed to fetch access history:', error);
      return [];
    }
  }
}

export const securePdfHandler = new SecurePdfHandler(); 