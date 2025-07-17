import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqzGX4xgOjVWGKr7nBqLyOmJYN3vJcYgE",
  authDomain: "casemangervue.firebaseapp.com",
  projectId: "casemangervue",
  storageBucket: "casemangervue.appspot.com",
  messagingSenderId: "1065834639863",
  appId: "1:1065834639863:web:2b2a0a0a0a0a0a0a0a0a0a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Period mapping from various formats to numeric
const periodMap = {
  '1': 1, 'P1': 1,
  '2': 2, 'P2': 2,
  '3': 3, 'P3': 3,
  '4': 4, 'P4': 4,
  '5': 5, 'P5': 5,
  '6': 6, 'P6': 6,
  '7': 7, 'SH': 7, 'F': 7  // Map SH and F to period 7
};

// Function to normalize schedule periods
function normalizeSchedule(rawSchedule) {
  if (!rawSchedule || typeof rawSchedule !== 'object') return {};
  
  const normalized = {};
  
  // Convert all periods to numeric format
  Object.entries(rawSchedule).forEach(([key, value]) => {
    const numericPeriod = periodMap[key];
    if (numericPeriod && value) {
      // If multiple periods map to the same numeric period, prefer the one with more data
      if (normalized[numericPeriod]) {
        // If existing is string and new is object, prefer object
        if (typeof normalized[numericPeriod] === 'string' && typeof value === 'object') {
          normalized[numericPeriod] = value;
        }
        // If both are objects, prefer the one with co-teaching data
        else if (typeof normalized[numericPeriod] === 'object' && typeof value === 'object') {
          if (value.coTeaching && !normalized[numericPeriod].coTeaching) {
            normalized[numericPeriod] = value;
          }
        }
      } else {
        normalized[numericPeriod] = value;
      }
    }
  });
  
  return normalized;
}

async function normalizeAllStudentSchedules() {
  try {
    console.log('🔄 Starting schedule normalization...');
    
    // Sign in as admin user
    console.log('🔐 Authenticating...');
    await signInWithEmailAndPassword(auth, 'rypdavis@gmail.com', 'your-password-here');
    console.log('✅ Authenticated successfully');
    
    // Get all students
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const students = studentsSnapshot.docs;
    
    console.log(`📚 Found ${students.length} students to process`);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const studentDoc of students) {
      const studentData = studentDoc.data();
      const studentId = studentDoc.id;
      
      processedCount++;
      
      // Check if student has schedule data
      if (studentData.app?.schedule?.periods) {
        const rawSchedule = studentData.app.schedule.periods;
        const normalizedSchedule = normalizeSchedule(rawSchedule);
        
        // Check if normalization made changes
        const rawKeys = Object.keys(rawSchedule).sort();
        const normalizedKeys = Object.keys(normalizedSchedule).map(k => String(k)).sort();
        
        const hasChanges = JSON.stringify(rawKeys) !== JSON.stringify(normalizedKeys) ||
                          JSON.stringify(rawSchedule) !== JSON.stringify(normalizedSchedule);
        
        if (hasChanges) {
          console.log(`📝 Updating student ${studentId}:`);
          console.log(`   Before: ${JSON.stringify(rawSchedule)}`);
          console.log(`   After:  ${JSON.stringify(normalizedSchedule)}`);
          
          // Update the student document
          await updateDoc(doc(db, 'students', studentId), {
            'app.schedule.periods': normalizedSchedule
          });
          
          updatedCount++;
        }
      }
      
      // Progress indicator
      if (processedCount % 10 === 0) {
        console.log(`📊 Progress: ${processedCount}/${students.length} processed, ${updatedCount} updated`);
      }
    }
    
    console.log('✅ Schedule normalization complete!');
    console.log(`📊 Final stats: ${processedCount} processed, ${updatedCount} updated`);
    
  } catch (error) {
    console.error('❌ Error during normalization:', error);
  }
}

// Run the normalization
normalizeAllStudentSchedules(); 