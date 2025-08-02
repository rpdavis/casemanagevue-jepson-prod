const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  projectId: 'casemangervue'
});

const adminAuth = getAuth();
const db = getFirestore();

async function findUserByEmail() {
  try {
    const email = 'rypdavis@gmail.com'; // Your actual login email
    
    console.log('🔍 Looking for user with email:', email);
    
    // Search Firestore for user with this email
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No Firestore user found with email:', email);
      
      // Try to find by auth email
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        console.log('🔍 Found auth user:', userRecord.uid);
        console.log('🔍 Auth custom claims:', userRecord.customClaims);
        
        // Check if this user has a Firestore document
        const firestoreDoc = await db.collection('users').doc(userRecord.uid).get();
        if (firestoreDoc.exists) {
          console.log('📄 Firestore document for this user:', firestoreDoc.data());
        } else {
          console.log('❌ No Firestore document for auth user:', userRecord.uid);
        }
      } catch (authError) {
        console.log('❌ No auth user found with email:', email);
      }
    } else {
      console.log('✅ Found Firestore users with this email:');
      usersSnapshot.forEach(doc => {
        console.log('📄 User ID:', doc.id);
        console.log('📄 Data:', doc.data());
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findUserByEmail();