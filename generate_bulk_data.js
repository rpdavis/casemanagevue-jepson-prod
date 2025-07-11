// Bulk Data Generator for CaseManageVue
// Generates users and students with realistic accommodations and relationships

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (use development project)
const firebaseConfig = {
  apiKey: "AIzaSyBtkhofccSy97Grr2c3BF2XsaFzLGhx0So",
  authDomain: "casemanagevue-dev.firebaseapp.com",
  projectId: "casemanagevue-dev",
  storageBucket: "casemanagevue-dev.firebasestorage.app",
  messagingSenderId: "781576648552",
  appId: "1:781576648552:web:5dcdba090d1f281ad108dd",
  measurementId: "G-FQQY8QYWPH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Accommodation templates
const instructionalAccommodations = [
  "Use of multiplication chart and calculator (when not assessing computational skills)",
  "Access to multiplication chart and number line as needed",
  "Use of calculator to check for computation accuracy when calculations are not the primary focus of the assessment",
  "Preferential seating (near the point of instructions, near a positive peer, or an area with the least distractions)",
  "Simplified, repeated, or rephrased directions as needed",
  "Access to notes or cloze notes",
  "Shortened assignments: when appropriate and when they do not compromise the integrity of the learning objectives, ensuring the student can demonstrate understanding as determined by the teacher.",
  "Use of graphic organizer checklist for organizing larger writing assignments",
  "Access to word bank as needed",
  "Access to audiobooks or other audio supports (teacher read aloud) for longer reading materials, as needed",
  "Extended time on assignments (up to 2 weeks, not to exceed the grading period)",
  "Check for understanding and work completion",
  "Divide larger projects or assignments into manageable parts with incremental deadlines.",
  "\"Chunk\" instructions/visual checklists as needed.",
  "Allow for short breaks",
  "Allow for breaks when needed",
  "Allow use of sensory tools (e.g., fidgets, stress balls) if they help regulate focus"
];

const assessmentAccommodations = [
  "Extended time for assessments (time and a half)",
  "Allow for test re-takes if the score is below average (less than 2 on a 4-point scale, less than 70%)",
  "Separate setting for assessments (RSP room or other smaller setting)",
  "Access to notes",
  "Directions to be read, clarified, or simplified as needed",
  "Access to notes during tests when necessary",
  "Simplify instructions or allow verbal clarification of math assessment items",
  "Option to clarify or rephrase directions for tests",
  "Shortened Assessments: (when appropriate and does not compromise the integrity of the learning objectives)",
  "Use of calculator to check for computation accuracy when calculations are not the primary focus of the assessment"
];

// Name lists for realistic data
const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Elijah", "Sophia", "Oliver", "Isabella", "William",
  "Charlotte", "James", "Amelia", "Benjamin", "Mia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
  "Abigail", "Mason", "Emily", "Michael", "Elizabeth", "Ethan", "Mila", "Daniel", "Ella", "Jacob",
  "Avery", "Logan", "Sofia", "Jackson", "Camila", "Levi", "Aria", "Sebastian", "Scarlett", "Mateo",
  "Victoria", "Jack", "Madison", "Owen", "Luna", "Theodore", "Grace", "Aiden", "Chloe", "Samuel",
  "Penelope", "Joseph", "Layla", "John", "Riley", "David", "Zoey", "Wyatt", "Nora", "Matthew",
  "Lily", "Luke", "Eleanor", "Asher", "Hannah", "Carter", "Lillian", "Julian", "Addison", "Grayson",
  "Aubrey", "Leo", "Ellie", "Jayden", "Stella", "Gabriel", "Natalie", "Isaac", "Zoe", "Lincoln",
  "Leah", "Anthony", "Hazel", "Hudson", "Violet", "Dylan", "Aurora", "Ezra", "Savannah", "Thomas",
  "Audrey", "Charles", "Brooklyn", "Christopher", "Bella", "Jaxon", "Claire", "Maverick", "Skylar", "Josiah"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
  "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"
];

const serviceProviderTypes = [
  { abbreviation: 'SLP', name: 'Speech-Language Therapy' },
  { abbreviation: 'OT', name: 'Occupational Therapy' },
  { abbreviation: 'PT', name: 'Physical Therapy' },
  { abbreviation: 'MH', name: 'Mental Health Services' },
  { abbreviation: 'SC', name: 'School Counseling' },
  { abbreviation: 'TR', name: 'Transportation' },
  { abbreviation: 'AUD', name: 'Audiology Services' },
  { abbreviation: 'VI', name: 'Vision Services' },
  { abbreviation: 'AT', name: 'Assistive Technology' },
  { abbreviation: 'DHH', name: 'Deaf and Hard of Hearing Services' }
];

