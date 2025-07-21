# CaseManageVue - Technical Overview

## Application Purpose

CaseManageVue is a comprehensive **Special Education Case Management System** designed for K-12 schools. It manages IEP (Individualized Education Program) and 504 plan students, providing role-based access to student data, schedules, services, and administrative functions. The system integrates with external data sources (Aeries SIS, SEIS) and provides secure, FERPA-compliant student information management.

## Architecture Overview

### Technology Stack
- **Frontend**: Vue.js 3 with Composition API
- **State Management**: Pinia stores
- **Build Tool**: Vite
- **Backend**: Firebase (Firestore, Authentication, Functions, Storage)
- **Database**: Firestore NoSQL with role-based security rules
- **Authentication**: Firebase Auth with Google OAuth
- **Hosting**: Firebase Hosting with multiple environments

### Project Structure
```
CaseManageVue/
├── src/
│   ├── components/         # Vue components (forms, tables, dialogs)
│   ├── views/             # Page-level components
│   ├── composables/       # Vue 3 composition API logic
│   ├── store/             # Pinia state management
│   ├── router/            # Vue Router configuration
│   ├── config/            # Role definitions and configurations
│   └── utils/             # Utility functions and helpers
├── functions/             # Firebase Cloud Functions
├── public/                # Static assets and multi-page entry points
├── Documentation/         # Comprehensive technical documentation
└── firestore.rules       # Database security rules
```

## Core Data Models

### Student Document Structure
Students are stored in Firestore with a nested data structure supporting multiple data sources:

```javascript
{
  id: "firebase_doc_id",           // Auto-generated Firestore ID
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // App form data (primary source)
  app: {
    studentData: {
      firstName: "Jane",
      lastName: "Doe",
      grade: "7",
      plan: "IEP",                 // IEP, 504, RTI, None
      caseManagerId: "user049",    // Firebase user ID
      ssid: "1231241242"           // State Student ID (unique)
    },
    dates: {
      reviewDate: "2025-07-03",
      reevalDate: "2025-07-15",
      meetingDate: "2025-07-09"
    },
    schedule: {
      periods: {                   // Teacher assignments by period
        1: "user003",              // Firebase user IDs
        2: "user006",
        // ...
      },
      classServices: [             // Service types array
        "SDC: English",
        "Co-teach: Math"
      ]
    },
    providers: {                   // Service provider assignments
      speechId: "user123",
      otId: "user456"
    },
    flags: {
      flag1: true,                 // Testing flags
      flag2: false
    },
    documents: {                   // Firebase Storage URLs
      bipPdfUrl: "https://...",
      ataglancePdfUrl: "https://..."
    },
    accommodations: {},
    staffIds: ["user003", "user006"] // Access control array
  },
  
  // Import data sources
  aeries: { /* Aeries SIS import data */ },
  seis: { /* SEIS import data */ }
}
```

### User Document Structure
```javascript
{
  id: "firebase_user_id",
  name: "John Smith",
  email: "user@school.edu",
  role: "case_manager",           // See role system below
  aeriesId: "124123",             // For import mapping
  provider: "OT",                 // Service provider type
  createdAt: timestamp,
  isActive: true
}
```

## Role-Based Access Control System

### User Roles Hierarchy
1. **admin** - Full system access
2. **administrator** - Most admin functions, view-only for students
3. **administrator_504_CM** - Admin functions + can edit 504 plan students
4. **sped_chair** - Admin-level student access, limited user management
5. **case_manager** - Can edit students on their caseload
6. **teacher** - View students in their classes
7. **service_provider** - View students they serve
8. **paraeducator** - View assigned students via aide schedules

### Security Implementation
The system uses **hybrid database-level security filtering**:

1. **Primary Access Control**: `app.staffIds` array containing Firebase user IDs
2. **Critical Fallback**: Case manager direct assignment check (`caseManagerId`)
3. **Para Fallback**: Aide schedule collection for paraeducators
4. **Firestore Security Rules**: Enforce access at query level

### Key Security Features
- **Database-level filtering**: Users can only query/access authorized students
- **Role-based views**: Different UI and data based on user role
- **FERPA compliance**: Audit logging, secure document handling
- **Encrypted storage**: Sensitive data encrypted before storage
- **Session timeout**: Configurable user session management

## Multi-Page Application Architecture

The application uses multiple entry points for different user contexts:

### Entry Points
- `public/index.html` → `HomeView` (Main student management)
- `public/admin.html` → `AdminView` (Administrative functions)
- `public/login.html` → `LoginView` (Authentication)
- `public/testing.html` → `TestingView` (Testing administration)

### Routing Strategy
- **Route Guards**: Authentication and role-based access control
- **Dynamic Navigation**: UI adapts based on user permissions
- **Deep Linking**: Direct access to specific admin functions via URL parameters

## Key Composables Architecture

### Data Management Composables
- **`useStudentData`**: Core student data fetching and management
- **`useStudentFilters`**: Search, filtering, and sorting logic
- **`useRoleBasedView`**: Role-specific data access and permissions
- **`useStudentViews`**: Grouping students by class, grade, etc.

### Role-Specific Composables
- **`useAdminView`**: Full access for administrators
- **`useCaseManagerView`**: Caseload-specific filtering
- **`useTeacherView`**: Class-based student access
- **`useParaeducatorView`**: Aide assignment-based access

