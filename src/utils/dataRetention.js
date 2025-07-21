import { collection, query, where, getDocs, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

class DataRetentionManager {
  constructor() {
    this.policies = {
      auditLogs: { retentionYears: 7 }, // FERPA requires 7 years for audit logs
      iepAccessLogs: { retentionYears: 7 },
      pdfAccessLogs: { retentionYears: 7 },
      studentData: { retentionYears: 10 }, // IEP data retention
      backups: { retentionMonths: 12 }
    }
  }

  async enforceRetentionPolicy(collectionName) {
    const policy = this.policies[collectionName]
    if (!policy) {
      console.warn(`No retention policy defined for collection: ${collectionName}`)
      return
    }

    try {
      console.log(`🗂️ Enforcing retention policy for ${collectionName}`)
      
      const cutoffDate = this.calculateCutoffDate(policy)
      const q = query(
        collection(db, collectionName),
        where('timestamp', '<', cutoffDate)
      )
      
      const snapshot = await getDocs(q)
      const deletionPromises = []
      
      snapshot.docs.forEach(docSnapshot => {
        deletionPromises.push(deleteDoc(docSnapshot.ref))
      })
      
      await Promise.all(deletionPromises)
      
      // Log retention action
      await this.logRetentionAction(collectionName, snapshot.size, cutoffDate)
      
      console.log(`🗂️ Deleted ${snapshot.size} expired records from ${collectionName}`)
      
    } catch (error) {
      console.error(`Failed to enforce retention policy for ${collectionName}:`, error)
    }
  }

  calculateCutoffDate(policy) {
    const now = new Date()
    
    if (policy.retentionYears) {
      now.setFullYear(now.getFullYear() - policy.retentionYears)
    } else if (policy.retentionMonths) {
      now.setMonth(now.getMonth() - policy.retentionMonths)
    } else if (policy.retentionDays) {
      now.setDate(now.getDate() - policy.retentionDays)
    }
    
    return now
  }

  async logRetentionAction(collectionName, recordsDeleted, cutoffDate) {
    try {
      const logRef = doc(collection(db, 'retentionLogs'))
      await setDoc(logRef, {
        collection: collectionName,
        recordsDeleted,
        cutoffDate,
        executedAt: serverTimestamp(),
        policy: this.policies[collectionName]
      })
    } catch (error) {
      console.error('Failed to log retention action:', error)
    }
  }

  // Run all retention policies
  async runAllRetentionPolicies() {
    const collections = Object.keys(this.policies)
    
    for (const collectionName of collections) {
      await this.enforceRetentionPolicy(collectionName)
    }
  }

  // For FERPA compliance - generate retention report
  async generateRetentionReport() {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        policies: this.policies,
        collections: {}
      }

      for (const collectionName of Object.keys(this.policies)) {
        const collectionRef = collection(db, collectionName)
        const snapshot = await getDocs(collectionRef)
        
        report.collections[collectionName] = {
          totalRecords: snapshot.size,
          oldestRecord: null,
          newestRecord: null
        }

        // Find oldest and newest records
        const docs = snapshot.docs
        if (docs.length > 0) {
          const timestamps = docs
            .map(doc => doc.data().timestamp?.toDate())
            .filter(ts => ts)
            .sort((a, b) => a - b)
          
          if (timestamps.length > 0) {
            report.collections[collectionName].oldestRecord = timestamps[0].toISOString()
            report.collections[collectionName].newestRecord = timestamps[timestamps.length - 1].toISOString()
          }
        }
      }

      return report
    } catch (error) {
      console.error('Failed to generate retention report:', error)
      return null
    }
  }

  // Check if data is approaching retention deadline
  async checkRetentionWarnings() {
    const warnings = []
    
    for (const [collectionName, policy] of Object.entries(this.policies)) {
      try {
        const warningDate = this.calculateCutoffDate({
          ...policy,
          retentionYears: policy.retentionYears ? policy.retentionYears - 1 : undefined,
          retentionMonths: policy.retentionMonths ? policy.retentionMonths - 1 : undefined
        })
        
        const q = query(
          collection(db, collectionName),
          where('timestamp', '<', warningDate)
        )
        
        const snapshot = await getDocs(q)
        
        if (snapshot.size > 0) {
          warnings.push({
            collection: collectionName,
            recordsNearExpiration: snapshot.size,
            policy,
            warningDate
          })
        }
      } catch (error) {
        console.error(`Failed to check retention warnings for ${collectionName}:`, error)
      }
    }
    
    return warnings
  }
}

export const dataRetentionManager = new DataRetentionManager()

export default function useDataRetention() {
  return {
    enforceRetentionPolicy: dataRetentionManager.enforceRetentionPolicy.bind(dataRetentionManager),
    runAllRetentionPolicies: dataRetentionManager.runAllRetentionPolicies.bind(dataRetentionManager),
    generateRetentionReport: dataRetentionManager.generateRetentionReport.bind(dataRetentionManager),
    checkRetentionWarnings: dataRetentionManager.checkRetentionWarnings.bind(dataRetentionManager)
  }
} 