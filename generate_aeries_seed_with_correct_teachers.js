const fs = require('fs');

// Teacher Aeries IDs from the realistic user seed data
const teacherAeriesIds = [
  '100000', // James Smith (sped_chair)
  '100031', // Donna Young (case_manager)
  '100032', // Steven Allen (case_manager)
  '100033', // Carol King (case_manager)
  '100034', // Paul Wright (case_manager)
  '100035', // Ruth Scott (case_manager)
  '100036', // Andrew Torres (sped_chair)
  '100037', // Sharon Nguyen (administrator_504_CM)
  '100038', // Joshua Hill (administrator_504_CM)
  '100039', // Michelle Flores (administrator_504_CM)
  '1000310', // Kenneth Green (administrator_504_CM)
  '1000311', // Laura Adams (teacher)
  '1000312', // Kevin Nelson (teacher)
  '1000313', // Emily Baker (teacher)
  '1000314', // Brian Hall (teacher)
  '1000315', // Kimberly Rivera (teacher)
  '1000316', // George Campbell (teacher)
  '1000317', // Deborah Mitchell (teacher)
  '1000318', // Edward Carter (teacher)
  '1000319', // Dorothy Roberts (teacher)
  '1000320', // Ronald Gomez (teacher)
  '1000321', // Lisa Phillips (teacher)
  '1000322', // Timothy Evans (teacher)
  '1000323', // Nancy Turner (teacher)
  '1000324', // Jason Diaz (teacher)
  '1000325', // Karen Parker (teacher)
  '1000326', // Jeffrey Cruz (teacher)
  '1000327', // Betty Edwards (teacher)
  '1000328', // Ryan Collins (teacher)
  '1000329', // Helen Reyes (teacher)
  '1000330', // Jacob Stewart (teacher)
  '1000331', // Sandra Morris (teacher)
  '1000332', // Gary Morales (teacher)
  '1000333', // Donna Murphy (teacher)
  '1000334', // Nicholas Cook (teacher)
  '1000335', // Carol Rogers (teacher)
  '1000336', // Eric Gutierrez (teacher)
  '1000337', // Ruth Ortiz (teacher)
  '1000338', // Jonathan Morgan (teacher)
  '1000339', // Sharon Cooper (teacher)
  '1000340', // Stephen Peterson (teacher)
  '1000341', // Michelle Bailey (teacher)
  '1000342', // Larry Reed (teacher)
  '1000343', // Laura Kelly (teacher)
  '1000344', // Justin Howard (teacher)
  '1000345'  // Emily Ramos (teacher)
];

// Subjects for class schedules
const subjects = [
  'English', 'Math', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education',
  'Computer Science', 'Spanish', 'French', 'German', 'Biology', 'Chemistry', 'Physics',
  'Algebra', 'Geometry', 'Calculus', 'Literature', 'Writing', 'Grammar', 'Economics',
  'Government', 'Psychology', 'Sociology', 'Health', 'Drama', 'Photography', 'Cooking'
];

// Room numbers
const rooms = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
               '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
               '301', '302', '303', '304', '305', '306', '307', '308', '309', '310'];

// Helper function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to pad numbers
function pad(num, size) {
  let str = num.toString();
  while (str.length < size) {
    str = '0' + str;
  }
  return str;
}

// Generate Aeries CSV data
const aeriesHeaders = [
  'sourcedId', 'givenName', 'familyName', 'middleName', 'email', 'phone', 'dateOfBirth', 
  'sex', 'grade', 'school', 'schoolCode', 'schoolName', 'Address', 'City', 'State', 
  'ZipCode', 'ParentName', 'ParentPhone', 'ParentEmail', 'CaseManager', 'ServiceMinutes', 
  'Goals', 'Notes', 'Plan', 'SpeechProvider', 'MHProvider', 'OTProvider', 'ReviewDate', 
  'ReevalDate', 'MeetingDate', 'MedicalNotes', 'Vision', 'Hearing', 'CAASPP', 'ELPAC',
  // Schedule fields
  'period1TeacherId', 'period1Subject', 'period1Room',
  'period2TeacherId', 'period2Subject', 'period2Room',
  'period3TeacherId', 'period3Subject', 'period3Room',
  'period4TeacherId', 'period4Subject', 'period4Room',
  'period5TeacherId', 'period5Subject', 'period5Room',
  'period6TeacherId', 'period6Subject', 'period6Room',
  'period7TeacherId', 'period7Subject', 'period7Room'
];

