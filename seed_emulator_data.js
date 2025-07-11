// Seed script for Firebase emulators
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from "firebase/auth";

// Development configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtkhofccSy97Grr2c3BF2XsaFzLGhx0So",
  authDomain: "casemanagevue-dev.firebaseapp.com",
  projectId: "casemanagevue-dev",
  storageBucket: "casemanagevue-dev.firebasestorage.app",
  messagingSenderId: "781576648552",
  appId: "1:781576648552:web:5dcdba090d1f281ad108dd",
  measurementId: "G-FQQY8QYWPH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

async function seedEmulatorData() {
  try {
    console.log('🌱 Seeding emulator data...');

    // 1. Create admin user in Auth
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    
    let adminUser;
    try {
      adminUser = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✅ Created admin user in Auth');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin user already exists in Auth');
      } else {
        throw error;
      }
    }

    // 2. Create admin user document in Firestore
    await setDoc(doc(db, 'users', adminUser?.user?.uid || 'admin-uid'), {
      name: 'Admin User',
      email: adminEmail,
      role: 'admin',
      createdAt: new Date(),
      isActive: true
    });
    console.log('✅ Created admin user document');

    // 3. Create permissions matrix
    await setDoc(doc(db, 'config', 'permissionsMatrix'), {
      admin: {
        students: { read: true, write: true, delete: true },
        users: { read: true, write: true, delete: true },
        settings: { read: true, write: true, delete: true }
      },
      case_manager: {
        students: { read: true, write: true, delete: false },
        users: { read: true, write: false, delete: false },
        settings: { read: true, write: false, delete: false }
      },
      teacher: {
        students: { read: true, write: false, delete: false },
        users: { read: false, write: false, delete: false },
        settings: { read: true, write: false, delete: false }
      }
    });
    console.log('✅ Created permissions matrix');

    // 4. Create app settings
    await setDoc(doc(db, 'appSettings', 'general'), {
      appName: 'CaseManageVue Dev',
      version: '1.0.0',
      maintenanceMode: false,
      allowRegistration: true,
      defaultRole: 'teacher'
    });
    console.log('✅ Created app settings');

    console.log('🎉 Emulator seeding complete!');
    console.log('📧 Admin login: admin@test.com / admin123');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedEmulatorData(); 