import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Migration utility to convert from SSID-based document IDs to Firebase auto-generated IDs
 * This preserves all data while improving security
 */
export async function migrateStudentIds() {
  console.log('Starting student ID migration...')
  
  try {
    // Get all existing students
    const studentsRef = collection(db, 'students')
    const querySnapshot = await getDocs(studentsRef)
    
    console.log(`Found ${querySnapshot.size} students to migrate`)
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const studentDoc of querySnapshot.docs) {
      const studentData = studentDoc.data()
      const currentId = studentDoc.id
      
      // Check if this is already using auto-generated ID (not numeric)
      if (!/^\d+$/.test(currentId)) {
        console.log(`Student ${currentId} already uses auto-generated ID, skipping`)
        continue
      }
      
      // Extract SSID from the document ID
      const ssid = currentId
      
      try {
        // Create new document with auto-generated ID
        const newStudentRef = doc(collection(db, 'students'))
        
        // Ensure SSID is stored in the app data structure
        const migratedData = {
          ...studentData,
          app: {
            ...studentData.app,
            studentData: {
              ...studentData.app?.studentData,
              ssid: ssid
            }
          },
          migratedFrom: currentId,
          migratedAt: new Date().toISOString()
        }
        
        // Save to new document
        await setDoc(newStudentRef, migratedData)
        
        // Delete old document
        await deleteDoc(doc(db, 'students', currentId))
        
        console.log(`✅ Migrated student ${currentId} → ${newStudentRef.id}`)
        migratedCount++
        
      } catch (error) {
        console.error(`❌ Failed to migrate student ${currentId}:`, error)
        errorCount++
      }
    }
    
    console.log(`Migration complete: ${migratedCount} migrated, ${errorCount} errors`)
    return { migratedCount, errorCount }
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Verify migration by checking that all students have SSID in their app data
 */
export async function verifyMigration() {
  console.log('Verifying migration...')
  
  try {
    const studentsRef = collection(db, 'students')
    const querySnapshot = await getDocs(studentsRef)
    
    let verifiedCount = 0
    let issuesCount = 0
    
    for (const studentDoc of querySnapshot.docs) {
      const studentData = studentDoc.data()
      const studentId = studentDoc.id
      
      // Check if SSID is properly stored in app data
      const ssid = studentData.app?.studentData?.ssid
      
      if (ssid) {
        console.log(`✅ Student ${studentId} has SSID: ${ssid}`)
        verifiedCount++
      } else {
        console.warn(`⚠️ Student ${studentId} missing SSID in app data`)
        issuesCount++
      }
    }
    
    console.log(`Verification complete: ${verifiedCount} verified, ${issuesCount} issues`)
    return { verifiedCount, issuesCount }
    
  } catch (error) {
    console.error('Verification failed:', error)
    throw error
  }
}

/**
 * Find student by SSID (for backward compatibility)
 */
export async function findStudentBySSID(ssid) {
  try {
    const studentsRef = collection(db, 'students')
    const q = query(studentsRef, where('app.studentData.ssid', '==', ssid))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const studentDoc = querySnapshot.docs[0]
      return {
        id: studentDoc.id,
        ...studentDoc.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding student by SSID:', error)
    throw error
  }
} 