const fs = require('fs');

// Generate realistic user data with Firebase user IDs and Aeries IDs
function generateUsers() {
  const users = [];
  const roles = ['teacher', 'service_provider', 'administrator', 'paraeducator'];
  const providers = ['SP', 'OT', 'PT', 'AT', 'AUD', 'BIS', 'DHH', 'HN', 'MH', 'OM', 'SC', 'SW', 'TR', 'VI'];
  
  // Realistic first names and last names
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
  
  // Generate 100 users
  for (let i = 1; i <= 100; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const provider = role === 'service_provider' ? providers[Math.floor(Math.random() * providers.length)] : '';
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    
    const user = {
      id: `user${String(i).padStart(3, '0')}`, // Firebase user ID
      aeriesId: String(100000 + i), // Aeries system ID
      createdAt: new Date().toISOString(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      name: fullName,
      provider: provider,
      role: role
    };
    
    users.push(user);
  }
  
  return users;
}

// Generate student data matching the exact database structure
function generateStudents(users) {
  const students = [];
  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const plans = ['IEP', '504', 'RTI', 'None'];
  const classServices = [
    'SDC: English', 'SDC: Math', 'SDC: History', 'SDC: Science',
    'Co-teach: English', 'Co-teach: Math', 'RSP: English', 'RSP: Math',
    'Directed Studies: Directed Studies', 'FA: FA'
  ];
  
  // Realistic student names
  const studentFirstNames = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Isabella', 'Lucas', 'Sophia', 'Mason',
    'Mia', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'Sebastian',
    'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Henry', 'Sofia', 'Jackson', 'Madison', 'Samuel',
    'Avery', 'David', 'Ella', 'Joseph', 'Scarlett', 'Carter', 'Grace', 'Owen', 'Chloe', 'Wyatt',
    'Victoria', 'John', 'Riley', 'Jack', 'Aria', 'Luke', 'Lily', 'Jayden', 'Hannah', 'Dylan',
    'Layla', 'Grayson', 'Brooklyn', 'Isaac', 'Sofia', 'Isaac', 'Zoe', 'Nathan', 'Nora', 'Hunter',
    'Lily', 'Levi', 'Hazel', 'Christian', 'Violet', 'Jaxon', 'Aurora', 'Julian', 'Savannah', 'Aaron',
    'Audrey', 'Eli', 'Brooklyn', 'Charles', 'Bella', 'Connor', 'Claire', 'Landon', 'Skylar', 'Adrian',
    'Lucy', 'Jonathan', 'Paisley', 'Nolan', 'Everly', 'Jeremiah', 'Anna', 'Easton', 'Caroline', 'Ezekiel',
    'Nova', 'Miles', 'Genesis', 'Sawyer', 'Emilia', 'Jason', 'Kennedy', 'Ian', 'Samantha', 'Chase',
    'Maya', 'Adam', 'Willow', 'Blake', 'Kinsley', 'Xavier', 'Naomi', 'Bentley', 'Aaliyah', 'Kayden'
  ];
  
  const studentLastNames = [
    'Anderson', 'Brown', 'Davis', 'Garcia', 'Johnson', 'Jones', 'Miller', 'Moore', 'Robinson', 'Taylor',
    'Thomas', 'Thompson', 'White', 'Williams', 'Wilson', 'Young', 'Allen', 'Baker', 'Clark', 'Collins',
    'Cox', 'Edwards', 'Evans', 'Green', 'Hall', 'Harris', 'Jackson', 'King', 'Lee', 'Lewis',
    'Martin', 'Mitchell', 'Nelson', 'Parker', 'Phillips', 'Roberts', 'Rodriguez', 'Scott', 'Smith', 'Turner',
    'Walker', 'Ward', 'Watson', 'Wright', 'Adams', 'Bailey', 'Campbell', 'Carter', 'Cooper', 'Flores',
    'Gonzalez', 'Hill', 'Howard', 'Hughes', 'Kelly', 'Kim', 'Lopez', 'Morris', 'Murphy', 'Perez',
    'Peterson', 'Reed', 'Richardson', 'Rogers', 'Sanchez', 'Stewart', 'Torres', 'Ward', 'Wood', 'Wright',
    'Brooks', 'Butler', 'Coleman', 'Cox', 'Fisher', 'Foster', 'Gray', 'Hayes', 'James', 'Jenkins',
    'Long', 'Morgan', 'Morris', 'Powell', 'Price', 'Russell', 'Sanders', 'Simpson', 'Watson', 'Woods'
  ];
  
  // Generate 100 students
  for (let i = 1; i <= 100; i++) {
    const ssid = String(100000000 + i);
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    
    const firstName = studentFirstNames[Math.floor(Math.random() * studentFirstNames.length)];
    const lastName = studentLastNames[Math.floor(Math.random() * studentLastNames.length)];
    
    // Select random users for providers and teachers
    const teachers = users.filter(u => u.role === 'teacher').slice(0, 10);
    const serviceProviders = users.filter(u => u.role === 'service_provider').slice(0, 14);
    const caseManagers = users.filter(u => u.role === 'teacher' || u.role === 'service_provider').slice(0, 5);
    
    // Generate schedule periods
    const periods = {};
    const periodKeys = ['1', '2', '3', '4', '5', '6', 'SH'];
    periodKeys.forEach(period => {
      if (Math.random() > 0.3) { // 70% chance to have a teacher for each period
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        periods[period] = teacher.id;
      }
    });
    
    // Generate class services (random selection)
    const selectedServices = [];
    const numServices = Math.floor(Math.random() * 4) + 1; // 1-4 services
    for (let j = 0; j < numServices; j++) {
      const service = classServices[Math.floor(Math.random() * classServices.length)];
      if (!selectedServices.includes(service)) {
        selectedServices.push(service);
      }
    }
    
    // Generate provider assignments
    const providers = {};
    const providerFields = ['speechId', 'otId', 'ptId', 'atId', 'audId', 'bisId', 'dhhId', 'hnId', 'mhId', 'omId', 'scId', 'swId', 'trId', 'viId'];
    providerFields.forEach(field => {
      if (Math.random() > 0.7) { // 30% chance to have each provider
        const provider = serviceProviders[Math.floor(Math.random() * serviceProviders.length)];
        providers[field] = provider.id;
      } else {
        providers[field] = "";
      }
    });
    
    // Generate dates
    const today = new Date();
    const reviewDate = new Date(today.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
    const reevalDate = new Date(today.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
    const meetingDate = new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    const student = {
      id: `student${String(i).padStart(3, '0')}`, // Firestore document ID
      ssid: ssid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // App data structure
      app: {
        studentData: {
          firstName: firstName,
          lastName: lastName,
          grade: grade,
          plan: plan,
          caseManagerId: caseManagers[Math.floor(Math.random() * caseManagers.length)].id,
          ssid: ssid
        },
        
        dates: {
          reviewDate: reviewDate.toISOString().split('T')[0],
          reevalDate: reevalDate.toISOString().split('T')[0],
          meetingDate: meetingDate.toISOString().split('T')[0]
        },
        
        schedule: {
          periods: periods,
          classServices: selectedServices
        },
        
        providers: providers,
        
        flags: {
          flag1: Math.random() > 0.5,
          flag2: Math.random() > 0.5
        },
        
        documents: {
          bipPdfUrl: "",
          ataglancePdfUrl: ""
        },
        
        accommodations: {},
        assessment: `Assessment notes for student ${i}`,
        instruction: `Instruction notes for student ${i}`
      },
      
      // Aeries data structure
      aeries: {
        firstName: firstName,
        lastName: lastName,
        grade: grade,
        birthDate: `${2000 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        address: `${Math.floor(Math.random() * 9999)} Main St`,
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
        phone: `(555) ${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.edu`,
        parentName: `Parent${i}`,
        parentPhone: `(555) ${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        parentEmail: `parent${i}@email.com`,
        attendanceRate: `${(85 + Math.random() * 15).toFixed(1)}`,
        schedule: {
          "Period 1": {
            teacherId: String(100000 + Math.floor(Math.random() * 50) + 1),
            subject: "English 9",
            room: "A101"
          },
          "Period 2": {
            teacherId: String(100000 + Math.floor(Math.random() * 50) + 1),
            subject: "Algebra 1",
            room: "B205"
          }
        }
      },
      
      // SEIS data structure
      seis: {
        firstName: firstName,
        lastName: lastName,
        grade: grade,
        birthDate: `${2000 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        eligibilityCategory: "Specific Learning Disability",
        primaryDisability: "Dyslexia",
        secondaryDisability: "ADHD",
        iepStartDate: "2023-09-01",
        iepEndDate: "2024-06-30",
        annualReviewDate: "2024-03-15",
        triennialDate: "2024-06-20",
        services: [
          "Speech and Language Therapy",
          "Occupational Therapy",
          "Resource Specialist Program"
        ],
        goals: [
          "Improve reading comprehension by 20%",
          "Develop organizational skills",
          "Increase attention span during class"
        ],
        behaviorPlan: "Yes",
        socialSkills: "Needs improvement",
        transitionPlan: "Post-secondary education"
      }
    };
    
    students.push(student);
  }
  
  return students;
}

// Generate the complete seed data
function generateSeedData() {
  console.log('Generating users...');
  const users = generateUsers();
  
  console.log('Generating students...');
  const students = generateStudents(users);
  
  const seedData = {
    users: users,
    students: students,
    metadata: {
      generatedAt: new Date().toISOString(),
      userCount: users.length,
      studentCount: students.length,
      description: "Seed data matching DATABASE_FIELDS.md structure"
    }
  };
  
  return seedData;
}

// Save to files
function saveSeedData(seedData) {
  // Save as JSON backup
  fs.writeFileSync('database_seed_data.json', JSON.stringify(seedData, null, 2));
  console.log('✅ Saved database_seed_data.json');
  
  // Save users as CSV
  const userCsv = [
    'id,aeriesId,createdAt,email,name,provider,role',
    ...seedData.users.map(user => 
      `${user.id},${user.aeriesId},${user.createdAt},${user.email},${user.name},${user.provider},${user.role}`
    )
  ].join('\n');
  fs.writeFileSync('database_users_seed.csv', userCsv);
  console.log('✅ Saved database_users_seed.csv');
  
  // Save students as CSV (flattened for import)
  const studentCsv = [
    'ssid,firstName,lastName,grade,plan,caseManagerId,reviewDate,reevalDate,meetingDate,assessment,instruction,flag1,flag2',
    ...seedData.students.map(student => {
      const app = student.app;
      return [
        student.ssid,
        app.studentData.firstName,
        app.studentData.lastName,
        app.studentData.grade,
        app.studentData.plan,
        app.studentData.caseManagerId,
        app.dates.reviewDate,
        app.dates.reevalDate,
        app.dates.meetingDate,
        app.assessment,
        app.instruction,
        app.flags.flag1,
        app.flags.flag2
      ].join(',');
    })
  ].join('\n');
  fs.writeFileSync('database_students_seed.csv', studentCsv);
  console.log('✅ Saved database_students_seed.csv');
  
  // Create a sample for verification
  const sample = {
    sampleUser: seedData.users[0],
    sampleStudent: seedData.students[0],
    userCount: seedData.users.length,
    studentCount: seedData.students.length
  };
  
  fs.writeFileSync('database_seed_sample.json', JSON.stringify(sample, null, 2));
  console.log('✅ Saved database_seed_sample.json');
  
  console.log('\n📊 Seed Data Summary:');
  console.log(`- Users: ${seedData.users.length}`);
  console.log(`- Students: ${seedData.students.length}`);
  console.log(`- Files created: database_seed_data.json, database_users_seed.csv, database_students_seed.csv, database_seed_sample.json`);
}

// Run the generator
console.log('🚀 Generating database seed data...');
const seedData = generateSeedData();
saveSeedData(seedData);
console.log('\n✅ Seed data generation complete!'); 