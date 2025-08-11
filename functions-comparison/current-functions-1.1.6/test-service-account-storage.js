const { onCall } = require("firebase-functions/v2/https");
const { google } = require("googleapis");

// Simple test function to check service account storage
exports.checkServiceAccountStorage = onCall({
  region: "us-central1",
  maxInstances: 10
}, async (request) => {
  try {
    // Use ADC (Application Default Credentials)
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Get about information
    const about = await drive.about.get({
      fields: 'storageQuota,user'
    });
    
    const quota = about.data.storageQuota;
    const user = about.data.user;
    
    const result = {
      user: user.emailAddress,
      total: quota.limit,
      used: quota.usage,
      available: quota.limit - quota.usage,
      usagePercent: Math.round((quota.usage / quota.limit) * 100)
    };
    
    console.log('Service Account Storage:', result);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('Error checking service account storage:', error);
    return {
      success: false,
      error: error.message
    };
  }
}); 