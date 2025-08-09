const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin
admin.initializeApp({
  storageBucket: 'casemanagevue-jepson-prod.firebasestorage.app'
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function removeTokensFromFile(filePath) {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      console.log(`File doesn't exist: ${filePath}`);
      return false;
    }
    
    // Remove download tokens by setting metadata
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: null
      }
    });
    
    console.log(`✅ Removed tokens from: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing tokens from ${filePath}:`, error.message);
    return false;
  }
}

async function removeTokensFromStudent(studentId) {
  const filePaths = [
    `students/${studentId}/bip.pdf`,
    `students/${studentId}/ataglance.pdf`
  ];
  
  console.log(`\n🔧 Processing student: ${studentId}`);
  
  for (const filePath of filePaths) {
    await removeTokensFromFile(filePath);
  }
}

// Remove tokens from specific student
const studentId = 'RSc3x9TrpbHaBaN7gGfe';
removeTokensFromStudent(studentId)
  .then(() => {
    console.log('\n🎉 Token removal complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 