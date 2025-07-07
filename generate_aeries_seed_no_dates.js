const fs = require('fs');

// Teacher IDs from the user seed data (first 50 teachers)
const teacherIds = [
  '100031', '100032', '100033', '100034', '100035', '100036', '100037', '100038', '100039', '100000',
  '1000310', '1000311', '1000312', '1000313', '1000314', '1000315', '1000316', '1000317', '1000318', '1000319',
  '1000320', '1000321', '1000322', '1000323', '1000324', '1000325', '1000326', '1000327', '1000328', '1000329',
  '1000330', '1000331', '1000332', '1000333', '1000334', '1000335', '1000336', '1000337', '1000338', '1000339',
  '1000340', '1000341', '1000342', '1000343', '1000344', '1000345'
];

const subjects = [
  'English', 'Math', 'Science', 'History', 'Geography', 'Physical Education', 'Art', 'Music', 'Spanish', 'French',
  'German', 'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Algebra', 'Geometry', 'Calculus', 'Literature',
  'Writing', 'Grammar', 'Health', 'Psychology', 'Sociology', 'Government', 'Economics', 'Photography', 'Drama',
  'Cooking', 'Music Theory', 'Physical Science', 'World History', 'US History', 'Environmental Science'
];

const rooms = [
  '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
  '301', '302', '303', '304', '305', '306', '307', '308', '309', '310'
];

const caseManagers = ['CaseManager1', 'CaseManager2', 'CaseManager3', 'CaseManager4', 'CaseManager5'];
const speechProviders = ['Speech1', 'Speech2', 'Speech3'];
const mhProviders = ['MH1', 'MH2'];
const otProviders = ['OT1', 'OT2'];
const plans = ['Plan 1', 'Plan 2', 'Plan 3'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSchedule() {
  const schedule = {};
  for (let i = 1; i <= 7; i++) {
    schedule[`period${i}TeacherId`] = getRandomElement(teacherIds);
    schedule[`period${i}Subject`] = getRandomElement(subjects);
    schedule[`period${i}Room`] = getRandomElement(rooms);
  }
  return schedule;
}

function generateStudentData(studentNumber) {
  const ssid = 123456789 + studentNumber;
  const firstName = `First${studentNumber}`;
  const lastName = `Last${studentNumber}`;
  const middleName = String.fromCharCode(65 + (studentNumber % 26)); // A-Z
  const email = `student${studentNumber}@school.edu`;
  const phone = `555-01${String(studentNumber).padStart(2, '0')}`;
  const dob = `2008-${String((studentNumber % 12) + 1).padStart(2, '0')}-${String((studentNumber % 28) + 1).padStart(2, '0')}`;
  const sex = studentNumber % 2 === 0 ? 'F' : 'M';
  const grade = 8 + (studentNumber % 4); // 8-11
  const address = `${100 + studentNumber} Main St`;
  const parentName = `Parent${studentNumber}`;
  const parentPhone = `555-02${String(studentNumber).padStart(2, '0')}`;
  const parentEmail = `parent${studentNumber}@email.com`;
  const caseManager = getRandomElement(caseManagers);
  const serviceMinutes = [60, 90, 120, 150][studentNumber % 4];
  const goal = `Goal for student ${studentNumber}`;
  const notes = `Notes for student ${studentNumber}`;
  const plan = getRandomElement(plans);
  const speechProvider = getRandomElement(speechProviders);
  const mhProvider = getRandomElement(mhProviders);
  const otProvider = getRandomElement(otProviders);

  const schedule = generateSchedule();

  return {
    sourcedId: ssid,
    givenName: firstName,
    familyName: lastName,
    middleName: middleName,
    email: email,
    phone: phone,
    dateOfBirth: dob,
    sex: sex,
    grade: grade,
    school: 'Central High School',
    schoolCode: 'CHS',
    schoolName: 'Central High School',
    Address: address,
    City: 'Anytown',
    State: 'CA',
    ZipCode: '90210',
    ParentName: parentName,
    ParentPhone: parentPhone,
    ParentEmail: parentEmail,
    CaseManager: caseManager,
    ServiceMinutes: serviceMinutes,
    Goals: goal,
    Notes: notes,
    Plan: plan,
    SpeechProvider: speechProvider,
    MHProvider: mhProvider,
    OTProvider: otProvider,
    MedicalNotes: 'None',
    Vision: '20/20',
    Hearing: 'Normal',
    CAASPP: 'Proficient',
    ELPAC: 'Advanced',
    ...schedule
  };
}

// Generate 100 students
const students = [];
for (let i = 1; i <= 100; i++) {
  students.push(generateStudentData(i));
}

// Create CSV content
const headers = Object.keys(students[0]);
const csvContent = [
  headers.join(','),
  ...students.map(student => 
    headers.map(header => {
      const value = student[header];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  )
].join('\n');

// Write to file
fs.writeFileSync('aeries_seed_data_final.csv', csvContent);
console.log('Generated aeries_seed_data_final.csv with 100 students (no date fields)');
console.log('Sample data:');
console.log(JSON.stringify(students[0], null, 2)); 