// Utility functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateEmail(firstName, lastName, domain = 'school.edu') {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateSSID() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

function generateDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function generateAeriesId() {
  return 'T' + Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate users by role
async function generateUsers() {
  const users = [];
  let userIdCounter = 1;

  // Generate 40 teachers
  console.log('Generating 40 teachers...');
  for (let i = 0; i < 40; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'teacher',
      aeriesId: generateAeriesId(),
      createdAt: serverTimestamp()
    });
  }

  // Generate 10 aides
  console.log('Generating 10 aides...');
  for (let i = 0; i < 10; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'paraeducator',
      aeriesId: generateAeriesId(),
      createdAt: serverTimestamp()
    });
  }

  // Generate 5 administrators
  console.log('Generating 5 administrators...');
  for (let i = 0; i < 5; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'admin',
      aeriesId: generateAeriesId(),
      createdAt: serverTimestamp()
    });
  }

  // Generate 1 504 administrator
  console.log('Generating 1 504 administrator...');
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
  
  users.push({
    id: userId,
    email: generateEmail(firstName, lastName),
    name: `${firstName} ${lastName}`,
    role: '504_administrator',
    aeriesId: generateAeriesId(),
    createdAt: serverTimestamp()
  });

  // Generate 8 case managers
  console.log('Generating 8 case managers...');
  for (let i = 0; i < 8; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'case_manager',
      aeriesId: generateAeriesId(),
      createdAt: serverTimestamp()
    });
  }

  // Generate 10 service providers
  console.log('Generating 10 service providers...');
  for (let i = 0; i < 10; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    const providerType = getRandomElement(serviceProviderTypes);
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'service_provider',
      provider: providerType.abbreviation,
      aeriesId: generateAeriesId(),
      createdAt: serverTimestamp()
    });
  }

  return users;
}

