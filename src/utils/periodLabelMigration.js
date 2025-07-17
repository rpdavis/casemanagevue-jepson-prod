import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase'
import { usePeriodLabels } from '@/composables/usePeriodLabels'

/**
 * Migration utility to convert schedule keys from labels to numeric format
 * This should be run once after implementing the new period label system
 */

export async function migratePeriodLabelsToNumeric() {
  console.log('🔄 Starting period label migration...')
  
  const { getNumber, labels } = usePeriodLabels()
  let totalStudents = 0
  let migratedStudents = 0
  let errors = []

  try {
    // Get all students
    const studentsRef = collection(db, 'students')
    const snapshot = await getDocs(studentsRef)
    totalStudents = snapshot.size

    console.log(`📊 Found ${totalStudents} students to check`)

    for (const studentDoc of snapshot.docs) {
      try {
        const studentData = studentDoc.data()
        let needsUpdate = false
        let newSchedule = {}

        // Check if schedule needs migration
        const schedule = studentData.app?.schedule?.periods || studentData.schedule || {}
        
        Object.entries(schedule).forEach(([key, value]) => {
          // If key is not numeric, try to convert it
          if (isNaN(parseInt(key))) {
            const numericKey = getNumber(key)
            if (numericKey) {
              newSchedule[numericKey] = value
              needsUpdate = true
              console.log(`🔧 Converting "${key}" → ${numericKey} for student ${studentDoc.id}`)
            } else {
              // Try to match against known patterns
              const match = key.match(/^(?:period|per)(\d+)$/i)
              if (match) {
                newSchedule[parseInt(match[1])] = value
                needsUpdate = true
                console.log(`🔧 Converting "${key}" → ${match[1]} for student ${studentDoc.id}`)
              } else {
                console.warn(`⚠️ Could not convert period key "${key}" for student ${studentDoc.id}`)
                // Keep the original key as fallback
                newSchedule[key] = value
              }
            }
          } else {
            // Already numeric, keep as-is
            newSchedule[key] = value
          }
        })

        // Update the document if needed
        if (needsUpdate) {
          const updateData = {}
          
          // Update the correct path based on data structure
          if (studentData.app?.schedule?.periods) {
            updateData['app.schedule.periods'] = newSchedule
          } else if (studentData.schedule) {
            updateData.schedule = newSchedule
          }

          if (Object.keys(updateData).length > 0) {
            await updateDoc(doc(db, 'students', studentDoc.id), updateData)
            migratedStudents++
            console.log(`✅ Updated student ${studentDoc.id}`)
          }
        }

      } catch (error) {
        console.error(`❌ Error processing student ${studentDoc.id}:`, error)
        errors.push({ studentId: studentDoc.id, error: error.message })
      }
    }

    console.log('🎉 Migration completed!')
    console.log(`📈 Results:`)
    console.log(`   - Total students checked: ${totalStudents}`)
    console.log(`   - Students migrated: ${migratedStudents}`)
    console.log(`   - Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.warn('⚠️ Errors encountered:')
      errors.forEach(({ studentId, error }) => {
        console.warn(`   - ${studentId}: ${error}`)
      })
    }

    return {
      success: true,
      totalStudents,
      migratedStudents,
      errors
    }

  } catch (error) {
    console.error('💥 Migration failed:', error)
    return {
      success: false,
      error: error.message,
      totalStudents,
      migratedStudents,
      errors
    }
  }
}

/**
 * Dry run migration - shows what would be changed without actually updating
 */
export async function previewPeriodLabelMigration() {
  console.log('👀 Starting migration preview...')
  
  const { getNumber } = usePeriodLabels()
  let totalStudents = 0
  let studentsNeedingMigration = []

  try {
    const studentsRef = collection(db, 'students')
    const snapshot = await getDocs(studentsRef)
    totalStudents = snapshot.size

    for (const studentDoc of snapshot.docs) {
      const studentData = studentDoc.data()
      const schedule = studentData.app?.schedule?.periods || studentData.schedule || {}
      
      let changes = []
      Object.keys(schedule).forEach(key => {
        if (isNaN(parseInt(key))) {
          const numericKey = getNumber(key)
          if (numericKey) {
            changes.push({ from: key, to: numericKey })
          } else {
            const match = key.match(/^(?:period|per)(\d+)$/i)
            if (match) {
              changes.push({ from: key, to: parseInt(match[1]) })
            }
          }
        }
      })

      if (changes.length > 0) {
        studentsNeedingMigration.push({
          id: studentDoc.id,
          name: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          changes
        })
      }
    }

    console.log('📋 Migration Preview Results:')
    console.log(`   - Total students: ${totalStudents}`)
    console.log(`   - Students needing migration: ${studentsNeedingMigration.length}`)
    
    if (studentsNeedingMigration.length > 0) {
      console.log('   - Changes needed:')
      studentsNeedingMigration.forEach(student => {
        console.log(`     📝 ${student.name} (${student.id}):`)
        student.changes.forEach(change => {
          console.log(`        "${change.from}" → ${change.to}`)
        })
      })
    }

    return {
      totalStudents,
      studentsNeedingMigration,
      changesNeeded: studentsNeedingMigration.length > 0
    }

  } catch (error) {
    console.error('💥 Preview failed:', error)
    return {
      error: error.message,
      totalStudents: 0,
      studentsNeedingMigration: [],
      changesNeeded: false
    }
  }
} 