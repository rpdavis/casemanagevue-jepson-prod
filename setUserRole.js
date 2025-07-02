// Simple script to set user role in Firestore
// Run this with: node setUserRole.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  projectId: 'casemangervue'
});

const db = getFirestore();

async function setUserRole() {
  try {
    // Replace 'YOUR_USER_UID' with your actual Firebase user UID
    // You can find this in the browser console by running: 
    // firebase.auth().currentUser.uid
    
    const userUid = 'YOUR_USER_UID'; // Replace this with your actual UID
    const newRole = 'admin'; // or 'administrator', 'administrator_504_CM', 'sped_chair'
    
    await db.collection('users').doc(userUid).update({
      role: newRole
    });
    
    console.log(`✅ Successfully set role to '${newRole}' for user ${userUid}`);
    console.log('🔄 You may need to sign out and sign back in for the changes to take effect');
    
  } catch (error) {
    console.error('❌ Error setting user role:', error);
  }
}

setUserRole(); 