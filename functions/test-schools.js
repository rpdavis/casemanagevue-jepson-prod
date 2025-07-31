const { onCall } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();

exports.testSchools = onCall({
  region: "us-central1"
}, async (request) => {
  try {
    const schoolsSnapshot = await db.collection('schools').get();
    const schools = [];
    
    schoolsSnapshot.forEach(doc => {
      schools.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      count: schools.length,
      schools: schools
    };
    
  } catch (error) {
    console.error('Error testing schools:', error);
    return {
      success: false,
      error: error.message
    };
  }
}); 