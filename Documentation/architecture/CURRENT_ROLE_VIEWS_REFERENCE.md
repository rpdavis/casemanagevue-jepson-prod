# 🏗️ Current Role Views Reference

## 📋 Overview

This document serves as the clean reference for how role-based views currently work in CaseManageVue, focusing on `admin_504` and `sped_chair` role views. This consolidates information from the role architecture refactor and replaces outdated documentation.

---

## 🎯 System Architecture

### **Unified Role View System**
The application now uses a **unified role view architecture** that eliminates code duplication:

```
roleConfig.js → useUnifiedRoleView.js → StudentsView.vue → StudentTable.vue
```

**Key Files:**
- `src/composables/roles/roleConfig.js` - Central configuration
- `src/composables/roles/useUnifiedRoleView.js` - Unified role logic
- `src/composables/roles/useAdministrator504View.js` - Special 504 coordinator view (legacy)

---

## 🔍 admin_504 (504 Coordinator) Role View

### **Database Access**
- **Query**: Gets **ALL students** from database (49 students)
- **Security**: Firestore rules control actual editing permissions
- **No DB-level filtering**: Full student list loaded, then filtered by provider view

### **Provider View Options**
```javascript
['admin_504']: [
  { value: 'case_manager', label: 'CM' },    // Students on their caseload
  { value: 'iep_504_all', label: '*' }       // All IEP and 504 students
]
```

### **Default View**: `'case_manager'` (CM mode)

### **View Modes**
1. **CM Mode**: Shows students where user is the case manager
2. **Star (*) Mode**: Shows ALL students with IEP or 504 plans

### **Implementation**
- Uses special `useAdministrator504View.js` file (legacy)
- Routed through `useRoleBasedView.js` for `admin_504` role
- Provider view dropdown shows "CM" and "*" options

---

## 🔍 sped_chair (Special Education Chair) Role View

### **Database Access**
- **Query**: Gets **ALL students** from database
- **Security**: Full editing permissions for all students
- **No DB-level filtering**: Full access to student population

### **Provider View Options**
```javascript
[ROLES.SPED_CHAIR]: [
  { value: 'all', label: 'All' },
  { value: 'case_manager', label: 'CM' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'all_iep', label: 'IEP' }
]
```

### **Default View**: `'all'` (All students)

### **View Modes**
1. **All Mode**: Shows all students in system
2. **CM Mode**: Shows students where user is case manager
3. **Teacher Mode**: Shows students where user is teacher
4. **IEP Mode**: Shows only students with IEP plans

### **Implementation**
- Uses unified `useUnifiedRoleView.js` system
- Provider view dropdown shows all 4 options
- Full student editing permissions

---

## 🔧 How Views Work

### **Loading Process**
1. `StudentsView.vue` calls role view composable
2. User role determines which view system to use
3. All students loaded from database
4. Provider view filtering applied client-side
5. UI shows filtered results with provider dropdown

### **Provider View Filtering**
```javascript
// Example for admin_504 in iep_504_all mode
case 'iep_504_all':
  if (role === 'admin_504') {
    return baseStudents.filter(student => {
      const plan = getDisplayValue(student, 'plan')
      return plan === 'IEP' || plan === '504'
    })
  }
  return []
```

---

## 🧪 Current Status

### **✅ Working Correctly**
- [x] `admin_504` CM and * views work
- [x] `sped_chair` all provider views work
- [x] Provider view dropdowns show correct options
- [x] View switching works without errors
- [x] No console errors when switching views

### **🔄 Recent Fixes**
- Fixed `activeFilters` vs `currentFilters` error in audit logging
- Fixed role name mismatch in `useUnifiedRoleView.js` for `admin_504`
- Added `admin_504` configuration to `roleConfig.js`

---

## 🔍 case_manager (Case Manager) Role View

### **Database Access**
- **Query**: Gets **only their caseload** from database (e.g., 3 students)
- **Security**: Database-level filtering by `staffIds` array
- **Efficient**: Only loads students they case manage

### **Provider View Options**
```javascript
[ROLES.CASE_MANAGER]: [
  { value: 'all', label: 'All' },
  { value: 'case_manager', label: 'CM' },
  { value: 'service_provider', label: 'SP' }
]
```

### **Default View**: `'all'` (All students in their caseload)

### **View Modes**
1. **All Mode**: Shows all students in their caseload (same as CM mode for case managers)
2. **CM Mode**: Shows students where they are the case manager (same as All for case managers)
3. **SP Mode**: Shows students where they provide services (teaching/co-teaching)

