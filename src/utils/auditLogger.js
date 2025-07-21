import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase'

class AuditLogger {
  constructor() {
    this.enabled = true
  }

  async logStudentAccess(studentId, action, details = {}) {
    if (!this.enabled || !auth.currentUser) return

    try {
      const logRef = doc(collection(db, 'auditLogs'))
      await setDoc(logRef, {
        type: 'student_access',
        studentId,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        action, // 'view', 'edit', 'create', 'delete', 'export'
        details,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  async logUserManagement(targetUserId, action, details = {}) {
    if (!this.enabled || !auth.currentUser) return

    try {
      const logRef = doc(collection(db, 'auditLogs'))
      await setDoc(logRef, {
        type: 'user_management',
        targetUserId,
        performedBy: auth.currentUser.uid,
        performedByEmail: auth.currentUser.email,
        action, // 'create', 'update', 'delete', 'role_change'
        details,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  async logSystemAccess(action, details = {}) {
    if (!this.enabled || !auth.currentUser) return

    try {
      const logRef = doc(collection(db, 'auditLogs'))
      await setDoc(logRef, {
        type: 'system_access',
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        action, // 'login', 'logout', 'failed_login', 'settings_change'
        details,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  async logDataExport(exportType, studentIds, details = {}) {
    if (!this.enabled || !auth.currentUser) return

    try {
      const logRef = doc(collection(db, 'auditLogs'))
      await setDoc(logRef, {
        type: 'data_export',
        exportType, // 'csv', 'pdf', 'bulk_export'
        studentIds: Array.isArray(studentIds) ? studentIds : [studentIds],
        studentCount: Array.isArray(studentIds) ? studentIds.length : 1,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        details,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  getSessionId() {
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
    return sessionStorage.getItem('sessionId')
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'unknown'
    }
  }

  // For FERPA compliance reports
  async generateAccessReport(studentId, dateRange) {
    try {
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      
      // This would query auditLogs collection
      // Implementation depends on your reporting needs
      return {
        studentId,
        accessCount: 0,
        uniqueUsers: [],
        actions: [],
        timeRange: dateRange
      }
    } catch (error) {
      console.error('Report generation failed:', error)
      return null
    }
  }
}

export const auditLogger = new AuditLogger()
export default function useAuditLogger() {
  return {
    logStudentAccess: auditLogger.logStudentAccess.bind(auditLogger),
    logUserManagement: auditLogger.logUserManagement.bind(auditLogger),
    logSystemAccess: auditLogger.logSystemAccess.bind(auditLogger),
    logDataExport: auditLogger.logDataExport.bind(auditLogger),
    generateAccessReport: auditLogger.generateAccessReport.bind(auditLogger)
  }
} 