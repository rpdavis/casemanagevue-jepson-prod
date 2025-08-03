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

## 📝 Other Roles to Document

### **Next to Verify:**
- [ ] `service_provider` - Served students view  
- [ ] `teacher` - Assigned students view
- [ ] `paraeducator` - Assigned students view
- [ ] `school_admin` - New role, needs documentation
- [ ] `staff_view` - New role, needs documentation
- [ ] `staff_edit` - New role, needs documentation

---

## 🎯 Key Points

1. **admin_504 uses special legacy view** - `useAdministrator504View.js`
2. **sped_chair uses unified system** - `useUnifiedRoleView.js`
3. **All roles load full student list** - Filtering happens client-side
4. **Provider views control what's shown** - Not what's loaded
5. **Firestore rules control editing** - Not the view system

---

**📅 Last Updated**: After admin_504 and sped_chair view fixes  
**🔄 Status**: Active reference - will expand as other roles are verified