# CaseManageVue - Developer Documentation

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Setup & Development](#setup--development)
- [Deployment](#deployment)
- [Code Structure](#code-structure)
- [Key Components](#key-components)
- [Role System](#role-system)
- [Security](#security)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**CaseManageVue** is a comprehensive special education case management system built with Vue.js 3 and Firebase. It manages student information, IEP/504 plans, paraeducator schedules, and role-based access control for educational institutions.

### Key Features
- **Student Management**: Comprehensive student data with IEP/504 plan support
- **Role-Based Access**: 10 distinct user roles with granular permissions
- **Paraeducator Management**: Schedule management and student assignments
- **Data Integration**: Import from SEIS and Aeries systems
- **Teacher Feedback**: Google Sheets integration for teacher input
- **Document Management**: Secure file storage for student documents
- **Audit Logging**: Complete activity tracking for compliance

### Tech Stack
- **Frontend**: Vue.js 3.4+ with Composition API
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Custom CSS with CSS variables
- **Build Tool**: Vite
- **Icons**: Lucide Vue Next

---

## 🏗️ Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vue.js App    │    │   Firebase      │    │  Google APIs    │
│                 │    │                 │    │                 │
│ • Components    │◄──►│ • Firestore     │    │ • Sheets API    │
│ • Composables   │    │ • Auth          │    │ • Drive API     │
│ • Views         │    │ • Functions     │    │                 │
│ • Store (Pinia) │    │ • Storage       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Project Structure
```
src/
├── components/          # Reusable Vue components
│   ├── students/       # Student-specific components
│   ├── testing/        # Development testing components
│   └── ...
├── composables/        # Vue 3 composition functions
│   ├── roles/         # Role-based logic
│   └── ...
├── views/             # Route-level components
├── store/             # Pinia state management
├── router/            # Vue Router configuration
├── config/            # App configuration
├── utils/             # Utility functions
└── assets/            # Static assets and styles
```

---

## 🚀 Setup & Development

### Prerequisites
- Node.js 18+
- Firebase CLI
- Git

### Environment Setup
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd CaseManageVue
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   ```bash
   firebase login
   firebase use development  # or production
   ```

4. **Environment Variables**
   Create `.env.local` with Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-domain
   # ... other Firebase config
   ```

### Development Commands
```bash
# Start development server
npm run dev

# Start Firebase emulators
npm run emulators

# Build for production
npm run build

# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

---

## 📦 Code Structure

### Components Organization
- **Reusable Components**: Generic UI components
- **Feature Components**: Specific to business logic (students, admin, etc.)
- **Layout Components**: Navigation, headers, dialogs

### Composables Pattern
All business logic is extracted into composables:
```javascript
// Example: useStudents.js
export default function useStudents() {
  const students = ref([])
  const loading = ref(false)
  
  const fetchStudents = async () => {
    // Firebase logic here
  }
  
  return {
    students,
    loading,
    fetchStudents
  }
}
```

### State Management
- **Auth Store**: User authentication and roles
- **Permission Store**: Role-based permissions
- **Reactive Firebase**: Real-time data binding with VueFire

---

## 🔐 Role System

### User Roles Hierarchy
1. **admin** - System Administrator (Full Access)
2. **school_admin** - School Administrator 
3. **staff_edit** - Staff with Edit Access
4. **staff_view** - Staff with View-Only Access
5. **admin_504** - 504 Plan Coordinator
6. **sped_chair** - Special Education Chair
7. **case_manager** - Case Manager
8. **teacher** - Classroom Teacher
9. **service_provider** - Service Provider
10. **paraeducator** - Paraeducator/Aide

### Permission Matrix
Each role has specific permissions defined in `src/config/roles.js`:
```javascript
export const PERMISSIONS_MATRIX = {
  admin: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    // ... all permissions
  ],
  teacher: [
    PERMISSION_ACTIONS.VIEW_STUDENTS
    // ... limited permissions
  ]
}
```

---

## 🛡️ Security

### Firebase Security Rules
- **Database-level filtering**: Users only see their assigned students
- **Role-based access**: Permissions enforced at Firebase level
- **Document encryption**: Sensitive data encrypted before storage

### Access Control
```javascript
// Example: Student access check
function canAccessStudent(studentDoc, userRole, userId) {
  // Check if user is in student's staffIds array
  return studentDoc.app?.staffIds?.includes(userId)
}
```

---

## 🔧 Maintenance

### Regular Tasks
1. **Database Cleanup**: Remove old audit logs
2. **User Management**: Sync roles with Firebase Auth
3. **File Storage**: Clean up unused documents
4. **Performance Monitoring**: Check Firebase usage

### Backup Procedures
- **Firestore Export**: Automated daily backups
- **Storage Backup**: Document files backup
- **User Data Export**: FERPA compliance exports

### Updates & Patches
1. Test in development environment
2. Update Firebase rules if needed
3. Deploy functions first, then hosting
4. Monitor for errors post-deployment

---

## 🐛 Troubleshooting

### Common Issues

**Authentication Problems**
```bash
# Clear browser cache and re-authenticate
firebase auth:import users.json
```

**Permission Errors**
```javascript
// Check user claims in browser console
console.log(await user.getIdTokenResult())
```

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Tools
- **Role Switcher**: Ctrl+Shift+D in development
- **Debug Menu**: Available for admin users
- **Firebase Console**: Real-time monitoring
- **Browser DevTools**: Vue.js DevTools extension

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vue.js 3 Guide](https://vuejs.org/guide/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [FERPA Compliance Guide](../Documentation/security/FERPA_COMPLIANCE_SUMMARY.md)

---

*Last Updated: January 2025*
*Version: 1.1.6*