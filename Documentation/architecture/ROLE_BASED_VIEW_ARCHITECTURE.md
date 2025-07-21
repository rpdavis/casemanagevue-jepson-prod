# 🏗️ Role-Based View Architecture

## Overview

The CaseManageVue application uses a sophisticated role-based view system that provides different user experiences based on user roles. This system ensures proper data access control and UI customization for each user type.

## 📁 File Structure

```
src/
├── composables/
│   ├── roles/
│   │   ├── useBaseRoleView.js      # Base functionality for all roles
│   │   ├── useAdminView.js         # Admin-specific view logic
│   │   ├── useCaseManagerView.js   # Case manager-specific view logic
│   │   ├── useTeacherView.js       # Teacher-specific view logic
│   │   ├── useParaeducatorView.js  # Paraeducator-specific view logic
│   │   └── useRoleBasedView.js     # Unified role view selector
│   ├── useStudentData.js           # Core student data management
│   ├── useStudentFilters.js        # Filtering logic
│   ├── useStudentViews.js          # View mode management (list/class/testing)
│   └── useStudentNavActions.js     # Navigation and actions
├── views/
│   └── StudentsView.vue            # Main student management view
└── components/
    └── students/
        └── StudentTable.vue         # Student data table component
```

## 🎭 Complete Role Hierarchy & Permissions

### 1. **Super Admin** (Maximum Access)
- `admin` - Full system access, all permissions

**Permissions:**
- ✅ View all students
- ✅ Edit all students
- ✅ Access testing view
- ✅ Manage users (view, edit, delete)
- ✅ Manage subjects & roles
- ✅ Manage aide assignments

### 2. **Administrator** (High Administrative Access)
- `administrator` - Administrative access with testing

**Permissions:**
- ✅ View all students
- ✅ Edit all students
- ✅ Access testing view
- ✅ Manage users (view, edit, delete)
- ✅ Manage subjects & roles
- ❌ Some admin-only features

### 3. **504/CM Administrator** (504 Plan Focus)
- `administrator_504_CM` - 504 plan administrator + case management

**Permissions:**
- ✅ View all students
- ✅ Edit all students
- ✅ Manage users (view, edit, delete)
- ✅ Manage subjects & roles
- ❌ Testing view access
- ❌ Some admin-only features

### 4. **Special Education Chair** (SPED Leadership)
- `sped_chair` - Special education department chair

**Permissions:**
- ✅ View all students
- ✅ Edit all students
- ✅ View users
- ❌ User management (edit/delete)
- ❌ Testing view access
- ❌ Manage subjects & roles

### 5. **Case Manager** (Caseload Management)
- `case_manager` - Manages assigned students

**Permissions:**
- ✅ View assigned students only
- ✅ Edit assigned students only
- ✅ View users
- ✅ Provider view options (CM/SP)
- ❌ Testing view access
- ❌ User management

### 6. **Teacher** (Classroom Focus)
- `teacher` - Classroom teachers

**Permissions:**
- ✅ View students in their classes
- ✅ View accommodations
- ✅ View users
- ❌ Edit students
- ❌ View service providers
- ❌ View sensitive dates

### 7. **Service Provider** (Related Services)
- `service_provider` - Speech, OT, PT, etc.

**Permissions:**
- ✅ View students receiving their services
- ✅ View accommodations
- ✅ View users
- ❌ Edit students
- ❌ View sensitive dates
- ❌ Full schedule access

### 8. **Paraeducator** (Support Staff)
- `paraeducator` - Instructional aides

**Permissions:**
- ✅ View assigned students only
- ✅ View basic accommodations
- ✅ View users
- ❌ Edit students
- ❌ View service providers
- ❌ View sensitive dates
- ❌ Advanced filtering

## 🔄 Composable Architecture

### Base Layer: `useBaseRoleView.js`
**Purpose:** Common functionality shared across all roles

**Key Features:**
- Student data formatting
- Basic filtering (name, case manager, teacher)
- Date formatting
- Schedule access
- Student grouping (by grade, plan)

**Returns:**
```javascript
{
  visibleStudents,
  currentUser,
  userMapObj,
  formatStudentName,
  formatStudentInfo,
  formatDates,
  getStudentSchedule,
  filterByName,
  filterByCaseManager,
  filterByTeacher,
  setViewMode,
  groupStudentsByGrade,
  groupStudentsByPlan,
  currentFilters
}
```