### **Implementation**
- Uses unified `useUnifiedRoleView.js` system via `useRoleBasedView.js` router
- Provider view dropdown shows "All", "CM", "SP" options
- Can only edit students in their own caseload

### **Recent Fixes**
1. **UI Display Issue**:
   - **Issue**: Students weren't appearing in UI despite correct database loading
   - **Root Cause**: `StudentsView.vue` was using `useUnifiedRoleView` directly instead of `useRoleBasedView`
   - **Solution**: Changed to use `useRoleBasedView` for proper role routing

2. **Database Query Issue**:
   - **Issue**: Only loading SP students (3), missing CM students (2), should load 6 total
   - **Root Cause**: `getCaseManagerStudents` only queried `staffIds` array, missing `caseManagerId` relationships
   - **Solution**: Updated to run two queries and combine results:
     - Query 1: `where('app.studentData.caseManagerId', '==', userId)` for CM students
     - Query 2: `where('app.staffIds', 'array-contains', userId)` for SP students

3. **StudentEditDialog Issue**:
   - **Issue**: Edit dialog couldn't find students (count: 0, "NOT FOUND") in case manager view
   - **Root Cause**: `useStudents()` created separate instances - `useStudentData()` populated one instance, `StudentEditDialog` created empty instance
   - **Solution**: Made `useStudents()` a singleton by moving `students` ref outside function scope
   - **Result**: All components now share the same students array, edit dialog works correctly

---

## 🔍 paraeducator (Paraeducator/Aide) Role View

### **Database Access**
- **Query**: Gets **only their assigned students** from database (e.g., 7 students)
- **Security**: Database-level filtering using `aideSchedules` collection
- **Efficient**: Only loads students they are assigned to help
- **Two Assignment Types**:
  - **Direct Assignment**: Students directly assigned to the aide
  - **Class Assignment**: Students in classes where aide helps specific teachers in specific periods

### **Provider View Options**
```javascript
// Paraeducators do NOT have provider view options
// They see all their assigned students - no client-side filtering
```

### **Default View**: All assigned students (no provider view dropdown)

### **View Modes**
1. **List View**: Shows all 7 assigned students
2. **Class View**: Students grouped by periods where aide is assigned to help teachers
3. **Direct Assignment View**: Students directly assigned to the aide

### **Implementation**
- Uses database-level security filtering (Pattern 1)
- Query loads from `aideSchedules` collection using `studentIds` array
- **No provider view filtering** - uses `useUnifiedRoleView.js` but bypasses client-side filtering
- Class view uses aide assignment data to match students to periods

### **Database Query Process**
1. **Primary Query**: `where('app.staffIds', 'array-contains', userId)` (usually returns 0)
2. **Fallback Query**: Load from `aideSchedules/{userId}` document
3. **Extract studentIds**: Get array of assigned student IDs
4. **Individual Fetch**: Load each student document by ID
5. **Result**: Only students the aide is authorized to see

### **Class View Logic**
```javascript
// For each student and period, check if aide is assigned to help the teacher
const aideData = aideAssignment.value[userId]
const aideTeacherIds = aideData.classAssignment[period] // Array of teacher IDs
const shouldShow = aideTeacherIds.includes(teacherId)
```

### **Email Functionality**
- **Action Button**: Only shows **Email** button (no Edit or Teacher Feedback buttons)
- **Email Type**: "Email Case Manager" - specialized for viewer-only roles
- **Tooltip**: Shows "Email Case Manager" instead of generic "Email about Student"
- **Subject Line**: 
  - Default: `{initials} - Student Inquiry` (for general questions)
  - Update: `{initials} - Student Update` (when case manager selects update categories)
- **Recipients**: Opens email dialog with case manager included in team options
- **Self-Filtering**: Paraeducator's email is automatically filtered out of recipient lists
- **Update Categories**: Cannot see case manager-only update categories:
  - Student information
  - Meeting dates
  - Services
  - Schedule
  - Instruction accommodations
  - Assessment accommodations
  - Documents
- **Email Template**: Uses professional template with dynamic case manager name inclusion

### **Recent Fixes**
1. **Students Not Loading**:
   - **Issue**: Paraeducator query was falling back to `aideSchedules` but not loading students
   - **Solution**: Fixed query to properly extract `studentIds` array and fetch individual student documents

2. **Class View Not Working**:
   - **Issue**: Aide assignment data wasn't available in `useStudentViews` context
   - **Root Cause**: Data flow timing issue between `useStudentData` and `useStudentViews`
   - **Solution**: Ensured aide assignment loads before class view computation

3. **Provider View Filtering Conflict**:
   - **Issue**: `useUnifiedRoleView` was trying to apply client-side filtering to database-filtered students
   - **Solution**: Added special handling for `paraeducator` role to bypass provider view filtering entirely

4. **Email Action Button**:
   - **Issue**: Paraeducators had Edit and Teacher Feedback buttons they shouldn't access
   - **Solution**: Restricted to Email button only with "Email Case Manager" functionality

5. **Email Dialog Enhancement**:
   - **Issue**: Email system needed comprehensive update categories and professional templates
   - **Solution**: Added 7 update categories (student info, meetings, services, schedule, accommodations, documents) with dynamic case manager name inclusion and improved UI (checkboxes on left, proper styling)

---

## 📝 Other Roles to Document

### **🔍 service_provider (Service Provider) Role View**
- **Database Access**: [TO BE DOCUMENTED]
- **Provider View Options**: [TO BE DOCUMENTED]
- **Email Functionality**: [TO BE DOCUMENTED]
- **Recent Fixes**: [TO BE DOCUMENTED]

### **🔍 teacher (Teacher) Role View**
- **Database Access**: [TO BE DOCUMENTED]
- **Provider View Options**: [TO BE DOCUMENTED]
- **Email Functionality**: 
  - **Action Button**: Only shows **Email** button (viewer-only role)
  - **Email Type**: "Email Case Manager" - same as paraeducator
  - **Subject Line**: `{initials} - Student Inquiry` (default)
  - **Self-Filtering**: Teacher's email filtered out of recipient lists
  - **Restrictions**: Cannot see case manager checkboxes
- **Recent Fixes**: [TO BE DOCUMENTED]

### **🔍 staff_view (Staff View) Role View**
- **Database Access**: [TO BE DOCUMENTED]
- **Provider View Options**: [TO BE DOCUMENTED]
- **Email Functionality**:
  - **Action Button**: Only shows **Email** button (viewer-only role)
  - **Email Type**: "Email Case Manager" - same as paraeducator
  - **Subject Line**: `{initials} - Student Inquiry` (default)
  - **Self-Filtering**: Staff member's email filtered out of recipient lists
  - **Restrictions**: Cannot see case manager checkboxes
- **Recent Fixes**: [TO BE DOCUMENTED]

### **🔍 school_admin (School Admin) Role View**
- **Database Access**: [TO BE DOCUMENTED]
- **Provider View Options**: [TO BE DOCUMENTED]
- **Email Functionality**: [TO BE DOCUMENTED]
- **Recent Fixes**: [TO BE DOCUMENTED]

### **🔍 staff_edit (Staff Edit) Role View**
- **Database Access**: [TO BE DOCUMENTED]
- **Provider View Options**: [TO BE DOCUMENTED]
- **Email Functionality**: [TO BE DOCUMENTED]
- **Recent Fixes**: [TO BE DOCUMENTED]

### **🔍 admin (Administrator) Role View**
- **Database Access**: [TO BE DOCUMENTED]
- **Provider View Options**: [TO BE DOCUMENTED]
- **Email Functionality**: [TO BE DOCUMENTED]
- **Recent Fixes**: [TO BE DOCUMENTED]

---

## 🎯 Key Points

### **Two Database Security Patterns:**

**Pattern 1 - Database-Level Filtering (Secure & Efficient):**
- **Roles**: `case_manager`, `teacher`, `service_provider`, `paraeducator`
- **Query**: Load ONLY authorized students from database
- **Filtering**: Database-level security (Firestore queries)
- **Provider Views**: None or bypassed (students already filtered)
- **Performance**: Efficient - only loads what user can see

**Pattern 2 - Full Load + Client-Side Filtering (Admin Convenience):**
- **Roles**: `admin`, `sped_chair`, `admin_504`, `school_admin`
- **Query**: Load ALL students from database
- **Filtering**: Client-side provider view filtering
- **Provider Views**: Multiple options (All, CM, SP, etc.)
- **Performance**: Less efficient but provides admin flexibility

### **Implementation Notes:**
1. **admin_504 uses special legacy view** - `useAdministrator504View.js`
2. **Most roles use unified system** - `useUnifiedRoleView.js`
3. **Pattern 1 roles bypass provider filtering** - Students already filtered by database
4. **Pattern 2 roles use provider views** - To filter the full student list
5. **Firestore rules control editing permissions** - Independent of view system

---

**📅 Last Updated**: After paraeducator class view fix and Pattern 1/2 clarification  
**🔄 Status**: Active reference - now includes paraeducator role documentation