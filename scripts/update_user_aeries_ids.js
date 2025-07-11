const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Map of Aeries IDs to user names/emails to help with matching
const aeriesIdMap = {
  'T000008708': { name: '', email: '' }, // Fill in name/email
  'T000003124': { name: '', email: '' },
  'T000005043': { name: '', email: '' },
  'T000009047': { name: '', email: '' },
  'T000008402': { name: '', email: '' },
  'T000003232': { name: '', email: '' },
  'T000009663': { name: '', email: '' },
  'T000005528': { name: '', email: '' },
  'T000007213': { name: '', email: '' },
  'T000001259': { name: '', email: '' },
  'T000004834': { name: '', email: '' },
  'T000006718': { name: '', email: '' },
  'T000008825': { name: '', email: '' },
  'T000008958': { name: '', email: '' },
  'T000003145': { name: '', email: '' },
  'T000003782': { name: '', email: '' },
  'T000003785': { name: '', email: '' },
  'T000007151': { name: '', email: '' },
  'T000006385': { name: '', email: '' },
  'T000005663': { name: '', email: '' },
  'T000004238': { name: '', email: '' },
  'T000001320': { name: '', email: '' },
  'T000009772': { name: '', email: '' },
  'T000001366': { name: '', email: '' },
  'T000007792': { name: '', email: '' },
  'T000002904': { name: '', email: '' },
  'T000004751': { name: '', email: '' },
  'T000006846': { name: '', email: '' },
  'T000002815': { name: '', email: '' },
  'T000008090': { name: '', email: '' },
  'T000002783': { name: '', email: '' },
  'T000006150': { name: '', email: '' },
  'T000008728': { name: '', email: '' },
  'T000001804': { name: '', email: '' },
  'T000008368': { name: '', email: '' },
  'T000001890': { name: '', email: '' },
  'T000009626': { name: '', email: '' },
  'T000008170': { name: '', email: '' },
  'T000004400': { name: '', email: '' },
  'T000004378': { name: '', email: '' },
  // Service Providers
  'T000003394': { name: '', email: '', provider: 'OT' },
  'T000001801': { name: '', email: '', provider: 'AT' },
  'T000002072': { name: '', email: '', provider: 'AUD' },
  'T000002053': { name: '', email: '', provider: 'DHH' },
  'T000008413': { name: '', email: '', provider: 'MH' },
  'T000005827': { name: '', email: '', provider: 'TR' },
  'T000001339': { name: '', email: '', provider: 'SC' },
  'T000004298': { name: '', email: '', provider: 'MH' }
};

async function updateUserAeriesIds() {
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    // Keep track of matched and unmatched users
    const matched = [];
    const unmatched = [];
    const aeriesIdsUsed = new Set();

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      let matched = false;

      // Try to match by name or email
      for (const [aeriesId, info] of Object.entries(aeriesIdMap)) {
        if (aeriesIdsUsed.has(aeriesId)) continue;

        if ((info.name && userData.name === info.name) || 
            (info.email && userData.email === info.email)) {
          // Update user with Aeries ID
          await userDoc.ref.update({
            aeriesId: aeriesId
          });
          
          console.log(`Updated user ${userData.name} (${userData.email}) with Aeries ID ${aeriesId}`);
          matched.push({
            name: userData.name,
            email: userData.email,
            aeriesId: aeriesId
          });
          aeriesIdsUsed.add(aeriesId);
          matched = true;
          break;
        }
      }

      if (!matched) {
        unmatched.push({
          name: userData.name,
          email: userData.email
        });
      }
    }

    // Print summary
    console.log('\nUpdate Summary:');
    console.log('----------------');
    console.log(`Matched users: ${matched.length}`);
    console.log(`Unmatched users: ${unmatched.length}`);
    
    console.log('\nMatched Users:');
    matched.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.aeriesId}`);
    });
    
    console.log('\nUnmatched Users:');
    unmatched.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    console.log('\nUnused Aeries IDs:');
    Object.entries(aeriesIdMap).forEach(([aeriesId, info]) => {
      if (!aeriesIdsUsed.has(aeriesId)) {
        console.log(`- ${aeriesId}`);
      }
    });

  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    process.exit();
  }
}

updateUserAeriesIds(); 