### Role-Specific Layers

#### `useAdminView.js`
**Extends:** `useBaseRoleView`
**Override:** None (sees all students)

**Additional Features:**
- Group students by case manager
- Group students by service provider
- Group students by accommodation type
- Export all data capability

#### `useCaseManagerView.js`
**Extends:** `useBaseRoleView`
**Override:** `visibleStudents` (only assigned students)

**Additional Features:**
- Managed vs service students separation
- Group by services (speech, OT, MH)
- Group by upcoming dates (review, reeval, meeting)
- Provider view modes (all, case_manager, service_provider)

#### `useTeacherView.js`
**Extends:** `useBaseRoleView`
**Override:** `visibleStudents` (only students in their classes)

**Additional Features:**
- Group students by period
- Group by accommodation type
- Group by service provider
- Period-based filtering

#### `useParaeducatorView.js`
**Extends:** `useBaseRoleView`
**Override:** `visibleStudents` (only assigned students)

**Additional Features:**
- Direct assignments vs class assignments
- Group by accommodation type
- Assignment type filtering
- Limited data access permissions

### Unified Layer: `useRoleBasedView.js`
**Purpose:** Role detection and appropriate view selection

**Logic Flow:**
```javascript
switch (userRole) {
  case 'admin', 'administrator', 'administrator_504_CM', 'sped_chair':
    return useAdminView()
  case 'case_manager':
    return useCaseManagerView()
  case 'teacher', 'service_provider':
    return useTeacherView()
  case 'paraeducator':
    return useParaeducatorView()
  default:
    return useBaseRoleView()
}
```

**Additional Permissions:**
- `canEditAllStudents`
- `canEditOwnStudents`
- `canViewAllStudents`
- `canManageUsers`
- `canManageAides`
- `canAccessTesting`

## 🖥️ View Integration

### StudentsView.vue
**Main Component Structure:**

```vue
<template>
  <!-- Navigation Menu -->
  <StudentNavMenu />
  
  <!-- Search & Filters -->
  <div class="page-header">
    <!-- Provider View (Case Managers only) -->
    <div v-if="showProviderView">
      <!-- All | CM | SP radio buttons -->
    </div>
    
    <!-- View Mode -->
    <div class="filter-group">
      <!-- List | Class | Test radio buttons -->
      <!-- Test only visible if canAccessTesting -->
    </div>
  </div>
  
  <!-- Content Views -->
  <div class="content">
    <!-- List View -->
    <StudentTable 
      :students="visibleStudents"
      :can-edit-all="canEditAllStudents"
      :can-edit-own="canEditOwnStudents"
      :can-view-all="canViewAllStudents"
    />
    
    <!-- Class View -->
    <div v-for="(students, period) in studentsByClass">
      <StudentTable :students="students" />
    </div>
    
    <!-- Testing View (Admin only) -->
    <StudentTable 
      v-if="canAccessTesting"
      :students="testingViewStudents"
      :testing-view="true"
    />
  </div>
</template>
```

### StudentTable.vue Props
**Role-Based Props:**
- `:can-edit-all` - Shows edit buttons for all students
- `:can-edit-own` - Shows edit buttons for owned students only
- `:can-view-all` - Controls column visibility
- `:testing-view` - Special testing mode layout

## 🔄 Data Flow

### 1. **Initialization**
```
StudentsView.vue
├── useStudentData() → Core data (students, users, etc.)
├── useStudentFilters() → Filtering logic
├── useRoleBasedView() → Role-specific view
└── useStudentNavActions() → Navigation actions
```

### 2. **Role Detection**
```
useRoleBasedView()
├── Get currentUser.role
├── Select appropriate role view
├── Apply role-specific filtering
└── Return combined functionality
```

### 3. **Student Filtering**
```
Base filtering (useStudentFilters)
├── Text search
├── Case manager filter
├── Teacher filter
└── Paraeducator filter

Role-specific filtering (role views)
├── Admin: All students
├── Case Manager: Assigned students
├── Teacher: Class students
└── Paraeducator: Assigned students
```

### 4. **View Rendering**
```
StudentsView.vue
├── Use visibleStudents (role-filtered)
├── Apply permissions to StudentTable
├── Show/hide view modes based on role
└── Render appropriate UI elements
```

