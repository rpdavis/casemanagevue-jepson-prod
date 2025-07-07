const fs = require('fs');

// Realistic first and last names for teachers
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
  'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
  'Kenneth', 'Laura', 'Kevin', 'Emily', 'Brian', 'Kimberly', 'George', 'Deborah', 'Edward', 'Dorothy',
  'Ronald', 'Lisa', 'Timothy', 'Nancy', 'Jason', 'Karen', 'Jeffrey', 'Betty', 'Ryan', 'Helen',
  'Jacob', 'Sandra', 'Gary', 'Donna', 'Nicholas', 'Carol', 'Eric', 'Ruth', 'Jonathan', 'Sharon',
  'Stephen', 'Michelle', 'Larry', 'Laura', 'Justin', 'Emily', 'Scott', 'Kimberly', 'Brandon', 'Deborah',
  'Benjamin', 'Dorothy', 'Frank', 'Lisa', 'Gregory', 'Nancy', 'Raymond', 'Karen', 'Samuel', 'Betty',
  'Patrick', 'Helen', 'Alexander', 'Sandra', 'Jack', 'Donna', 'Dennis', 'Carol', 'Jerry', 'Ruth'
];

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

// Service provider abbreviations and names
const serviceProviders = [
  { abbreviation: 'SLP', name: 'Speech-Language Therapy Provider' },
  { abbreviation: 'OT', name: 'Occupational Therapy Provider' },
  { abbreviation: 'PT', name: 'Physical Therapy Provider' },
  { abbreviation: 'SC', name: 'School Counseling Provider' },
  { abbreviation: 'MH', name: 'School-Based Mental Health Services Provider' },
  { abbreviation: 'TR', name: 'Transportation Provider' },
  { abbreviation: 'AUD', name: 'Audiology Services Provider' },
  { abbreviation: 'VI', name: 'Vision Services Provider' },
  { abbreviation: 'AT', name: 'Assistive Technology Provider' },
  { abbreviation: 'DHH', name: 'Deaf and Hard of Hearing Services Provider' },
  { abbreviation: 'O&M', name: 'Orientation & Mobility Provider' },
  { abbreviation: 'BIS', name: 'Behavior Intervention Services Provider' },
  { abbreviation: 'HN', name: 'Health/Nursing Provider' },
  { abbreviation: 'SW', name: 'Social Work Provider' }
];

// Generate realistic user data
const users = [];

// 1 SPED Chair (teacher role)
users.push({
  name: `${firstNames[0]} ${lastNames[0]}`,
  email: 'sped.chair@school.org',
  role: 'sped_chair',
  provider: '',
  aeriesId: '100000'
});

// 14 Service Providers
serviceProviders.forEach((provider, index) => {
  users.push({
    name: `${firstNames[index + 1]} ${lastNames[index + 1]}`,
    email: `${provider.abbreviation.toLowerCase()}@school.org`,
    role: 'service_provider',
    provider: provider.abbreviation,
    aeriesId: `10000${index + 1}`
  });
});

// 10 Paraeducators (aides)
for (let i = 0; i < 10; i++) {
  users.push({
    name: `${firstNames[i + 15]} ${lastNames[i + 15]}`,
    email: `aide${i + 1}@school.org`,
    role: 'paraeducator',
    provider: '',
    aeriesId: `10001${i + 5}`
  });
}

// 6 Admins
for (let i = 0; i < 6; i++) {
  users.push({
    name: `${firstNames[i + 25]} ${lastNames[i + 25]}`,
    email: `admin${i + 1}@school.org`,
    role: 'admin',
    provider: '',
    aeriesId: `10002${i + 5}`
  });
}

// 45 Teachers (including case managers, sped chairs, and administrator_504_CM)
for (let i = 0; i < 45; i++) {
  const firstName = firstNames[i + 31];
  const lastName = lastNames[i + 31];
  const teacherNum = i + 1;
  
  // Assign some teachers as case managers, sped chairs, or administrator_504_CM
  let role = 'teacher';
  if (i < 5) {
    role = 'case_manager'; // First 5 teachers are case managers
  } else if (i === 5) {
    role = 'sped_chair'; // 6th teacher is also a sped chair
  } else if (i < 10) {
    role = 'administrator_504_CM'; // Teachers 7-11 are administrator_504_CM
  }
  
  users.push({
    name: `${firstName} ${lastName}`,
    email: `teacher${teacherNum}@school.org`,
    role: role,
    provider: '',
    aeriesId: `10003${i + 1}`
  });
}

// Convert to CSV format
const csvHeader = 'Name,Email,Role,Provider,AeriesID\n';
const csvRows = users.map(user => 
  `"${user.name}","${user.email}","${user.role}","${user.provider}","${user.aeriesId}"`
).join('\n');

const csvContent = csvHeader + csvRows;

// Write to file
fs.writeFileSync('realistic_user_seed_data.csv', csvContent);

console.log(`Generated realistic user seed data with ${users.length} users:`);
console.log(`- 1 SPED Chair (teacher role)`);
console.log(`- 14 Service Providers`);
console.log(`- 10 Paraeducators`);
console.log(`- 6 Admins`);
console.log(`- 45 Teachers (including 5 case managers, 1 sped chair, and 4 administrator_504_CM)`);
console.log('\nFile saved as: realistic_user_seed_data.csv');

// Also create a summary of teacher Aeries IDs for reference
const teachers = users.filter(u => u.role === 'teacher' || u.role === 'case_manager' || u.role === 'sped_chair' || u.role === 'administrator_504_CM');
console.log('\nTeacher Aeries IDs for schedule assignment:');
teachers.forEach(teacher => {
  console.log(`${teacher.name} (${teacher.role}): ${teacher.aeriesId}`);
}); 