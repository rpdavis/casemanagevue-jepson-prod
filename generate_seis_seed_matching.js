const fs = require('fs');

// Use the same SSIDs as Aeries seed data (123456790-123456889)
const ssids = Array.from({length: 100}, (_, i) => (123456790 + i).toString());

// Realistic first names
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Isabella', 'Lucas', 'Sophia', 'Mason',
  'Mia', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'Sebastian',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Henry', 'Sofia', 'Jackson', 'Madison', 'Samuel',
  'Avery', 'David', 'Ella', 'Joseph', 'Scarlett', 'Carter', 'Grace', 'Owen', 'Chloe', 'Wyatt',
  'Victoria', 'John', 'Riley', 'Jack', 'Aria', 'Luke', 'Lily', 'Jayden', 'Hannah', 'Dylan',
  'Layla', 'Grayson', 'Brooklyn', 'Isaac', 'Sofia', 'Mason', 'Zoe', 'Evan', 'Nora', 'Logan',
  'Lily', 'Cameron', 'Chloe', 'Connor', 'Hazel', 'Isaac', 'Violet', 'Nathan', 'Aurora', 'Hunter',
  'Savannah', 'Levi', 'Audrey', 'Christian', 'Bella', 'Julian', 'Lucy', 'Aaron', 'Paisley', 'Eli',
  'Skylar', 'Adrian', 'Natalie', 'Jonathan', 'Stella', 'Nolan', 'Maya', 'Easton', 'Penelope', 'Jace',
  'Luna', 'Colton', 'Ellie', 'Roman', 'Addison', 'Elias', 'Lillian', 'Brayden', 'Nova', 'Adam'
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

// Middle names
const middleNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

// Disabilities
const disabilities = [
  'Specific Learning Disability', 'Other Health Impairment', 'Autism', 'Speech or Language Impairment',
  'Intellectual Disability', 'Emotional Disturbance', 'Multiple Disabilities', 'Deafness', 'Hearing Impairment',
  'Visual Impairment', 'Deaf-Blindness', 'Orthopedic Impairment', 'Traumatic Brain Injury'
];

// Service providers
const serviceProviders = ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Lisa Rodriguez', 'Dr. David Kim', 'Dr. Jennifer Smith'];

// Accommodations
const accommodations = [
  'Extended time on tests; Preferential seating; Use of calculator; Text-to-speech software',
  'Preferential seating; Use of calculator; Text-to-speech software; Speech-to-text software',
  'Use of calculator; Text-to-speech software; Speech-to-text software; Large print materials',
  'Text-to-speech software; Speech-to-text software; Large print materials; Audio recordings',
  'Speech-to-text software; Large print materials; Audio recordings; Note-taking assistance',
  'Large print materials; Audio recordings; Note-taking assistance; Reduced homework load',
  'Audio recordings; Note-taking assistance; Reduced homework load; Modified assignments',
  'Note-taking assistance; Reduced homework load; Modified assignments; Behavior support plan',
  'Reduced homework load; Modified assignments; Behavior support plan; Social skills group',
  'Modified assignments; Behavior support plan; Social skills group; Counseling services'
];

// IEP Services
const iepServices = [
  'Specialized Academic Instruction',
  'Speech and Language Therapy',
  'Occupational Therapy',
  'Physical Therapy',
  'Counseling Services',
  'Behavioral Support',
  'Assistive Technology',
  'Adapted Physical Education',
  'Social Skills Training',
  'Transition Services'
];

// Generate CSV content
let csvContent = 'sourcedId,FirstName,LastName,MiddleName,Grade,DOB,Gender,Ethnicity,School,Address,City,State,ZipCode,Phone,ParentName,ParentPhone,ParentEmail,ELL,504,IEP,CaseManager,Disability,ServiceMinutes,Goals,Notes,Plan,ReviewDate,ReevalDate,MeetingDate,SpeechProvider,MHProvider,OTProvider,ProgramAccommodations,Accommodations,IEP_Services\n';

