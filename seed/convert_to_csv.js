import fs from 'fs';

// Read the generated JSON seed data
const seedData = JSON.parse(fs.readFileSync('firestore_seed_data.json', 'utf8'));

// CSV headers matching your bulk importer format - COMPLETE VERSION
const csvHeaders = [
  'SSID',
  'FirstName', 
  'LastName',
  'Grade',
  'Plan',
  'CaseManagerId',
  'ReviewDate',
  'ReevalDate', 
  'MeetingDate',
  'Period1Teacher',
  'Period2Teacher',
  'Period3Teacher', 
  'Period4Teacher',
  'Period5Teacher',
  'Period6Teacher',
  'PeriodSHTeacher',
  'ClassServices',
  'SpeechProvider',
  'OTProvider',
  'PTProvider',
  'ATProvider',
  'Audiologist',
  'BISProvider',
  'DHHProvider',
  'HNProvider',
  'MHProvider',
  'OMProvider',
  'SCProvider',
  'SWProvider',
  'TRProvider',
  'VIProvider',
  'Flag1',
  'Flag2',
  'BIPPdfUrl',
  'AtAGlancePdfUrl',
  'Assessment',
  'Instruction'
];

// Convert JSON students to CSV rows
const csvRows = [];

seedData.students.forEach(student => {
  const row = [
    student.ssid,
    student.app.studentData.firstName,
    student.app.studentData.lastName,
    student.app.studentData.grade,
    student.app.studentData.plan,
    student.app.studentData.caseManagerId,
    student.app.dates.reviewDate,
    student.app.dates.reevalDate,
    student.app.dates.meetingDate,
    student.app.schedule.periods['1'] || '',
    student.app.schedule.periods['2'] || '',
    student.app.schedule.periods['3'] || '',
    student.app.schedule.periods['4'] || '',
    student.app.schedule.periods['5'] || '',
    student.app.schedule.periods['6'] || '',
    student.app.schedule.periods['SH'] || '',
    student.app.schedule.classServices ? student.app.schedule.classServices.join(',') : '',
    student.app.providers.speechId || '',
    student.app.providers.otId || '',
    student.app.providers.ptId || '',
    student.app.providers.atId || '',
    student.app.providers.audId || '',
    student.app.providers.bisId || '',
    student.app.providers.dhhId || '',
    student.app.providers.hnId || '',
    student.app.providers.mhId || '',
    student.app.providers.omId || '',
    student.app.providers.scId || '',
    student.app.providers.swId || '',
    student.app.providers.trId || '',
    student.app.providers.viId || '',
    student.app.flags.flag1 || false,
    student.app.flags.flag2 || false,
    student.app.documents.bipPdfUrl || '',
    student.app.documents.ataglancePdfUrl || '',
    student.app.accommodations.assessment || '',
    student.app.accommodations.instruction || ''
  ];
  
  // Escape commas and quotes in CSV values
  const escapedRow = row.map(value => {
    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  });
  
  csvRows.push(escapedRow.join(','));
});

// Create CSV content
const csvContent = csvHeaders.join(',') + '\n' + csvRows.join('\n');

// Write CSV file
fs.writeFileSync('student_seed_data.csv', csvContent);

console.log('✅ CSV seed data generated!');
console.log(`📊 Converted ${seedData.students.length} students to CSV`);
console.log('📁 Saved to: student_seed_data.csv');
console.log('');
console.log('🔧 CSV Format:');
console.log('   - Compatible with StudentBulkImporter');
console.log('   - Proper accommodation strings');
console.log('   - All required fields included');
console.log('   - Ready for bulk import!'); 