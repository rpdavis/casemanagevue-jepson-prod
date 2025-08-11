const { onCall } = require("firebase-functions/v2/https");
const { google } = require("googleapis");

// ADC will pick up the function's service account automatically
const auth = new google.auth.GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents'
  ]
});

exports.setupSharedDrive = onCall({
  region: "us-central1"
}, async (request) => {
  try {
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });
    
    // Create Shared Drive
    console.log('🔄 Creating Shared Drive...');
    const sharedDrive = await drive.drives.create({
      requestId: `shared-drive-${Date.now()}`,
      requestBody: {
        name: 'CaseManageVue Templates',
        restrictions: {
          adminManagedRestrictions: true
        }
      }
    });
    
    const sharedDriveId = sharedDrive.data.id;
    console.log(`✅ Created Shared Drive: ${sharedDriveId}`);
    
    // Add service account as manager
    console.log('🔄 Adding service account as manager...');
    await drive.permissions.create({
      fileId: sharedDriveId,
      requestBody: {
        role: 'manager',
        type: 'user',
        emailAddress: 'casemanagevue@casemangervue.iam.gserviceaccount.com'
      },
      supportsAllDrives: true
    });
    
    console.log('✅ Added service account as manager');
    
    // Create Templates folder
    console.log('🔄 Creating Templates folder...');
    const templatesFolder = await drive.files.create({
      requestBody: {
        name: 'Templates',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [sharedDriveId]
      },
      supportsAllDrives: true
    });
    
    console.log(`✅ Created Templates folder: ${templatesFolder.data.id}`);
    
    return {
      success: true,
      sharedDriveId: sharedDriveId,
      sharedDriveName: 'CaseManageVue Templates',
      templatesFolderId: templatesFolder.data.id,
      message: 'Shared Drive setup complete!'
    };
    
  } catch (error) {
    console.error('❌ Error setting up Shared Drive:', error);
    return {
      success: false,
      error: error.message
    };
  }
}); 