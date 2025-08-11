// Bulk CSV Generator for CaseManageVue
// Generates users and students as CSV files for review before importing

import fs from 'fs';

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

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Generate users CSV
function generateUsersCSV() {
  const users = [];
  let userIdCounter = 1;

  // Generate 40 teachers
  for (let i = 0; i < 40; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'teacher',
      provider: '',
      aeriesId: generateAeriesId()
    });
  }

  // Generate 10 aides
  for (let i = 0; i < 10; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'paraeducator',
      provider: '',
      aeriesId: generateAeriesId()
    });
  }

  // Generate 5 administrators
  for (let i = 0; i < 5; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'admin',
      provider: '',
      aeriesId: generateAeriesId()
    });
  }

  // Generate 1 504 administrator
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
  
  users.push({
    id: userId,
    email: generateEmail(firstName, lastName),
    name: `${firstName} ${lastName}`,
    role: '504_administrator',
    provider: '',
    aeriesId: generateAeriesId()
  });

  // Generate 8 case managers
  for (let i = 0; i < 8; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const userId = `user${String(userIdCounter++).padStart(3, '0')}`;
    
    users.push({
      id: userId,
      email: generateEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      role: 'case_manager',
      provider: '',
      aeriesId: generateAeriesId()
    });
  }

  // Generate 10 service providers
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
      aeriesId: generateAeriesId()
    });
  }

  return users;
}

// Generate students CSV
function generateStudentsCSV(users) {
  const students = [];
  const teachers = users.filter(u => u.role === 'teacher');
  const caseManagers = users.filter(u => u.role === 'case_manager');
  const serviceProviders = users.filter(u => u.role === 'service_provider');
  
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
      providers[provider.provider] = provider.id;
    });

    // Generate accommodations
    const numInstructionalAccommodations = Math.floor(Math.random() * 6) + 3; // 3-8 accommodations
    const numAssessmentAccommodations = Math.floor(Math.random() * 4) + 2; // 2-5 accommodations
    
    const selectedInstructionalAccommodations = getRandomElements(instructionalAccommodations, numInstructionalAccommodations);
    const selectedAssessmentAccommodations = getRandomElements(assessmentAccommodations, numAssessmentAccommodations);

    const student = {
      sourcedId: ssid,
      givenName: firstName,
      familyName: lastName,
      grade: grade,
      Plan: plan,
      CaseManager: caseManager.id,
      ReviewDate: generateDate(Math.floor(Math.random() * 365)),
      ReevalDate: generateDate(Math.floor(Math.random() * 1095)),
      MeetingDate: generateDate(Math.floor(Math.random() * 90)),
      email: generateEmail(firstName, lastName, 'student.edu'),
      phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      dateOfBirth: `200${Math.floor(Math.random() * 3) + 8}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      sex: getRandomElement(['M', 'F']),
      Address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} St`,
      City: 'Anytown',
      State: 'CA',
      ZipCode: '90210',
      ParentName: `${getRandomElement(firstNames)} ${lastName}`,
      ParentPhone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      ParentEmail: generateEmail(getRandomElement(firstNames), lastName, 'email.com'),
      Goals: getRandomElements([
        'Improve reading comprehension by 20%',
        'Develop organizational skills',
        'Increase attention span during class',
        'Improve math calculation accuracy',
        'Enhance social communication skills',
        'Develop independent work habits',
        'Improve written expression',
        'Increase participation in class discussions'
      ], Math.floor(Math.random() * 3) + 2).join('; '),
      Notes: `Student shows progress in ${getRandomElement(['reading', 'math', 'social skills', 'organization'])}. Continues to need support with ${getRandomElement(['attention', 'processing speed', 'working memory', 'executive functioning'])}.`,
      ServiceMinutes: `${Math.floor(Math.random() * 120) + 30}`,
      MedicalNotes: Math.random() < 0.2 ? getRandomElement(['ADHD', 'Anxiety', 'Processing disorder', 'None']) : 'None',
      InstructionalAccommodations: selectedInstructionalAccommodations.join('; '),
      AssessmentAccommodations: selectedAssessmentAccommodations.join('; '),
      ClassServices: classServices.join('; '),
      ServiceProviders: Object.entries(providers).map(([type, id]) => `${type}: ${id}`).join('; '),
      Schedule: Object.entries(schedule).map(([period, teacherId]) => `Period ${period}: ${teacherId}`).join('; '),
      Flag1: Math.random() < 0.3 ? 'true' : 'false',
      Flag2: Math.random() < 0.15 ? 'true' : 'false'
    };

    students.push(student);
  }

  return students;
}

// Convert array to CSV
function arrayToCSV(array) {
  if (array.length === 0) return '';
  
  const headers = Object.keys(array[0]);
  const csvContent = [
    headers.join(','),
    ...array.map(row => 
      headers.map(header => escapeCSV(row[header] || '')).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// Main execution
function generateBulkCSV() {
  console.log('🚀 Generating bulk data as CSV files...');
  
  // Generate users
  console.log('📝 Generating users...');
  const users = generateUsersCSV();
  const usersCSV = arrayToCSV(users);
  
  // Generate students
  console.log('👥 Generating students...');
  const students = generateStudentsCSV(users);
  const studentsCSV = arrayToCSV(students);
  
  // Write CSV files
  console.log('💾 Writing CSV files...');
  fs.writeFileSync('bulk_users.csv', usersCSV);
  fs.writeFileSync('bulk_students.csv', studentsCSV);
  
  console.log('✅ CSV files generated successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${users.length} users in bulk_users.csv`);
  console.log(`     - 40 teachers`);
  console.log(`     - 10 aides (paraeducators)`);
  console.log(`     - 5 administrators`);
  console.log(`     - 1 504 administrator`);
  console.log(`     - 8 case managers`);
  console.log(`     - 10 service providers`);
  console.log(`   • ${students.length} students in bulk_students.csv`);
  console.log(`     - Complete schedules with teacher assignments`);
  console.log(`     - Realistic accommodations from your list`);
  console.log(`     - Service provider assignments`);
  console.log(`     - Case manager assignments`);
  console.log('\n📁 Files created:');
  console.log('   • bulk_users.csv - Ready for user bulk import');
  console.log('   • bulk_students.csv - Ready for student bulk import');
  console.log('\n💡 You can now review these files and use the bulk importer in the admin panel!');
}

// Run the generator
generateBulkCSV(); 