// Generate students with accommodations
async function generateStudents(users) {
  const students = [];
  const teachers = users.filter(u => u.role === 'teacher');
  const caseManagers = users.filter(u => u.role === 'case_manager');
  const serviceProviders = users.filter(u => u.role === 'service_provider');
  
  console.log('Generating 100 students...');
  
  for (let i = 0; i < 100; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const ssid = generateSSID();
    const grade = getRandomElement(['7', '8']);
    const plan = getRandomElement(['IEP', '504']);
    
    // Assign case manager
    const caseManager = getRandomElement(caseManagers);
    
    // Generate schedule (assign teachers to periods)
    const schedule = {};
    const periodsToAssign = Math.floor(Math.random() * 3) + 5; // 5-7 periods
    const availablePeriods = ['1', '2', '3', '4', '5', '6', '7', 'SH'];
    const selectedPeriods = getRandomElements(availablePeriods, periodsToAssign);
    
    selectedPeriods.forEach(period => {
      schedule[period] = getRandomElement(teachers).id;
    });

    // Generate class services
    const possibleServices = [
      'SDC: English', 'SDC: Math', 'SDC: History', 'SDC: Science',
      'Co-teach: English', 'Co-teach: Math', 'Co-teach: History', 'Co-teach: Science',
      'RSP: English', 'RSP: Math', 'RSP: History', 'RSP: Science',
      'Directed Studies: Study Skills', 'FA: Functional Academics'
    ];
    const classServices = getRandomElements(possibleServices, Math.floor(Math.random() * 4) + 1);

    // Assign service providers (randomly)
    const providers = {};
    const numProviders = Math.floor(Math.random() * 3) + 1; // 1-3 providers
    const selectedProviders = getRandomElements(serviceProviders, numProviders);
    
    selectedProviders.forEach(provider => {
      const fieldName = `${provider.provider.toLowerCase()}Id`;
      providers[fieldName] = provider.id;
    });

    // Generate accommodations
    const numInstructionalAccommodations = Math.floor(Math.random() * 6) + 3; // 3-8 accommodations
    const numAssessmentAccommodations = Math.floor(Math.random() * 4) + 2; // 2-5 accommodations
    
    const selectedInstructionalAccommodations = getRandomElements(instructionalAccommodations, numInstructionalAccommodations);
    const selectedAssessmentAccommodations = getRandomElements(assessmentAccommodations, numAssessmentAccommodations);

    // Generate flags (randomly)
    const flags = {
      flag1: Math.random() < 0.3, // 30% chance for preferential seating
      flag2: Math.random() < 0.15  // 15% chance for separate setting
    };

    const student = {
      app: {
        studentData: {
          ssid: ssid,
          firstName: firstName,
          lastName: lastName,
          grade: grade,
          plan: plan,
          caseManagerId: caseManager.id
        },
        dates: {
          reviewDate: generateDate(Math.floor(Math.random() * 365)), // Within next year
          reevalDate: generateDate(Math.floor(Math.random() * 1095)), // Within next 3 years
          meetingDate: generateDate(Math.floor(Math.random() * 90)) // Within next 3 months
        },
        schedule: {
          periods: schedule,
          classServices: classServices
        },
        providers: providers,
        accommodations: {
          instruction: selectedInstructionalAccommodations.join('\n• '),
          assessment: selectedAssessmentAccommodations.join('\n• ')
        },
        flags: flags,
        documents: {
          ataglancePdfUrl: '',
          bipPdfUrl: ''
        }
      },
      aeries: {
        firstName: firstName,
        lastName: lastName,
        grade: grade,
        birthDate: `200${Math.floor(Math.random() * 3) + 8}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        gender: getRandomElement(['M', 'F']),
        email: generateEmail(firstName, lastName, 'student.edu'),
        phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} St`,
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
        parentName: `${getRandomElement(firstNames)} ${lastName}`,
        parentPhone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        parentEmail: generateEmail(getRandomElement(firstNames), lastName, 'email.com'),
        attendanceRate: `${Math.floor(Math.random() * 20) + 80}%`,
        schedule: {
          periods: schedule
        }
      },
      seis: {
        goals: getRandomElements([
          'Improve reading comprehension by 20%',
          'Develop organizational skills',
          'Increase attention span during class',
          'Improve math calculation accuracy',
          'Enhance social communication skills',
          'Develop independent work habits',
          'Improve written expression',
          'Increase participation in class discussions'
        ], Math.floor(Math.random() * 3) + 2).join('; '),
        notes: `Student shows progress in ${getRandomElement(['reading', 'math', 'social skills', 'organization'])}. Continues to need support with ${getRandomElement(['attention', 'processing speed', 'working memory', 'executive functioning'])}.`,
        serviceMinutes: `${Math.floor(Math.random() * 120) + 30}`,
        medicalNotes: Math.random() < 0.2 ? getRandomElement(['ADHD', 'Anxiety', 'Processing disorder', 'None']) : 'None'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    students.push(student);
  }

  return students;
}

// Main execution function
async function generateBulkData() {
  try {
    console.log('🚀 Starting bulk data generation...');
    
    // Generate users
    console.log('\n📝 Generating users...');
    const users = await generateUsers();
    
    // Save users to Firestore
    console.log('\n💾 Saving users to Firestore...');
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      await setDoc(doc(db, 'users', user.id), user);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Saved ${i + 1}/${users.length} users...`);
      }
    }
    
    // Generate students
    console.log('\n👥 Generating students...');
    const students = await generateStudents(users);
    
    // Save students to Firestore
    console.log('\n💾 Saving students to Firestore...');
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentRef = doc(collection(db, 'students'));
      await setDoc(studentRef, student);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Saved ${i + 1}/${students.length} students...`);
      }
    }
    
    console.log('\n✅ Bulk data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${users.length} users created`);
    console.log(`     - 40 teachers`);
    console.log(`     - 10 aides (paraeducators)`);
    console.log(`     - 5 administrators`);
    console.log(`     - 1 504 administrator`);
    console.log(`     - 8 case managers`);
    console.log(`     - 10 service providers`);
    console.log(`   • ${students.length} students created`);
    console.log(`     - Complete schedules with teacher assignments`);
    console.log(`     - Realistic accommodations`);
    console.log(`     - Service provider assignments`);
    console.log(`     - Case manager assignments`);
    
  } catch (error) {
    console.error('❌ Error generating bulk data:', error);
    throw error;
  }
}

// Run the generator
generateBulkData().then(() => {
  console.log('\n🎉 All done! Your development database is now populated with realistic data.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Failed to generate bulk data:', error);
  process.exit(1);
}); 