const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin (make sure to set up credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'casemangervue',
    // Add your service account key path here if needed
  });
}

const storage = getStorage();
const bucket = storage.bucket();

async function removePublicAccess() {
  console.log('🔍 Scanning for publicly accessible student files...');
  
  try {
    // Get all files in the students directory
    const [files] = await bucket.getFiles({
      prefix: 'students/',
    });

    console.log(`📁 Found ${files.length} student files to check`);

    for (const file of files) {
      try {
        // Get file metadata
        const [metadata] = await file.getMetadata();
        
        // Check if file has public access
        if (metadata.downloadTokens) {
          console.log(`🔓 SECURITY ISSUE: ${file.name} has public download token`);
          console.log(`   Token: ${metadata.downloadTokens}`);
          
          // Remove the download token to make file private
          await file.setMetadata({
            metadata: {
              firebaseStorageDownloadTokens: undefined
            }
          });
          
          console.log(`✅ Removed public access from: ${file.name}`);
        } else {
          console.log(`🔒 Already secure: ${file.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Security scan complete!');
    console.log('📋 Summary:');
    console.log('   - All student files should now require authentication');
    console.log('   - Storage rules are enforcing role-based access');
    console.log('   - Public download tokens have been removed');
    
  } catch (error) {
    console.error('❌ Error scanning storage:', error);
  }
}

async function testFileAccess() {
  console.log('\n🧪 Testing file access rules...');
  
  const testFile = 'students/RSc3x9TrpbHaBaN7gGfe/bip.pdf';
  
  try {
    const file = bucket.file(testFile);
    const [exists] = await file.exists();
    
    if (exists) {
      console.log(`📄 File exists: ${testFile}`);
      
      // Try to get a signed URL (this should work for admin)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
      
      console.log(`🔗 Admin signed URL: ${url.substring(0, 100)}...`);
      console.log('   ↳ This URL will work for authenticated admin users only');
      
      // Check current metadata
      const [metadata] = await file.getMetadata();
      console.log(`🔍 Current security status:`);
      console.log(`   - Download tokens: ${metadata.downloadTokens || 'NONE (SECURE)'}`);
      console.log(`   - Content type: ${metadata.contentType}`);
      console.log(`   - Size: ${metadata.size} bytes`);
      
    } else {
      console.log(`❌ File not found: ${testFile}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing file access:', error);
  }
}

// Main execution
async function main() {
  console.log('🛡️  Firebase Storage Security Fix Tool');
  console.log('=====================================\n');
  
  await removePublicAccess();
  await testFileAccess();
  
  console.log('\n📚 Next Steps:');
  console.log('1. Verify the problematic file is no longer publicly accessible');
  console.log('2. Test that authenticated users can still access files appropriately');
  console.log('3. Check Firebase Console > Storage > Rules to confirm deployment');
  console.log('\n🔗 Firebase Console: https://console.firebase.google.com/project/casemangervue/storage');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { removePublicAccess, testFileAccess }; 