## 🎯 View Modes & Role-Based UI

### List View
- **All Roles:** Basic table view of students
- **Data:** `visibleStudents` (role-filtered)
- **Permissions:** Applied via props

### Class View
- **Admin/Teachers:** Students grouped by class periods
- **Paraeducators:** Direct assignments + class assignments
- **Case Managers:** All assigned students

### Testing View
- **Admin/Sped Chair Only:** Students with testing accommodations
- **Data:** `testingViewStudents` (flag2 = true)
- **Access:** Controlled by `canAccessTesting`

## 👁️ Visual Role-Based Views

### 🔴 **Super Admin View** (`admin`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ View Mode: [ List ] [ Class ] [ Test ] 🔄 Reset               │
├─────────────────────────────────────────────────────────────────┤
│ 📊 STUDENTS TABLE - ALL STUDENTS VISIBLE                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Case Mgr │ Actions              │ │
│ │ John Doe  │ 9th   │ IEP  │ Smith    │ [Edit] [Email] [📧] │ │
│ │ Jane Smith│ 10th  │ 504  │ Johnson  │ [Edit] [Email] [📧] │ │
│ │ Mike Jones│ 11th  │ IEP  │ Brown    │ [Edit] [Email] [📧] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can edit ALL students                                        │
│ ✅ Can access testing view                                      │
│ ✅ Can manage users/roles                                       │
│ ✅ Can export data                                              │
│ ✅ Full admin panel access                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 🟠 **Administrator View** (`administrator`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ View Mode: [ List ] [ Class ] [ Test ] 🔄 Reset               │
├─────────────────────────────────────────────────────────────────┤
│ 📊 STUDENTS TABLE - ALL STUDENTS VISIBLE                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Case Mgr │ Actions              │ │
│ │ John Doe  │ 9th   │ IEP  │ Smith    │ [Edit] [Email] [📧] │ │
│ │ Jane Smith│ 10th  │ 504  │ Johnson  │ [Edit] [Email] [📧] │ │
│ │ Mike Jones│ 11th  │ IEP  │ Brown    │ [Edit] [Email] [📧] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can edit ALL students                                        │
│ ✅ Can access testing view                                      │
│ ✅ Can manage users/roles                                       │
│ ✅ Can export data                                              │
│ ❌ Some super-admin features restricted                         │
└─────────────────────────────────────────────────────────────────┘
```

### 🟡 **504/CM Administrator View** (`administrator_504_CM`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ Provider: [ All ] [ CM ] [ SP ]  View: [ List ] [ Class ]      │
├─────────────────────────────────────────────────────────────────┤
│ 📊 STUDENTS TABLE - ALL STUDENTS VISIBLE                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Case Mgr │ Actions              │ │
│ │ John Doe  │ 9th   │ IEP  │ Smith    │ [Edit] [Email] [📧] │ │
│ │ Jane Smith│ 10th  │ 504  │ Johnson  │ [Edit] [Email] [📧] │ │
│ │ Mike Jones│ 11th  │ IEP  │ Brown    │ [Edit] [Email] [📧] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can edit ALL students                                        │
│ ✅ Provider view options (CM/SP)                                │
│ ✅ Can manage users/roles                                       │
│ ❌ No testing view access                                       │
│ ❌ 504 plan focus                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 🟣 **SPED Chair View** (`sped_chair`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ View Mode: [ List ] [ Class ]                                   │
├─────────────────────────────────────────────────────────────────┤
│ 📊 STUDENTS TABLE - ALL STUDENTS VISIBLE                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Case Mgr │ Actions              │ │
│ │ John Doe  │ 9th   │ IEP  │ Smith    │ [Edit] [Email] [📧] │ │
│ │ Jane Smith│ 10th  │ 504  │ Johnson  │ [Edit] [Email] [📧] │ │
│ │ Mike Jones│ 11th  │ IEP  │ Brown    │ [Edit] [Email] [📧] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can edit ALL students                                        │
│ ✅ Can view all users                                           │
│ ✅ SPED department oversight                                    │
│ ❌ No testing view access                                       │
│ ❌ Cannot manage users                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 🔵 **Case Manager View** (`case_manager`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ Provider: [ All ] [ CM ] [ SP ]  View: [ List ] [ Class ]      │
├─────────────────────────────────────────────────────────────────┤
│ 📊 STUDENTS TABLE - ASSIGNED STUDENTS ONLY                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Case Mgr │ Actions              │ │
│ │ John Doe  │ 9th   │ IEP  │ ME       │ [Edit] [Email] [📧] │ │
│ │ Jane Smith│ 10th  │ 504  │ ME       │ [Edit] [Email] [📧] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can edit ASSIGNED students only                              │
│ ✅ Provider view options (CM/SP)                                │
│ ✅ Caseload management focus                                    │
│ ❌ No testing view access                                       │
│ ❌ Cannot see unassigned students                               │
└─────────────────────────────────────────────────────────────────┘
```

### 🟢 **Teacher View** (`teacher`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ View Mode: [ List ] [ Class ]                                   │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 FILTERS PANEL (when opened)                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Testing: [All Students ▼] [Students with Testing ▼] [...]  │ │
│ │ Sort By: [First Name ▼]  Case Mgr: [All ▼]  Teacher: [All] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 📊 STUDENTS TABLE - CLASS STUDENTS ONLY                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Testing Accoms │ Actions         │ │
│ │ John Doe  │ 9th   │ IEP  │ Extended Time  │ [View] [📧]    │ │
│ │ Jane Smith│ 10th  │ 504  │ Quiet Room     │ [View] [📧]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can view students in their classes                           │
│ ✅ Can see testing accommodations (PARTIAL)                     │
│ ✅ Can filter by testing accommodations                         │
│ ✅ Classroom focus                                              │
│ ❌ Cannot edit students                                         │
│ ❌ Cannot access full testing view                              │
└─────────────────────────────────────────────────────────────────┘
```

### 🟤 **Service Provider View** (`service_provider`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________] 🔍 Filters                        │
│                                                                 │
│ View Mode: [ List ] [ Class ]                                   │
├─────────────────────────────────────────────────────────────────┤
│ 📊 STUDENTS TABLE - SERVICE STUDENTS ONLY                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Plan │ Service Type │ Actions           │ │
│ │ John Doe  │ 9th   │ IEP  │ Speech       │ [View] [📧]      │ │
│ │ Jane Smith│ 10th  │ 504  │ OT           │ [View] [📧]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can view students receiving their services                   │
│ ✅ Can see service-related accommodations                       │
│ ✅ Related services focus                                       │
│ ❌ Cannot edit students                                         │
│ ❌ Limited schedule access                                      │
└─────────────────────────────────────────────────────────────────┘
```

### ⚫ **Paraeducator View** (`paraeducator`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎛️ Student Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search: [________________]                                   │
│                                                                 │
│ View Mode: [ List ] [ Class ]                                   │
├─────────────────────────────────────────────────────────────────┤
│ 📊 DIRECT ASSIGNMENTS                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Accommodations │ Actions                │ │
│ │ John Doe  │ 9th   │ 1:1 Support    │ [View]                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 📊 PERIOD 1 - MS. SMITH'S CLASS                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Grade │ Accommodations │ Actions                │ │
│ │ Jane Smith│ 10th  │ Small Group    │ [View]                │ │
│ │ Mike Jones│ 11th  │ Extended Time  │ [View]                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ✅ Can view assigned students only                              │
│ ✅ Can see basic accommodations                                 │
│ ✅ Assignment-based access                                      │
│ ❌ Cannot edit students                                         │
│ ❌ Cannot see service providers                                 │
│ ❌ Limited filter options                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 UI Element Visibility by Role

### Header Controls
```
Element                    │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
🔍 Search Bar              │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
🔍 Filters Button          │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Provider View (All/CM/SP)  │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
List View Mode             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Class View Mode            │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Testing View Mode          │   ✅   │   ✅    │   ❌   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
🔄 Reset Filters           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
```

### Filter Panel Options
```
Filter                     │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Sort By                    │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Case Manager Filter        │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Teacher Filter             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Paraeducator Filter        │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Service Provider Filter    │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
```

### Student Table Columns
```
Column                     │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Name                       │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Grade                      │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Plan (IEP/504)            │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Case Manager               │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Accommodations             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Service Providers          │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Important Dates            │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Schedule/Classes           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅*   │  ✅
Service Type               │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ✅    │  ❌

* Service Provider sees limited schedule (only their service periods)
```

### Action Buttons
```
Action                     │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Edit Student               │   ✅   │   ✅    │   ✅   │  ✅   │   ✅**   │    ❌    │    ❌    │  ❌
Email Student              │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Teacher Feedback           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
View Documents             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Export Data                │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Manage Users               │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌

** Case Manager can only edit their assigned students
```

### Navigation Menu
```
Menu Item                  │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Add Student                │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Export                     │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Print                      │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Admin Panel                │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
Testing View               │   ✅   │   ✅    │   ❌   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
Aide Schedule              │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ❌
User Management            │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌

Legend: Admin=admin, Admstr=administrator, 504CM=administrator_504_CM, SPED=sped_chair, 
        CaseMgr=case_manager, Teacher=teacher, Service=service_provider, Para=paraeducator
```

## 🔐 Security Features

### Data Access Control
- **Role-based student filtering** at composable level
- **Permission props** passed to components
- **View mode restrictions** based on role
- **UI element visibility** controlled by permissions

### Complete Permission Matrix

#### Core Permissions (from PERMISSIONS_MATRIX)
```
Permission                 │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
VIEW_USERS                 │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
EDIT_USER                  │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
DELETE_USER                │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
MANAGE_SUBJECTS            │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
MANAGE_ROLES               │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
VIEW_STUDENTS              │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
EDIT_STUDENT_CM            │   ✅   │   ✅    │   ✅   │  ❌   │    ✅    │    ❌    │    ❌    │  ❌
EDIT_STUDENT_ALL           │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ❌
TESTING                    │  All  │  All   │   ❌   │  ❌   │ Partial  │ Partial │ Partial │  ❌
```

**Testing Permission Levels:**
- **All**: Full testing view access + testing page access for all students
- **Partial**: Testing accommodations visible only for students user already has access to
- **❌**: No testing access

#### Student Access & Editing
```
Feature                    │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
View All Students          │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ❌
View Assigned Students     │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
View Class Students        │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ❌    │  ❌
View Service Students      │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ✅    │  ❌
View Direct Assignments    │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ✅
Edit All Students          │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ❌
Edit Assigned Students     │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Edit 504 Students Only     │   ✅   │   ✅    │   ✅*  │  ✅   │    ❌    │    ❌    │    ❌    │  ❌

* 504CM Admin has special logic for 504 plan students
```

#### UI Features & Views
```
Feature                    │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Testing View Access        │  All  │  All   │   ❌   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
Testing Filter Access      │  All  │  All   │   ❌   │  ❌   │ Partial  │ Partial │ Partial │  ❌
Testing Accommodations     │  All  │  All   │   ❌   │  ❌   │ Partial  │ Partial │ Partial │  ❌
Provider View Toggle       │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Advanced Filters           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Class View Mode            │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
List View Mode             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Export Functionality       │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Print Functionality        │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
```

**Testing Access Levels:**
- **All**: Can access testing view page + see testing filter + view all testing accommodations
- **Partial**: Can see testing filter + testing accommodations only for their assigned students
- **❌**: No testing-related access

#### Administrative Features
```
Feature                    │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Admin Panel Access         │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
User Management            │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
Role Management            │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
Subject Management         │   ✅   │   ✅    │   ✅   │  ❌   │    ❌    │    ❌    │    ❌    │  ❌
Aide Assignment            │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ❌
Aide Schedule              │   ✅   │   ✅    │   ✅   │  ✅   │    ❌    │    ❌    │    ❌    │  ❌
Add Students               │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Bulk Import                │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
```

#### Data Visibility
```
Data Type                  │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Student Names              │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Student Grades             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Plan Types (IEP/504)       │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Case Manager Info          │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Accommodations             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Service Providers          │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Important Dates            │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Full Schedule              │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ❌    │  ✅
Service Schedule           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ✅    │  ❌
Documents/Files            │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
```

#### Communication & Actions
```
Action                     │ Admin │ Admstr │ 504CM │ SPED │ CaseMgr │ Teacher │ Service │ Para
─────────────────────────── │───────│────────│───────│──────│─────────│─────────│─────────│─────
Email Students             │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
Teacher Feedback Forms     │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ❌
View Student Documents     │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ✅    │    ✅    │  ✅
Upload Documents           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Delete Documents           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌
Generate Reports           │   ✅   │   ✅    │   ✅   │  ✅   │    ✅    │    ❌    │    ❌    │  ❌

Legend: Admin=admin, Admstr=administrator, 504CM=administrator_504_CM, SPED=sped_chair, 
        CaseMgr=case_manager, Teacher=teacher, Service=service_provider, Para=paraeducator
```

## 🔗 How Permissions and Views are Connected

### **Permission-View Integration Flow**

```
User Role → Permission Calculation → View Selection → UI Rendering
    ↓              ↓                    ↓              ↓
  admin    →  canEditAllStudents  →  useAdminView  →  Edit buttons visible
case_manager → canEditOwnStudents → useCaseManagerView → Limited edit access
 teacher     →  canViewAllStudents →  useTeacherView  →  Read-only view
paraeducator →  (most restricted)  → useParaeducatorView → Minimal UI
```

### **1. Permission Calculation Layer**

**Location:** `src/composables/roles/useRoleBasedView.js`

```javascript
// Permissions are computed based on user role
const canEditAllStudents = computed(() => {
  const userRole = currentUser.value?.role
  return ['admin', 'administrator', 'administrator_504_CM', 'sped_chair'].includes(userRole)
})

const canAccessTesting = computed(() => {
  const userRole = currentUser.value?.role
  return ['admin', 'administrator', 'sped_chair'].includes(userRole)
})
```

**These permissions are then passed to the view layer.**

### **2. View Selection Layer**

**Location:** `src/composables/roles/useRoleBasedView.js`

```javascript
// Different view composables are selected based on role
const getViewForRole = (userRole) => {
  switch (userRole) {
    case 'admin': return useAdminView(studentData, filterData)
    case 'case_manager': return useCaseManagerView(studentData, filterData)
    case 'teacher': return useTeacherView(studentData, filterData)
    case 'paraeducator': return useParaeducatorView(studentData, filterData)
  }
}
```

**Each view composable has its own data filtering and business logic.**

### **3. UI Rendering Layer**

**Location:** `src/views/StudentsView.vue`

```vue
<!-- Permission-controlled UI elements -->
<label v-if="canAccessTesting" class="radio-btn">
  <input type="radio" value="testing">
  Test
</label>

<!-- Permission props passed to components -->
<StudentTable
  :students="visibleStudents"
  :can-edit-all="canEditAllStudents"
  :can-edit-own="canEditOwnStudents"
  :can-view-all="canViewAllStudents"
/>
```

### **4. Data Filtering Integration**

**Each role view filters student data differently:**

```javascript
// Admin View - sees all students
const visibleStudents = computed(() => filteredStudents.value)

// Case Manager View - only assigned students
const visibleStudents = computed(() => {
  return baseView.visibleStudents.value.filter(student => {
    const caseManagerId = studentData.getCaseManagerId(student)
    return caseManagerId === baseView.currentUser.value?.uid
  })
})

// Teacher View - only class students
const visibleStudents = computed(() => {
  return baseView.visibleStudents.value.filter(student => {
    const schedule = studentData.getSchedule(student)
    return schedule ? Object.values(schedule).includes(baseView.currentUser.value?.uid) : false
  })
})
```

### **5. Component Permission Props**

**StudentTable receives permission props and uses them internally:**

```vue
<!-- StudentTable.vue (conceptual) -->
<template>
  <tr v-for="student in students">
    <td>{{ student.name }}</td>
    <!-- Edit button only shows if user has permission -->
    <td v-if="canEditAll || (canEditOwn && isOwnStudent(student))">
      <button @click="editStudent(student.id)">Edit</button>
    </td>
  </tr>
</template>

<script>
props: {
  canEditAll: Boolean,
  canEditOwn: Boolean,
  canViewAll: Boolean
}
</script>
```

### **6. Permission-View Mapping Table**

```
Role              │ View Composable      │ Key Permissions              │ Data Filter
──────────────────│─────────────────────│─────────────────────────────│─────────────────
admin             │ useAdminView         │ canEditAllStudents: ✅       │ All students
administrator     │ useAdminView         │ canAccessTesting: ✅         │ All students
administrator_504 │ useAdminView         │ canManageUsers: ✅           │ All students
sped_chair        │ useAdminView         │ canEditAllStudents: ✅       │ All students
case_manager      │ useCaseManagerView   │ canEditOwnStudents: ✅       │ Assigned only
teacher           │ useTeacherView       │ canViewAllStudents: ❌       │ Class students
service_provider  │ useTeacherView       │ canEditAllStudents: ❌       │ Service students
paraeducator      │ useParaeducatorView  │ (most restricted)            │ Direct assignments
```

### **7. Real-World Example: Granular Testing Permissions**

**Permission Levels:**
```javascript
// Full testing access (Admin/Administrator only)
const canAccessTesting = computed(() => {
  return ['admin', 'administrator'].includes(currentUser.value?.role)
})

// Partial testing access (Case Manager, Teacher, Service Provider)
const canAccessTestingPartial = computed(() => {
  return ['case_manager', 'teacher', 'service_provider'].includes(currentUser.value?.role)
})

// Any testing access (for UI elements)
const hasAnyTestingAccess = computed(() => {
  return canAccessTesting.value || canAccessTestingPartial.value
})
```

**UI Conditional Rendering:**
```vue
<!-- Testing view button only for full access -->
<label v-if="canAccessTesting" class="radio-btn">
  <input type="radio" value="testing">Test
</label>

<!-- Testing filter for any testing access -->
<div v-if="hasAnyTestingAccess" class="filter-group">
  <label>Testing Accommodations</label>
  <select v-model="currentFilters.testing">
    <option value="all">All Students</option>
    <option value="testing">Students with Testing Accommodations</option>
    <option value="no-testing">Students without Testing Accommodations</option>
  </select>
</div>

<!-- StudentTable receives testing permission props -->
<StudentTable
  :students="visibleStudents"
  :can-access-testing="canAccessTesting"
  :can-access-testing-partial="canAccessTestingPartial"
/>
```

**Component Logic (StudentTable):**
```vue
<!-- StudentTable.vue -->
<template>
  <td v-if="canAccessTesting || canAccessTestingPartial">
    <!-- Show testing accommodations column -->
    {{ getTestingAccommodations(student) }}
  </td>
</template>

<script>
props: {
  canAccessTesting: Boolean,        // Full access
  canAccessTestingPartial: Boolean  // Partial access
}

// Only show testing data for students user has access to
const getTestingAccommodations = (student) => {
  if (canAccessTesting) {
    // Admin: Show all testing data
    return student.app?.testing || 'None'
  } else if (canAccessTestingPartial) {
    // Teacher: Only show for their students
    if (isUserStudent(student)) {
      return student.app?.testing || 'None'
    }
    return 'Restricted'
  }
  return 'No Access'
}
</script>
```

**Data Filtering by Role:**
```javascript
// Admin View - sees all testing students
const testingViewStudents = computed(() => {
  return filteredStudents.value.filter(student => {
    return student.app?.flags?.flag2 || student.flag2 || false
  })
})

// Teacher View - only their students with testing accommodations
const getTestingStudents = computed(() => {
  return visibleStudents.value.filter(student => {
    const hasTestingAccom = student.app?.flags?.flag2 || student.flag2 || false
    const isMyStudent = isStudentInMyClasses(student)
    return hasTestingAccom && isMyStudent
  })
})
```

## 🚀 Usage Examples

### Adding a New Role
1. Create role-specific composable in `src/composables/roles/`
2. Add role logic to `useRoleBasedView.js`
3. Update permission matrix
4. Add role to `src/config/roles.js`

### Adding Role-Specific Features
1. Extend appropriate role composable
2. Add feature to role's return object
3. Use feature in `StudentsView.vue`
4. Update permissions if needed

### Debugging Role Issues
1. Check `currentUser.role` value
2. Verify role mapping in `useRoleBasedView.js`
3. Check `visibleStudents` filtering
4. Verify permission props in `StudentTable`

## 📋 Current Status

✅ **Completed:**
- Base role view system
- All role-specific views
- Unified role selector
- StudentsView integration
- Permission system
- Security controls

⏳ **Testing Needed:**
- Role-specific filtering
- Permission enforcement
- View mode restrictions
- UI element visibility

🔄 **Future Enhancements:**
- Dynamic permission loading
- Role-based navigation
- Advanced filtering options
- Audit logging 