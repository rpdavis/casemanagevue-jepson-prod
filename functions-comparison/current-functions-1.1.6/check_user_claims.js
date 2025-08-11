const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  projectId: 'casemangervue'
});

const adminAuth = getAuth();
const db = getFirestore();

async function checkUserClaims() {
  try {
    const userId = 'j4HbMC3Hlpbmhp3155HeBEx1DJ62'; // From your console logs
    
    console.log('🔍 Checking user:', userId);
    
    // Check Firestore document
    const userDoc = await db.collection('users').doc(userId).get();
    console.log('📄 Firestore document exists:', userDoc.exists);
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('📄 Firestore role:', userData.role);
      console.log('📄 Firestore email:', userData.email);
    }
    
    // Check auth record and custom claims
    const userRecord = await adminAuth.getUser(userId);
    console.log('🔍 Auth record exists:', !!userRecord);
    console.log('🔍 Auth email:', userRecord.email);
    console.log('🔍 Custom claims:', userRecord.customClaims);
    
    // This is the key check - are the custom claims set?
    if (!userRecord.customClaims || !userRecord.customClaims.role) {
      console.log('❌ PROBLEM: No custom claims set on auth token!');
      console.log('💡 This is why Firestore rules are failing');
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('🔧 Fixing: Setting custom claims to match Firestore role...');
        await adminAuth.setCustomUserClaims(userId, { role: userData.role });
        console.log('✅ Custom claims set! User needs to sign out and back in.');
      }
    } else {
      console.log('✅ Custom claims are set correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserClaims();