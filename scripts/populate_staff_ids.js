#!/usr/bin/env node

// Script to manually trigger staffIds population for all students
// This will fix the issue where teachers can't see their students

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('../functions/service-account.json');
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'casemangervue'
});

const db = getFirestore();

async function populateStaffIds() {
  console.log('🔧 Starting staffIds population for all students...');
  
  try {
    // Get all student documents
    const studentsSnapshot = await db.collection('students').get();
    console.log(`📚 Found ${studentsSnapshot.size} students to process`);
    
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    // Process each student
    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();
      
      try {
        console.log(`\n🔍 Processing student ${studentId}...`);
        
        // Build staffIds array
        const staffIds = new Set();
        
        // Add case manager
        const caseManagerId = studentData.app?.studentData?.caseManagerId;
        if (caseManagerId) {
          staffIds.add(caseManagerId);
          console.log(`  ✅ Added case manager: ${caseManagerId}`);
        }
        
        // Add teachers from schedule
        const schedule = studentData.app?.schedule?.periods || {};
        Object.entries(schedule).forEach(([period, data]) => {
          if (typeof data === 'string' && data) {
            // Simple string format (legacy)
            staffIds.add(data);
            console.log(`  ✅ Added teacher from period ${period}: ${data}`);
          } else if (typeof data === 'object' && data) {
            // Object format with potential co-teaching
            if (data.teacherId) {
              staffIds.add(data.teacherId);
              console.log(`  ✅ Added teacher from period ${period}: ${data.teacherId}`);
            }
            if (data.coTeaching?.caseManagerId) {
              staffIds.add(data.coTeaching.caseManagerId);
              console.log(`  ✅ Added co-teaching CM from period ${period}: ${data.coTeaching.caseManagerId}`);
            }
          }
        });
        
        // Add service providers
        const providers = studentData.app?.providers || {};
        Object.entries(providers).forEach(([providerType, providerId]) => {
          if (providerId) {
            staffIds.add(providerId);
            console.log(`  ✅ Added ${providerType} provider: ${providerId}`);
          }
        });
        
        // Convert to array
        const staffIdsArray = Array.from(staffIds).sort();
        
        // Check if update is needed
        const existingStaffIds = studentData.app?.staffIds || [];
        const existingSorted = [...existingStaffIds].sort();
        const hasChanged = JSON.stringify(existingSorted) !== JSON.stringify(staffIdsArray);
        
        if (hasChanged || staffIdsArray.length === 0) {
          // Update the student document
          await db.collection('students').doc(studentId).update({
            'app.staffIds': staffIdsArray,
            'app.lastStaffIdsUpdate': new Date()
          });
          
          console.log(`  🎯 Updated student ${studentId} with ${staffIdsArray.length} staff members`);
          console.log(`  📋 Staff IDs: [${staffIdsArray.join(', ')}]`);
          updated++;
        } else {
          console.log(`  ⏭️  Student ${studentId} already has correct staffIds`);
        }
        
        processed++;
        
      } catch (error) {
        console.error(`  ❌ Error processing student ${studentId}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`  📚 Total students processed: ${processed}`);
    console.log(`  ✅ Students updated: ${updated}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log('\n🎉 Staff IDs population completed!');
    
    if (updated > 0) {
      console.log('\n💡 Teachers should now be able to see their students.');
      console.log('   Ask the teacher to refresh their browser or log out and back in.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
populateStaffIds()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });