# Role-Based View Diagrams

This folder contains comprehensive diagrams explaining how the CaseManageVue application implements role-based access control and security for student data. The diagrams illustrate the complete flow from authentication through data presentation for each user role.

## Diagram Collection Overview

### 📋 [00-generic-flow.md](./00-generic-flow.md)
**Common Authentication & Security Flow (Before Role Check)**

Shows the universal flow that all user roles experience before reaching their specific view logic:
- Firebase authentication with custom role claims
- Router guards and role validation
- Database security layer with Firestore rules
- Security rules validation and query filtering
- Data processing pipeline and UI rendering security

### 👨‍💼 [01-admin-view.md](./01-admin-view.md) 
**Admin View - Full Administrative Access**

Demonstrates unrestricted administrative access:
- No database-level filtering (full access)
- Complete CRUD permissions for all students
- All UI features and management tools enabled
- Bulk operations and advanced administrative functions

### 👩‍🏫 [02-teacher-view.md](./02-teacher-view.md)
**Teacher View - Database-Filtered Student Access**

Shows database-level security filtering for teachers:
- `staffIds` array-contains query requirement
- Read-only access to assigned students only
- Limited column visibility (basic info, accommodations)
- Period-based grouping and class view capabilities

### 👩‍⚕️ [03-case-manager-view.md](./03-case-manager-view.md)
**Case Manager View - Dual Role Access with Provider Views**

Illustrates the sophisticated provider view system:
- Database filtering by `staffIds` array
- Three view modes: Case Manager, Service Provider, All
- Different permissions based on relationship type
- Toggle between caseload management and teaching duties

### 🧑‍⚕️ [04-service-provider-view.md](./04-service-provider-view.md)
**Service Provider View - Service-Focused Student Access**

Details service-focused access patterns:
- Database filtering for service assignments
- Dual role support (service provider + teacher)
- Read-only access with service-related data focus
- Accommodation and goal-oriented information display

### 👥 [05-paraeducator-view.md](./05-paraeducator-view.md)
**Paraeducator View - Aide Schedule-Based Access**

Shows the most restrictive access model:
- Aide schedule collection-based assignment validation
- Direct assignments (1:1) and class assignments
- Most limited permissions (basic info + accommodations only)
- Client-side filtering with fallback mechanisms

### 🏫 [06-sped-chair-504-admin-view.md](./06-sped-chair-504-admin-view.md)
**SPED Chair & 504 Admin View - Specialized Administrative Access**

Demonstrates specialized administrative roles:
- Admin-level database access with frontend filtering
- Role-specific scope limitations (IEP vs 504 focus)
- Provider view toggles for different perspectives
- Administrative tools appropriate to role responsibilities

## Security Architecture Highlights

### 🔐 Multi-Layer Security Model

The application implements **6 layers of security**:

1. **Authentication Layer**: Firebase Auth + Custom Claims
2. **Route Protection**: Vue Router guards with role validation
3. **Database Security**: Firestore rules with query-level filtering
4. **Application Logic**: Frontend role-based data processing
5. **UI Permissions**: Component-level visibility controls
6. **Client Validation**: Security test verification and audit logging

### 🛡️ Database-Level Security Features

- **staffIds Array**: Computed array containing all authorized staff for each student
- **Required Filters**: Firestore rules enforce specific query patterns
- **Query Validation**: Database-level verification of user authorization
- **Auto-Updates**: Database triggers maintain staffIds integrity

### 🎯 Role-Based Filtering Patterns

- **Admin Roles**: Unrestricted database access with optional frontend filtering
- **Staff Roles**: Required `staffIds` array-contains filtering
- **Case Managers**: Additional caseManagerId filtering support
- **Paraeducators**: Client-side filtering with aide schedule validation

### 📊 Permission Matrix

| Role | View All | Edit Own | Edit All | Export | Manage Users |
|------|----------|----------|----------|--------|--------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| SPED Chair | ✅ | ✅ | ✅* | ✅ | ❌ |
| 504 Admin | ✅* | ✅ | ✅* | ✅* | ❌ |
| Case Manager | ❌ | ✅ | ❌ | ✅* | ❌ |
| Teacher | ❌ | ❌ | ❌ | ❌ | ❌ |
| Service Provider | ❌ | ❌ | ❌ | ❌ | ❌ |
| Paraeducator | ❌ | ❌ | ❌ | ❌ | ❌ |

*\* = Limited to role scope*

## Technical Implementation

### 🔧 Key Components

- **useStudentQueries**: Database query routing and role-based filtering
- **useXXXView Composables**: Role-specific view logic and permissions
- **Firestore Security Rules**: Database-level access control
- **Router Guards**: Route-level authentication and authorization
- **Security Test Utilities**: Client-side access validation

### 🗃️ Database Structure

```
students/{studentId}
├── app/
│   ├── staffIds: [userId1, userId2, ...]  // Auto-computed access array
│   ├── studentData/
│   │   └── caseManagerId: userId
│   ├── schedule/
│   │   └── periods/
│   │       └── period1: { teacherId, coTeaching: { caseManagerId } }
│   └── providers/
│       ├── speechId: userId
│       ├── otId: userId
│       └── mhId: userId
└── ...
```

### 🔄 Data Flow Summary

1. **User Authentication** → Firebase Auth assigns role claims
2. **Route Protection** → Router guards validate role access
3. **Database Query** → Role-specific query with required filters
4. **Security Validation** → Firestore rules verify query authorization
5. **Data Processing** → Frontend role-based filtering and permissions
6. **UI Rendering** → Component-level security and column visibility
7. **Client Validation** → Security tests and audit logging

## Usage Guidelines

### 📖 Reading the Diagrams

Each diagram uses consistent color coding:
- **Yellow**: Authentication and authorization components
- **Red**: Security validation and access control
- **Green**: Database operations and data storage
- **Blue**: Frontend processing and UI components
- **Role Colors**: Each role has a unique color for easy identification

### 🔍 Understanding Security Flows

1. Start with the **Generic Flow** to understand common security patterns
2. Review specific role diagrams to understand unique access patterns
3. Pay attention to **Database Security** sections for query requirements
4. Note **Permission** differences between roles
5. Observe **UI Feature** variations based on role capabilities

### 🚀 Implementation Reference

These diagrams serve as:
- **Architecture Documentation**: Complete system security overview
- **Development Guide**: Implementation patterns for new features
- **Security Audit**: Reference for security review processes
- **Training Material**: Onboarding documentation for new developers

## Compliance & Security Notes

- **FERPA Compliance**: All access patterns designed for educational privacy compliance
- **Principle of Least Privilege**: Each role has minimum necessary permissions
- **Audit Logging**: All access attempts and security violations are logged
- **Data Integrity**: Multiple validation layers prevent unauthorized access
- **Role Verification**: Continuous validation of user role assignments

For specific implementation details, refer to the individual diagram files and the corresponding source code in the `/src/composables/` directory. 