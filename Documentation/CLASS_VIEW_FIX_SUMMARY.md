# Class View Fix Summary

## Issue
The class view radio button was not showing any students for teachers, case managers, and sped chairs. When these users selected "Class" view, no students were displayed even though they should see students grouped by the periods they teach.

## Root Cause
The issue was caused by double filtering in the role-based view system:

1. The `baseView` was automatically filtering students when `viewMode === 'class'`, applying teacher filtering
2. Each role view (teacher, case manager, sped chair) was then trying to filter from those already-filtered students
3. This resulted in an empty list because the filtering logic was being applied twice

## Changes Made

### 1. Fixed `useBaseRoleView.js`
- **Removed automatic view mode filtering** from the `visibleStudents` computed property
- The base view now returns all filtered students without applying role-specific filtering
- This allows each role-specific view to handle its own filtering logic

```javascript
// Before:
if (viewMode === 'class') {
  return getClassViewStudents(students, userId)
}

// After:
// Don't apply automatic filtering - let each role handle their own visibility rules
return students
```

- **Preserved class view access restrictions** with visual feedback:
```javascript
// Case managers can use class view ONLY in SP mode or when filtering by teacher
if (role === 'case_manager') {
  return filters.providerView !== 'service_provider' && filters.teacher === 'all'
}
```

### 2. Fixed `useTeacherView.js`
- Updated to use `filterData.filteredStudents.value` directly instead of `baseView.visibleStudents.value`
- This ensures teachers get the full list of filtered students to apply their own visibility rules
- The teacher view now properly filters students where the teacher ID appears in their schedule

### 3. Updated `useStudentViews.js`
- Removed the teacher-specific filtering logic from `studentsByClass`
- The function now groups all visible students by their periods
- This matches the copy 4 implementation where all students are grouped by period without additional filtering

### 4. Preserved UI Guidance for Role-Based Access
- **Case Manager View**: Class view is disabled (with strikethrough) unless in SP mode or filtering by teacher
- **Sped Chair View**: Same restrictions - must be in SP mode or filtering by teacher to use class view
- **UI Feedback**: When class view is disabled, it shows with a strikethrough to guide users

### 5. Fixed Database Query for Case Managers
- **Root Issue**: Case managers were only getting students they case manage from the database, not students they teach
- **Solution**: Updated `getCaseManagerStudents` in `useStudentQueries.js` to query for both:
  - Students where the user is the case manager
  - Students where the user teaches (appears in their schedule)
- **Result**: Case managers now have access to all students they work with, whether as case manager or teacher

```javascript
// Now queries for both:
// 1. Students where user is case manager
const cmStudents = await getDocs(caseManagerQuery)

// 2. Students where user teaches
const teacherStudents = allStudents.filter(student => {
  // Check if user is in student's schedule
})

// Combine both lists
const allStudents = [...cmStudents, ...teacherStudents]
```

## Result
- All teaching roles can see students grouped by period when in the appropriate mode
- The filtering is handled correctly at the role level without double filtering
- Clear visual feedback (strikethrough) guides users when class view is not available
- Users must explicitly switch to SP mode to see their classes, which makes the intent clear
- Case managers now properly see both students they case manage AND students they teach

## Affected Roles

| Role | Class View Access | Visual Feedback |
|------|-------------------|-----------------|
| Teacher | Always enabled | Never disabled |
| Case Manager | Only in SP mode or when filtering by teacher | Strikethrough when disabled |
| Sped Chair | Only in SP mode or when filtering by teacher | Strikethrough when disabled |
| Administrator_504_CM | Only in SP mode or when filtering by teacher | Strikethrough when disabled |
| Paraeducator | Always enabled | Never disabled |
| Admin | When filtering by teacher/aide | Strikethrough when disabled |
| Administrator | When filtering by teacher/aide | Strikethrough when disabled |
| Service Provider | When in SP mode | Strikethrough when disabled |

## Class View Usage Guide

For roles with provider view options (Case Manager, Sped Chair, Administrator_504_CM):
1. To see students by class period, switch to "SP" provider view mode
2. The "Class" radio button will become enabled (no strikethrough)
3. Click "Class" to see students grouped by the periods you teach them
4. Alternatively, select a specific teacher in the filter dropdown to see their classes 