const aeriesRows = [];

for (let i = 1; i <= 100; i++) {
  const id = 123456789 + i;
  const first = `First${i}`;
  const last = `Last${i}`;
  const mid = String.fromCharCode(65 + (i % 26));
  const email = `student${i}@school.edu`;
  const phone = `555-01${pad(i, 2)}`;
  const dob = `2008-${pad((i%12)+1,2)}-${pad((i%28)+1,2)}`;
  const sex = i % 2 === 0 ? 'M' : 'F';
  const grade = 8 + (i % 4); // Grades 8-11
  const school = 'Central High School';
  const schoolCode = 'CHS';
  const schoolName = 'Central High School';
  const address = `${100+i} Main St`;
  const city = 'Anytown';
  const state = 'CA';
  const zip = '90210';
  const parent = `Parent${i}`;
  const parentPhone = `555-02${pad(i,2)}`;
  const parentEmail = `parent${i}@email.com`;
  const caseManager = `CaseManager${i%5+1}`;
  const serviceMinutes = 60 + (i%4)*30;
  const goals = `Goal for student ${i}`;
  const notes = `Notes for student ${i}`;
  const plan = `Plan ${i%3+1}`;
  const speech = `Speech${i%3+1}`;
  const mh = `MH${i%2+1}`;
  const ot = `OT${i%2+1}`;
  const review = `2024-${pad((i%12)+1,2)}-15`;
  const reeval = `2024-${pad((i%12)+7,2)}-15`;
  const meeting = `2024-${pad((i%12)+1,2)}-10`;
  const med = `None`;
  const vision = '20/20';
  const hearing = 'Normal';
  const caaspp = 'Proficient';
  const elpac = 'Advanced';

  // Generate schedule data with correct teacher IDs
  const scheduleData = [];
  for (let period = 1; period <= 7; period++) {
    const teacherId = getRandomItem(teacherAeriesIds);
    const subject = getRandomItem(subjects);
    const room = getRandomItem(rooms);
    
    scheduleData.push(
      `${period}TeacherId`, teacherId,
      `${period}Subject`, subject,
      `${period}Room`, room
    );
  }

  // Create row with all data
  const rowData = [
    id, first, last, mid, email, phone, dob, sex, grade, school, schoolCode, schoolName,
    address, city, state, zip, parent, parentPhone, parentEmail, caseManager, serviceMinutes,
    goals, notes, plan, speech, mh, ot, review, reeval, meeting, med, vision, hearing, caaspp, elpac,
    ...scheduleData
  ];

  aeriesRows.push(rowData.join(','));
}

// Write to file
const csvContent = aeriesHeaders.join(',') + '\n' + aeriesRows.join('\n');
fs.writeFileSync('aeries_seed_data_with_correct_teachers.csv', csvContent);

console.log('Generated Aeries seed data with correct teacher IDs');
console.log('File saved as: aeries_seed_data_with_correct_teachers.csv');
console.log(`Total students: ${aeriesRows.length}`);
console.log(`Schedule periods: 7`);
console.log(`Available teacher IDs: ${teacherAeriesIds.length}`);

// Show sample of teacher assignments
console.log('\nSample teacher assignments:');
for (let i = 0; i < 3; i++) {
  console.log(`Student ${i + 1}:`);
  for (let period = 1; period <= 3; period++) {
    const teacherId = getRandomItem(teacherAeriesIds);
    const subject = getRandomItem(subjects);
    const room = getRandomItem(rooms);
    console.log(`  Period ${period}: Teacher ${teacherId}, ${subject}, Room ${room}`);
  }
} 