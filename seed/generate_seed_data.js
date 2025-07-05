const fs = require('fs');

function pad(num, size) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

const aeriesHeaders = [
  'sourcedId','givenName','familyName','middleName','email','phone','dateOfBirth','sex','grade','school','schoolCode','schoolName','Address','City','State','ZipCode','ParentName','ParentPhone','ParentEmail','CaseManager','ServiceMinutes','Goals','Notes','Plan','SpeechProvider','MHProvider','OTProvider','ReviewDate','ReevalDate','MeetingDate','MedicalNotes','Vision','Hearing','CAASPP','ELPAC'
];

const seisHeaders = [
  'SSID','FirstName','LastName','MiddleName','Grade','DOB','Gender','Ethnicity','School','Address','City','State','ZipCode','Phone','ParentName','ParentPhone','ParentEmail','ELL','504','IEP','CaseManager','Disability','ServiceMinutes','Goals','Notes','Plan','ReviewDate','ReevalDate','MeetingDate','SpeechProvider','MHProvider','OTProvider','ProgramAccommodations','Accommodations','IEP_Services'
];

const aeriesRows = [];
const seisRows = [];

for (let i = 1; i <= 100; i++) {
  const id = 123456789 + i;
  const first = `First${i}`;
  const last = `Last${i}`;
  const mid = String.fromCharCode(65 + (i % 26));
  const email = `student${i}@school.edu`;
  const phone = `555-01${pad(i, 2)}`;
  const dob = `2008-${pad((i%12)+1,2)}-${pad((i%28)+1,2)}`;
  const sex = i % 2 === 0 ? 'M' : 'F';
  const grade = 8;
  const school = 'Central Middle School';
  const schoolCode = 'CMS';
  const schoolName = 'Central Middle School';
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

  // Aeries row
  aeriesRows.push([
    id, first, last, mid, email, phone, dob, sex, grade, school, schoolCode, schoolName, address, city, state, zip, parent, parentPhone, parentEmail, caseManager, serviceMinutes, goals, notes, plan, speech, mh, ot, review, reeval, meeting, med, vision, hearing, caaspp, elpac
  ].join(','));

  // SEIS row
  seisRows.push([
    id, first, last, mid, grade, dob, sex, '', school, address, city, state, zip, phone, parent, parentPhone, parentEmail, '', '', '', caseManager, '', serviceMinutes, goals, notes, plan, review, reeval, meeting, speech, mh, ot, 'Accommodation1;Accommodation2', 'Accommodation1;Accommodation2', 'Service1;Service2'
  ].join(','));
}

fs.writeFileSync('seed/aeries_seed_data.csv', aeriesHeaders.join(',') + '\n' + aeriesRows.join('\n'));
fs.writeFileSync('seed/seis_seed_data.csv', seisHeaders.join(',') + '\n' + seisRows.join('\n'));

console.log('Seed data generated!'); 