for (let i = 0; i < 100; i++) {
  const ssid = ssids[i];
  const firstName = firstNames[i];
  const lastName = lastNames[i];
  const middleName = middleNames[i % middleNames.length];
  const grade = Math.floor(Math.random() * 4) + 9; // 9-12
  const dob = `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${2008 + Math.floor(Math.random() * 4)}`;
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const ethnicity = ['White', 'Hispanic', 'Black', 'Asian', 'Pacific Islander', 'American Indian', 'Two or More Races'][Math.floor(Math.random() * 7)];
  const school = ['Lincoln High School', 'Washington High School', 'Roosevelt High School', 'Kennedy High School'][Math.floor(Math.random() * 4)];
  const address = `${Math.floor(Math.random() * 9999) + 1} ${['Main St', 'Oak St', 'Pine St', 'Elm St', 'Maple St', 'Cedar St'][Math.floor(Math.random() * 6)]}`;
  const city = ['Springfield', 'Riverside', 'Fairview', 'Oakland', 'Greenfield'][Math.floor(Math.random() * 5)];
  const state = 'CA';
  const zipCode = Math.floor(Math.random() * 99999) + 90000;
  const phone = `555-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  const parentName = `${lastName} Family`;
  const parentPhone = `555-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  const parentEmail = `parent${i + 1}@example.com`;
  const ell = Math.random() > 0.7 ? 'Yes' : 'No';
  const plan504 = Math.random() > 0.6 ? 'Yes' : 'No';
  const iep = Math.random() > 0.3 ? 'Yes' : 'No';
  const caseManager = serviceProviders[Math.floor(Math.random() * serviceProviders.length)];
  const disability = disabilities[Math.floor(Math.random() * disabilities.length)];
  const serviceMinutes = Math.floor(Math.random() * 300) + 60;
  const goals = `Improve ${['reading comprehension', 'math problem-solving skills', 'social communication skills', 'organizational skills', 'written expression abilities', 'executive functioning skills'][Math.floor(Math.random() * 6)]}`;
  const notes = `Student demonstrates ${disability.toLowerCase()}. Requires specialized support and accommodations.`;
  const plan = iep === 'Yes' ? 'IEP' : (plan504 === 'Yes' ? '504 Plan' : 'General Education');
  const reviewDate = `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2026`;
  const reevalDate = `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2028`;
  const meetingDate = `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2025`;
  const speechProvider = serviceProviders[Math.floor(Math.random() * serviceProviders.length)];
  const mhProvider = serviceProviders[Math.floor(Math.random() * serviceProviders.length)];
  const otProvider = serviceProviders[Math.floor(Math.random() * serviceProviders.length)];
  const programAccommodations = accommodations[Math.floor(Math.random() * accommodations.length)];
  const accommodationsField = programAccommodations;
  const iepServicesField = iepServices[Math.floor(Math.random() * iepServices.length)];

  csvContent += `"${ssid}","${firstName}","${lastName}","${middleName}","${grade}","${dob}","${gender}","${ethnicity}","${school}","${address}","${city}","${state}","${zipCode}","${phone}","${parentName}","${parentPhone}","${parentEmail}","${ell}","${plan504}","${iep}","${caseManager}","${disability}","${serviceMinutes}","${goals}","${notes}","${plan}","${reviewDate}","${reevalDate}","${meetingDate}","${speechProvider}","${mhProvider}","${otProvider}","${programAccommodations}","${accommodationsField}","${iepServicesField}"\n`;
}

// Write to file
fs.writeFileSync('seis_seed_data_matching.csv', csvContent);
console.log('SEIS seed data with matching SSIDs created: seis_seed_data_matching.csv');
console.log(`Generated ${100} students with SSIDs: ${ssids[0]} to ${ssids[99]}`); 