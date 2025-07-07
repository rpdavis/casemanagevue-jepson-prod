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
  'Writing', 'Grammar', 'US History', 'World History', 'Government', 'Economics', 'Psychology', 'Sociology',
  'Environmental Science', 'Physical Science', 'Music Theory', 'Photography', 'Drama', 'Cooking', 'Health'
];

// Realistic first names
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Isabella', 'Lucas', 'Sophia', 'Mason',
  'Mia', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'Sebastian',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Henry', 'Sofia', 'Jackson', 'Madison', 'Samuel',
  'Avery', 'David', 'Ella', 'Joseph', 'Scarlett', 'Carter', 'Grace', 'Owen', 'Chloe', 'Wyatt',
  'Victoria', 'John', 'Riley', 'Jack', 'Aria', 'Luke', 'Lily', 'Jayden', 'Hannah', 'Dylan',
  'Layla', 'Grayson', 'Brooklyn', 'Isaac', 'Sofia', 'Mason', 'Zoe', 'Evan', 'Nora', 'Logan',
  'Lily', 'Nathan', 'Aubrey', 'Isaac', 'Ellie', 'Andrew', 'Stella', 'Joshua', 'Natalie', 'Christopher',
  'Addison', 'Ryan', 'Savannah', 'Adrian', 'Avery', 'Miles', 'Brooklyn', 'Leo', 'Aria', 'Landon',
  'Riley', 'Jonathan', 'Sofia', 'Isaiah', 'Camila', 'Charles', 'Chloe', 'Thomas', 'Penelope', 'Aaron',
  'Layla', 'Eli', 'Riley', 'Connor', 'Luna', 'Jeremiah', 'Zoey', 'Cameron', 'Nora', 'Josiah'
];

// Realistic last names
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

// Generate 100 students with clean Aeries data (NO special education fields)
const students = [];

for (let i = 0; i < 100; i++) {
  const ssid = (123456790 + i).toString();
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const middleName = String.fromCharCode(65 + (i % 26)); // A, B, C, etc.
  
  // Generate schedule data
  const schedule = {};
  for (let period = 1; period <= 7; period++) {
    const teacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const room = Math.floor(Math.random() * 400) + 100; // Room numbers 100-499
    
    schedule[`period${period}TeacherId`] = teacherId;
    schedule[`period${period}Subject`] = subject;
    schedule[`period${period}Room`] = room.toString();
  }
  
  const student = {
    sourcedId: ssid,
    givenName: firstName,
    familyName: lastName,
    middleName: middleName,
    email: `student${i + 1}@school.edu`,
    phone: `555-${String(i + 1).padStart(4, '0')}`,
    dateOfBirth: `2008-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    sex: i % 2 === 0 ? 'M' : 'F',
    grade: String((i % 4) + 8), // Grades 8-11
    school: 'Central High School',
    schoolCode: 'CHS',
    schoolName: 'Central High School',
    Address: `${100 + i} Main St`,
    City: 'Anytown',
    State: 'CA',
    ZipCode: '90210',
    ParentName: `Parent${i + 1}`,
    ParentPhone: `555-${String(i + 1).padStart(4, '0')}`,
    ParentEmail: `parent${i + 1}@email.com`,
    ...schedule
  };
  
  students.push(student);
}

// Create CSV header with ONLY Aeries fields
const header = [
  'sourcedId', 'givenName', 'familyName', 'middleName', 'email', 'phone', 'dateOfBirth', 'sex', 'grade',
  'school', 'schoolCode', 'schoolName', 'Address', 'City', 'State', 'ZipCode', 'ParentName', 'ParentPhone', 'ParentEmail',
  'period1TeacherId', 'period1Subject', 'period1Room',
  'period2TeacherId', 'period2Subject', 'period2Room',
  'period3TeacherId', 'period3Subject', 'period3Room',
  'period4TeacherId', 'period4Subject', 'period4Room',
  'period5TeacherId', 'period5Subject', 'period5Room',
  'period6TeacherId', 'period6Subject', 'period6Room',
  'period7TeacherId', 'period7Subject', 'period7Room'
].join(',');

// Create CSV content
const csvContent = [header];

students.forEach(student => {
  const row = header.split(',').map(field => {
    const value = student[field];
    return value != null ? `"${value}"` : '';
  }).join(',');
  csvContent.push(row);
});

// Write to file
fs.writeFileSync('aeries_seed_data_clean.csv', csvContent.join('\n'));

console.log('✅ Clean Aeries seed data created: aeries_seed_data_clean.csv');
console.log('✅ Contains ONLY Aeries fields (no special education data)');
console.log('✅ Realistic names: Emma Smith, Liam Johnson, etc.');
console.log('✅ Proper schedule data with teacher IDs, subjects, rooms');
console.log('✅ 100 students with SSIDs 123456790-123456889'); 