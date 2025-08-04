import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase'
import CryptoJS from 'crypto-js'

class IEPSecurityHandler {
  constructor() {
    // This key should come from environment variables in production
    this.encryptionKey = import.meta.env.VITE_PDF_ENCRYPTION_KEY || 'default-dev-key-replace-in-production';
    
    // Read encryption toggle from environment (restored to original v1.1.4 behavior)
    this.encryptionEnabled = import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false';
    
    // Log encryption status
    console.log('🔒 IEP Encryption:', this.encryptionEnabled ? 'Enabled' : 'Disabled');
  }

  // Toggle encryption - now allowed in any environment
  setEncryptionEnabled(enabled) {
    this.encryptionEnabled = enabled;
    console.log('🔒 IEP Encryption:', this.encryptionEnabled ? 'Enabled' : 'Disabled');
    
    // Add warning if disabling in production
    if (process.env.NODE_ENV === 'production' && !enabled) {
      console.warn('⚠️ Warning: Encryption disabled in production environment');
    }
  }

  // Encrypt sensitive IEP fields
  encryptSensitiveFields(studentData) {
    // If encryption is disabled, return data as-is
    if (!this.encryptionEnabled) {
      console.log('🔓 Encryption disabled, returning raw data');
      return studentData;
    }

    const sensitiveFields = [
      'app.accommodations.assessment',
      'app.accommodations.instruction',
      'app.schedule.classServices',
      'app.studentData.plan'
    ];

    const encrypted = JSON.parse(JSON.stringify(studentData)); // Deep clone

    sensitiveFields.forEach(fieldPath => {
      const value = this.getNestedValue(encrypted, fieldPath);
      if (value) {
        const encryptedValue = this.encryptField(value);
        this.setNestedValue(encrypted, fieldPath, encryptedValue);
      }
    });

    return encrypted;
  }

  // Decrypt sensitive IEP fields
  decryptSensitiveFields(studentData) {
    // If encryption is disabled, return data as-is
    if (!this.encryptionEnabled) {
      console.log('🔓 Encryption disabled, returning raw data');
      return studentData;
    }

    const sensitiveFields = [
      'app.accommodations.assessment',
      'app.accommodations.instruction',
      'app.schedule.classServices',
      'app.studentData.plan'
    ];

    const decrypted = JSON.parse(JSON.stringify(studentData)); // Deep clone

    sensitiveFields.forEach(fieldPath => {
      const value = this.getNestedValue(decrypted, fieldPath);
      if (value) {
        const decryptedValue = this.decryptField(value);
        this.setNestedValue(decrypted, fieldPath, decryptedValue);
      }
    });

    return decrypted;
  }

  // Helper to encrypt a single field
  encryptField(value) {
    if (!this.encryptionEnabled) return value;

    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return CryptoJS.AES.encrypt(stringValue, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return value; // Return original value on error
    }
  }

  // Helper to decrypt a single field
  decryptField(encryptedValue) {
    if (!this.encryptionEnabled) return encryptedValue;

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedValue; // Return encrypted value on error
    }
  }

  // Helper to get nested object value
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, part) => current && current[part], obj);
  }

  // Helper to set nested object value
  setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((current, part) => current[part] = current[part] || {}, obj);
    target[last] = value;
    return obj;
  }

  // Log access to sensitive IEP data
  async logAccess(studentId, action, fields) {
    try {
      const logRef = doc(collection(db, 'iepAccessLogs'));
      await setDoc(logRef, {
        studentId,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        action,
        fields,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        encryptionEnabled: this.encryptionEnabled // Log encryption status
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  }

  // Verify user has permission to access IEP data
  async verifyAccess(studentId, requiredAccess = 'read') {
    if (!auth.currentUser) return false;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();

      // Admins have full access
      if (['admin', 'administrator', 'sped_chair'].includes(userData.role)) {
        return true;
      }

      // Case managers can access their assigned students
      if (userData.role === 'case_manager') {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const isAssigned = studentDoc.data()?.app?.studentData?.caseManagerId === auth.currentUser.uid;
        
        // Log access attempt
        await this.logAccess(studentId, `access_attempt_${requiredAccess}`, {
          success: isAssigned,
          role: 'case_manager'
        });
        
        return isAssigned;
      }

      // Teachers can only read their assigned students
      if (userData.role === 'teacher' && requiredAccess === 'read') {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        const schedule = studentDoc.data()?.app?.schedule?.periods || {};
        const isAssigned = Object.values(schedule).includes(auth.currentUser.uid);
        
        // Log access attempt
        await this.logAccess(studentId, `access_attempt_${requiredAccess}`, {
          success: isAssigned,
          role: 'teacher'
        });
        
        return isAssigned;
      }

      return false;
    } catch (error) {
      console.error('Access verification failed:', error);
      return false;
    }
  }

  // Get access history for a student
  async getAccessHistory(studentId) {
    try {
      const q = query(
        collection(db, 'iepAccessLogs'),
        where('studentId', '==', studentId),
        where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      );
      
      const logs = await getDocs(q);
      return logs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Failed to fetch access history:', error);
      return [];
    }
  }

  // Mask sensitive data for unauthorized users
  maskSensitiveData(studentData) {
    const masked = JSON.parse(JSON.stringify(studentData));
    
    // Mask accommodations
    if (masked.app?.accommodations) {
      masked.app.accommodations = {
        assessment: '[RESTRICTED]',
        instruction: '[RESTRICTED]'
      };
    }
    
    // Mask services
    if (masked.app?.schedule?.classServices) {
      masked.app.schedule.classServices = ['[RESTRICTED]'];
    }
    
    return masked;
  }

  // Development helper to check encryption status
  isEncryptionEnabled() {
    return this.encryptionEnabled;
  }

  // Helper to check if a value is encrypted
  isValueEncrypted(value) {
    try {
      if (typeof value !== 'string') return false;
      // Try to decrypt - if it works, it was encrypted
      CryptoJS.AES.decrypt(value, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      return true;
    } catch {
      return false;
    }
  }

  // Encrypt Gmail app password
  encryptGmailPassword(password) {
    if (!this.encryptionEnabled) {
      console.warn('⚠️ Warning: Encryption is disabled');
      return password;
    }
    return this.encryptField(password);
  }

  // Decrypt Gmail app password
  decryptGmailPassword(encryptedPassword) {
    if (!this.encryptionEnabled) return encryptedPassword;
    return this.decryptField(encryptedPassword);
  }

  // Get encryption status details
  getEncryptionStatus() {
    const viteEncryptionValue = import.meta.env.VITE_ENABLE_ENCRYPTION;
    const isViteSet = viteEncryptionValue !== undefined;
    
    return {
      enabled: this.encryptionEnabled,
      environment: process.env.NODE_ENV,
      keyAvailable: Boolean(this.encryptionKey),
      environmentVariable: process.env.VUE_APP_ENABLE_ENCRYPTION, // Legacy
      viteEncryptionValue: isViteSet ? viteEncryptionValue : null,
      isViteSet: isViteSet,
      viteEncryptionEnabled: this.encryptionEnabled
    };
  }
}

export const iepSecurityHandler = new IEPSecurityHandler(); 