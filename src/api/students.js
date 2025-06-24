// This is a mock API file. Replace with your actual API calls.
export async function fetchInitialData() {
  // In a real application, you would fetch this data from your server.
  const students = [
    { id: 1, first_name: 'John', last_name: 'Doe', grade: '10', plan: 'IEP', casemanager_id: 1, schedule: { 'P1': 2, 'P2': 3 }, instruction: 'Small group', assessment: 'Read aloud', ataglance_pdf_url: '#', bip_pdf_url: '#' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', grade: '11', plan: '504', casemanager_id: 1, schedule: { 'P1': 2, 'P3': 4 }, instruction: '1-on-1', assessment: 'Extended time', ataglance_pdf_url: '#', bip_pdf_url: null },
  ];

  const users = [
    { id: 1, initials: 'JD', role: 'Case Manager', first_name: 'John', last_name: 'Dalton' },
    { id: 2, initials: 'ST', role: 'Teacher', first_name: 'Sarah', last_name: 'Tee' },
    { id: 3, initials: 'MJ', role: 'Teacher', first_name: 'Mike', last_name: 'Johnson' },
    { id: 4, initials: 'LP', role: 'Teacher', first_name: 'Lisa', last_name: 'Peterson' },
  ];

  const current_user = {
      id: 1,
      role: 'Case Manager'
  };

  return { students, users, current_user };
}