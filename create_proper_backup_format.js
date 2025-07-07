const fs = require('fs');

// Read the existing seed data
const seedData = JSON.parse(fs.readFileSync('database_seed_data.json', 'utf8'));

// Convert to proper backup format
const backupData = {
  metadata: {
    version: "1.0",
    createdAt: new Date().toISOString(),
    createdBy: "admin",
    description: "Demo seed data backup with realistic names"
  },
  collections: {
    users: seedData.users,
    students: seedData.students
  }
};

// Save as proper backup format
fs.writeFileSync('demo_backup_data.json', JSON.stringify(backupData, null, 2));
console.log('✅ Created demo_backup_data.json in proper backup format');

// Also create a smaller sample backup for testing
const sampleBackup = {
  metadata: {
    version: "1.0",
    createdAt: new Date().toISOString(),
    createdBy: "admin",
    description: "Sample demo data (10 users, 10 students)"
  },
  collections: {
    users: seedData.users.slice(0, 10),
    students: seedData.students.slice(0, 10)
  }
};

fs.writeFileSync('demo_sample_backup.json', JSON.stringify(sampleBackup, null, 2));
console.log('✅ Created demo_sample_backup.json (smaller sample)');

console.log('\n📊 Backup Files Created:');
console.log('- demo_backup_data.json (100 users, 100 students)');
console.log('- demo_sample_backup.json (10 users, 10 students)');
console.log('\n💡 Use these files in the Admin Backup & Restore panel!'); 