// fix_missing_user.js
// Temporary script to add the missing user to Firestore

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  projectId: 'casemangervue'
});

const db = getFirestore();

async function fixMissingUser() {
  try {
    const userId = 'j4HbMC3Hlpbmhp3155HeBEx1DJ62';
    
    // Add the user to Firestore with admin role for testing
    await db.collection('users').doc(userId).set({
      name: 'Admin User',
      email: 'admin@school.org', // You can update this to the actual email
      role: 'admin',
      createdAt: new Date(),
      status: 'active'
    });
    
    console.log(`✅ Successfully added user ${userId} to Firestore with admin role`);
    console.log('🔄 You may need to sign out and sign back in for the changes to take effect');
    
  } catch (error) {
    console.error('❌ Error adding user to Firestore:', error);
  }
}

fixMissingUser(); 