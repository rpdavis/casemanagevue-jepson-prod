const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin
admin.initializeApp({
  storageBucket: 'casemangervue.firebasestorage.app'
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function removePublicTokens() {
  console.log('🚀 Starting to remove public download tokens...');
  
  try {
    // Get all students from Firestore
    const studentsSnapshot = await db.collection('students').get();
    console.log(`📚 Found ${studentsSnapshot.docs.length} students`);
    
    let processedFiles = 0;
    let removedTokens = 0;
    let errors = 0;
    
    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const studentId = studentDoc.id;
      
      console.log(`\n👤 Processing student: ${studentId}`);
      
      // Check all possible file fields
      const fileFields = [
        'bip_url', 'iep_url', 'behavior_plan_url', 'at_a_glance_url',
        'other_docs_url', 'assessment_url', 'progress_report_url'
      ];
      
      for (const field of fileFields) {
        if (studentData[field] && typeof studentData[field] === 'string') {
          const fileUrl = studentData[field];
          
          // Skip if it's already a file path (not a URL with token)
          if (!fileUrl.includes('token=')) {
            console.log(`  ✅ ${field}: Already secure (no token)`);
            continue;
          }
          
          try {
            // Extract file path from URL
            const urlObj = new URL(fileUrl);
            const pathSegments = urlObj.pathname.split('/');
            const filePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/');
            const decodedPath = decodeURIComponent(filePath);
            
            console.log(`  🔧 ${field}: Removing token from ${decodedPath}`);
            
            // Get file reference
            const file = bucket.file(decodedPath);
            const [exists] = await file.exists();
            
            if (!exists) {
              console.log(`  ⚠️  ${field}: File doesn't exist, skipping`);
              continue;
            }
            
            // Remove download tokens by updating metadata
            await file.setMetadata({
              metadata: {
                firebaseStorageDownloadTokens: ''
              }
            });
            
            // Update Firestore document to store file path instead of URL
            await studentDoc.ref.update({
              [field]: decodedPath
            });
            
            console.log(`  ✅ ${field}: Token removed, path updated`);
            removedTokens++;
            
          } catch (error) {
            console.error(`  ❌ ${field}: Error - ${error.message}`);
            errors++;
          }
          
          processedFiles++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`  Files processed: ${processedFiles}`);
    console.log(`  Tokens removed: ${removedTokens}`);
    console.log(`  Errors: ${errors}`);
    console.log('\n✅ Token removal complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
removePublicTokens()
  .then(() => {
    console.log('🎉 All done! Files are now secure.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 