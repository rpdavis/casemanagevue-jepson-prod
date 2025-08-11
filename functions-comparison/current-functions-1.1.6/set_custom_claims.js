const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  projectId: 'casemangervue'
});

const adminAuth = getAuth();
const db = getFirestore();

async function setCustomClaims() {
  try {
    const userId = 'j4HbMC3Hlpbmhp3155HeBEx1DJ62';
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ User document not found in Firestore');
      return;
    }
    
    const userData = userDoc.data();
    console.log('📄 User data from Firestore:', userData);
    
    // Set custom claims on auth token
    await adminAuth.setCustomUserClaims(userId, { role: userData.role });
    console.log(`✅ Successfully set custom claims for ${userId}: role = ${userData.role}`);
    
    // Verify the claims were set
    const userRecord = await adminAuth.getUser(userId);
    console.log('🔍 Custom claims on auth token:', userRecord.customClaims);
    
    console.log('🔄 Please sign out and sign back in for the changes to take effect');
    
  } catch (error) {
    console.error('❌ Error setting custom claims:', error);
  }
}

setCustomClaims();