# Filter and View System Architecture

This document explains how the filter and view system works in the CaseManageVue application.

## 1. Overall Architecture

The system follows a layered architecture pattern:

1. **Data Layer**: Firebase database with role-based security rules
2. **Query Layer**: Role-specific database queries that enforce security at the data level
3. **Core Composables**: Data fetching and filtering logic
4. **Role System**: Role-based views that apply additional filtering and permissions
5. **View Logic**: Grouping and organizing students for display
6. **UI Component**: The Vue component that renders the interface

### Key Components:

- **useStudentData**: Fetches and manages student/user data from Firebase
- **useStudentFilters**: Handles search and dropdown filtering (CM, teacher, plan, etc.)
- **useRoleBasedView**: Factory that creates the appropriate role view based on user role
- **useBaseRoleView**: Common functionality inherited by all role views
- **Role-specific views**: Teacher, CaseManager, SpedChair, Admin, Paraeducator views
- **useStudentViews**: Groups students by class/period for display
- **StudentsView.vue**: Main UI component

## 2. Data Flow for Class View

### The Problem (Before Fix)

The issue was double filtering:

1. Students were filtered by `useStudentFilters` (search, dropdowns)
2. `baseView.visibleStudents` would filter again if in class view mode
3. Role views (like `teacherView`) would filter a third time
4. Result: Empty student list

### The Solution (After Fix)

1. Students are filtered once by `useStudentFilters`
2. `baseView.visibleStudents` returns students without additional filtering
3. Each role view applies its own specific filtering
4. `studentsByClass` groups the visible students by period

## 3. Class View Permissions

Different roles have different access to the class view:

- **Always Enabled**: teacher, paraeducator, case_manager, sped_chair, administrator_504_CM
- **Conditionally Enabled**: 
  - admin, administrator (when filtering by specific teacher or aide)
  - service_provider (when providerView = 'SP')
- **Disabled**: All other roles

## 4. How Class View Works

1. User clicks "Class" radio button
2. `currentViewMode` changes to 'class'
3. `studentsByClass` computed property activates
4. Students are grouped by their schedule periods
5. UI renders separate tables for each period

### Data Grouping Process:

```javascript
// For each visible student
// Extract their schedule
// Group by period (1, 2, 3, etc.)
// Sort periods numerically
// Return grouped students
```

## 5. Role-Specific Behavior

### Teacher
- Sees only students they teach
- Filtered by checking if teacher ID is in student's schedule

### Case Manager
- Sees students they case manage OR teach
- Has provider view modes (All, CM, SP)

### Sped Chair
- Can see all IEP students (when in * mode)
- Has provider view modes (All, CM, SP, *)

### Paraeducator
- Sees students in assigned classes
- Has direct assignments and class assignments

### Admin
- Sees all students (with optional filters)
- Can filter to see specific teacher's classes

## 6. Key Functions

- `getSchedule(student)`: Extracts schedule from various data structures
- `standardizeScheduleAccess()`: Normalizes schedule data for consistent access
- `groupStudentsByPeriod()`: Groups students by their class periods
- `getProviderViewStudents()`: Filters based on provider view mode

This architecture ensures proper security, role-based access, and flexible viewing options while maintaining clean separation of concerns. 