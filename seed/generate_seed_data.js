import fs from 'fs';

// Helper function to generate random dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to generate realistic accommodation combinations
function generateAccommodationList(accommodations, minCount, maxCount) {
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  const shuffled = [...accommodations].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  return selected.join('; ');
}

// Generate student seed data matching the form structure
function generateStudentSeedData() {
  const students = [];
  
  // Realistic student names for variety
  const firstNames = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
    'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
    'Abigail', 'Michael', 'Emily', 'Elijah', 'Elizabeth', 'Daniel', 'Mila', 'Matthew', 'Ella', 'Jackson',
    'Madison', 'David', 'Scarlett', 'Sebastian', 'Victoria', 'Joseph', 'Sofia', 'Samuel', 'Grace', 'Carter',
    'Chloe', 'Owen', 'Camila', 'Wyatt', 'Penelope', 'John', 'Riley', 'Jack', 'Layla', 'Luke',
    'Zoey', 'Jayden', 'Nora', 'Dylan', 'Lily', 'Grayson', 'Eleanor', 'Levi', 'Hannah', 'Isaac',
    'Lillian', 'Gabriel', 'Addison', 'Julian', 'Aubrey', 'Mateo', 'Ellie', 'Anthony', 'Stella', 'Jaxon'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
  ];
  const grades = ['6', '7', '8', '9', '10', '11', '12'];
  const plans = ['IEP', '504', 'RTI', 'None'];
  
  const classServices = [
    ['SDC: English', 'SDC: Math'],
    ['RSP: Reading', 'RSP: Math'],
    ['Co-teach: English', 'RSP: English'],
    ['SDC: History', 'SDC: Science', 'Co-teach: English'],
    ['Speech Therapy', 'OT Services'],
    ['RSP: English', 'RSP: Math', 'RSP: Science']
  ];
  
  // Assessment accommodation bank
  const assessmentAccommodations = [
    'Extended time for assessments (time and a half)',
    'Allow for test re-takes if the score is below average (less than 2 on a 4-point scale, less than 70%)',
    'Separate setting for assessments (RSP room or other smaller setting)',
    'Access to notes',
    'Directions to be read, clarified, or simplified as needed',
    'Access to notes during tests when necessary',
    'Simplify instructions or allow verbal clarification of math assessment items',
    'Option to clarify or rephrase directions for tests',
    'Shortened Assessments: (when appropriate and does not compromise the integrity of the learning objectives)',
    'Use of calculator to check for computation accuracy when calculations are not the primary focus of the assessment'
  ];
  
  // Instructional accommodation bank
  const instructionAccommodations = [
    'Use of multiplication chart and calculator (when not assessing computational skills)',
    'Access to multiplication chart and number line as needed',
    'Use of calculator to check for computation accuracy when calculations are not the primary focus of the assessment',
    'Preferential seating (near the point of instructions, near a positive peer, or an area with the least distractions)',
    'Simplified, repeated, or rephrased directions as needed',
    'Access to notes or cloze notes',
    'Shortened assignments: when appropriate and when they do not compromise the integrity of the learning objectives, ensuring the student can demonstrate understanding as determined by the teacher',
    'Use of graphic organizer checklist for organizing larger writing assignments',
    'Access to word bank as needed',
    'Access to audiobooks or other audio supports (teacher read aloud) for longer reading materials, as needed',
    'Extended time on assignments (up to 2 weeks, not to exceed the grading period)',
    'Check for understanding and work completion',
    'Divide larger projects or assignments into manageable parts with incremental deadlines',
    'Chunk instructions/visual checklists as needed',
    'Allow for short breaks',
    'Allow for breaks when needed',
    'Allow use of sensory tools (e.g., fidgets, stress balls) if they help regulate focus'
  ];

  for (let i = 1; i <= 50; i++) {
    const ssid = String(1000000000 + i).padStart(10, '0');
    
    // Use different indices to avoid same first/last name combinations
    const firstName = firstNames[(i * 7) % firstNames.length];
    const lastName = lastNames[(i * 11) % lastNames.length];
    const grade = grades[i % grades.length];
    const plan = plans[i % plans.length];
    
    // Generate random dates
    const baseDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    const reviewDate = formatDate(randomDate(baseDate, endDate));
    const reevalDate = formatDate(randomDate(baseDate, endDate));
    const meetingDate = formatDate(randomDate(baseDate, endDate));
    
    // Use 10-digit Aeries IDs from bulk_users.csv (for bulk importer mapping)
    // Case managers: T000005810, T000004524, T000007840, T000009914, T000002346, T000005824, T000006903, T000002587
    const caseManagerAeriesIds = ['T000005810', 'T000004524', 'T000007840', 'T000009914', 'T000002346', 'T000005824', 'T000006903', 'T000002587'];
    const caseManagerId = caseManagerAeriesIds[i % caseManagerAeriesIds.length];
    
    // Teachers: T000008170, T000002783, T000008708, etc. (first 40 users)
    const teacherAeriesIds = [
      'T000008170', 'T000002783', 'T000008708', 'T000003124', 'T000005528', 'T000005043', 'T000007213', 'T000009047',
      'T000005663', 'T000003145', 'T000001259', 'T000008402', 'T000004238', 'T000003232', 'T000004834', 'T000003782',
      'T000004400', 'T000009663', 'T000002904', 'T000008090', 'T000001320', 'T000003785', 'T000006718', 'T000006150',
      'T000009626', 'T000001366', 'T000008825', 'T000008728', 'T000009772', 'T000001804', 'T000004751', 'T000008368',
      'T000004378', 'T000007151', 'T000008958', 'T000007792', 'T000001890', 'T000002815', 'T000006846', 'T000006385'
    ];
    
    const teacherIds = {
      1: teacherAeriesIds[((i * 2) % 40)],
      2: teacherAeriesIds[((i * 3) % 40)],
      3: teacherAeriesIds[((i * 5) % 40)],
      4: teacherAeriesIds[((i * 7) % 40)],
      5: teacherAeriesIds[((i * 11) % 40)],
      6: teacherAeriesIds[((i * 13) % 40)],
      SH: teacherAeriesIds[((i * 17) % 40)]
    };
    
    // Service providers with 10-digit Aeries IDs:
    const providers = {
      speechId: "", // No speech providers in your bulk_users.csv
      otId: i % 3 === 0 ? "T000003394" : "", // Victoria Kim (OT)
      mhId: i % 5 === 0 ? (i % 2 === 0 ? "T000004298" : "T000008413") : "", // Alexander Garcia or Alexander Young (MH)
      ptId: "", // No PT providers in your bulk_users.csv
      scId: i % 7 === 0 ? "T000001339" : "", // Skylar Anderson (SC)
      trId: i % 6 === 0 ? "T000005827" : "", // Theodore Garcia (TR)
      audId: i % 8 === 0 ? (i % 2 === 0 ? "T000002072" : "T000003243") : "", // Emily Cook or Jayden Gonzalez (AUD)
      viId: "", // No VI providers in your bulk_users.csv
      atId: i % 4 === 0 ? (i % 2 === 0 ? "T000001801" : "T000003401") : "", // Brooklyn Bailey or Mason Hernandez (AT)
      dhhId: i % 9 === 0 ? "T000002053" : "", // Jack Roberts (DHH)
      omId: "", // No OM providers in your bulk_users.csv
      bisId: "", // No BIS providers in your bulk_users.csv
      hnId: "", // No HN providers in your bulk_users.csv
      swId: "" // No SW providers in your bulk_users.csv
    };

    const student = {
      ssid: ssid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      app: {
        studentData: {
          firstName: firstName,
          lastName: lastName,
          grade: grade,
          plan: plan,
          caseManagerId: caseManagerId,
          ssid: ssid
        },
        dates: {
          meetingDate: meetingDate,
          reevalDate: reevalDate,
          reviewDate: reviewDate
        },
        schedule: {
          periods: teacherIds,
          classServices: classServices[i % classServices.length]
        },
        providers: providers,
        flags: {
          flag1: i % 3 === 0,
          flag2: i % 4 === 0
        },
        documents: {
          ataglancePdfUrl: null,
          bipPdfUrl: null
        },
        accommodations: {
          instruction: generateAccommodationList(instructionAccommodations, 2, 4),
          assessment: generateAccommodationList(assessmentAccommodations, 2, 3)
        }
      },
      aeries: {},
      seis: {}
    };

    students.push(student);
  }

  return { students };
}

// Generate and save the seed data
const seedData = generateStudentSeedData();
fs.writeFileSync('firestore_seed_data.json', JSON.stringify(seedData, null, 2));

console.log('✅ Firestore seed data generated!');
console.log(`📊 Generated ${seedData.students.length} students`);
console.log('📁 Saved to: firestore_seed_data.json');
console.log('');
console.log('🔧 Structure matches:');
console.log('   - StudentForm.vue saving format');
console.log('   - StudentBulkImporter expected format');
console.log('   - Complete app.* nested structure');
console.log('   - All provider fields included');
console.log('   - Proper accommodations.instruction/assessment format'); 