### Integration Composables
- **`useAeriesAPI`**: Aeries SIS integration and data import
- **`useGoogleSheetsIntegration`**: Real-time Google Sheets sync
- **`useImporters`**: CSV/data import functionality

## Core Features

### Student Management
- **Comprehensive Student Forms**: Basic info, schedules, services, accommodations
- **Document Management**: BIP/At-a-Glance PDF uploads with secure storage
- **Service Provider Assignment**: Speech, OT, PT, counseling, etc.
- **Class Schedule Management**: Period-based teacher assignments
- **IEP/504 Plan Tracking**: Dates, reviews, meetings

### Administrative Functions
- **User Management**: Add/edit users with role assignments
- **Bulk Import Systems**: CSV import for students and users
- **Data Integration**: Aeries SIS and SEIS system connectivity
- **Permissions Matrix**: Granular permission management
- **Audit Logging**: FERPA-compliant access tracking

### Testing Administration
- **Testing Views**: Flag-based student filtering for assessments
- **Separate Setting Management**: Accommodation tracking
- **Proctor Assignment**: Role-based testing access control

### Data Export & Integration
- **Google Sheets Integration**: Real-time data synchronization
- **CSV Export**: Flexible data export with filtering
- **Teacher Feedback Forms**: Google Forms integration
- **Email Integration**: Student communication tools

## Development Environment

### Firebase Projects
- **Development**: `casemangervue-dev` (testing and development)
- **Production**: `casemangervue` (live system)

### Build & Deployment
```bash
# Development
npm run dev                    # Local development server
npm run emulators             # Firebase emulators
npm run deploy:dev            # Deploy to development

# Production
npm run build                 # Production build
npm run deploy:prod          # Deploy to production
```

### Environment Configuration
- **Multi-environment support**: Separate Firebase projects
- **Environment detection**: Automatic configuration switching
- **Emulator support**: Local development with Firebase emulators

## Database Security Rules

The Firestore security rules implement sophisticated access control:

```javascript
// Students collection access
match /students/{studentId} {
  allow read: if isAuth() && hasValidRole() && canReadStudent(studentId);
  allow update: if isAuth() && canEditStudent(studentId) && validEncryptedFields();
}

// Query validation ensures proper filtering
function validStudentQuery() {
  return isAnyAdmin() || 
         (isStaffRole() && hasStaffIdsFilter()) ||
         (isCaseManager() && hasCaseManagerIdFilter());
}
```

## Data Import & Integration

### Aeries SIS Integration
- **API Connectivity**: OAuth-based Aeries API integration
- **Data Mapping**: Automatic teacher ID resolution to Firebase users
- **Schedule Import**: Class period and teacher assignment import
- **Student Data Sync**: Demographics and academic information

### SEIS Integration
- **CSV Import**: Special education data import
- **Field Mapping**: Configurable field mapping for different districts
- **Data Validation**: Comprehensive validation and error handling

### Bulk Import Systems
- **Student Bulk Import**: CSV-based student creation with validation
- **User Management**: Bulk user creation with role assignment
- **Data Migration**: Tools for migrating between systems

## Performance & Scalability

### Optimization Strategies
- **Lazy Loading**: Components loaded on demand
- **Query Optimization**: Efficient Firestore queries with proper indexing
- **Caching**: Strategic use of reactive caching for user data
- **Bundle Splitting**: Optimized build output for faster loading

### Monitoring & Debugging
- **Component Health Dashboard**: Real-time system status monitoring
- **Debug Tools**: Built-in debugging interface (Ctrl+Shift+D)
- **Audit Logging**: Comprehensive system activity tracking
- **Error Handling**: Centralized error management and reporting

## Key Dependencies

### Core Framework
- **Vue 3**: `^3.4.0` - Primary framework with Composition API
- **Pinia**: `^2.1.0` - State management
- **Vue Router**: `^4.3.0` - Client-side routing

### Firebase Services
- **Firebase**: `^10.14.1` - Complete Firebase SDK
- **VueFire**: `^3.2.1` - Vue-Firebase integration

### Utilities & Features
- **PapaParse**: `^5.5.3` - CSV parsing for imports
- **XLSX**: `^0.18.5` - Excel file handling
- **VueDraggable**: `^4.1.0` - Drag-and-drop functionality
- **Crypto-JS**: `^4.2.0` - Client-side encryption

## FERPA Compliance Features

### Data Protection
- **Encryption**: Sensitive data encrypted before storage
- **Access Logging**: Comprehensive audit trails
- **Role-Based Access**: Strict permission enforcement
- **Session Management**: Automatic timeout and secure sessions

### Audit & Compliance
- **IEP Access Logs**: Document access tracking
- **PDF Security**: Secure document handling
- **Data Retention**: Configurable data retention policies
- **User Activity Monitoring**: Complete system activity logging

## Production Deployment

### Live System
- **URL**: https://casemangervue.web.app
- **Firebase Console**: https://console.firebase.google.com/project/casemangervue/overview
- **Multi-environment**: Separate dev/prod configurations
- **CI/CD**: Firebase CLI-based deployment pipeline

### Monitoring & Maintenance
- **Health Checks**: Automated system monitoring
- **Backup Systems**: Regular data backups
- **Performance Monitoring**: Firebase Performance Monitoring
- **Error Tracking**: Comprehensive error logging and alerts

---

This system represents a sophisticated, enterprise-grade special education management platform with robust security, comprehensive features, and scalable architecture designed for educational institutions managing sensitive student data in compliance with FERPA regulations. 