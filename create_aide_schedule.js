// Simple script to create aide schedule data for paraeducator testing
// Run with: node create_aide_schedule.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up credentials)
// For testing, you can use the Firebase console instead

const paraeducatorUserId = 'VYEu9zlQo9YSdHPHBwOI7bopm6s2';

// Sample aide schedule data
const aideScheduleData = {
  // Direct assignments - assign paraeducator directly to specific students
  directAssignment: [
    // Add student IDs here - you can get these from your Firebase console
    // "student_id_1", "student_id_2"
  ],
  
  // Class assignments - assign paraeducator to help specific teachers in specific periods
  classAssignment: {
    "1": ["teacher_id_1"], // Period 1 - Teacher 1 (replace with actual teacher ID)
    "2": ["teacher_id_2"], // Period 2 - Teacher 2 (replace with actual teacher ID)
    "3": ["teacher_id_3"], // Period 3 - Teacher 3 (replace with actual teacher ID)
  },
  
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'test_script'
};

console.log('Aide schedule data to add to Firebase:');
console.log('Collection: aideSchedules');
console.log('Document ID:', paraeducatorUserId);
console.log('Data:', JSON.stringify(aideScheduleData, null, 2));

console.log('\nTo add this data:');
console.log('1. Go to Firebase Console > Firestore Database');
console.log('2. Create collection "aideSchedules" if it doesn\'t exist');
console.log('3. Add document with ID:', paraeducatorUserId);
console.log('4. Copy the data structure above');
console.log('5. Replace teacher_id_1, teacher_id_2, etc. with actual teacher IDs from your users collection');
console.log('6. Optionally add student IDs to directAssignment array'); 