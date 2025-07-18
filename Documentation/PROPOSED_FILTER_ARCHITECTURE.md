# Proposed Cleaner Filtering Architecture

## Current Problems

1. **Scattered Logic**: Filtering happens in 4+ different files
2. **Double/Triple Filtering**: Students get filtered at database, role view, and UI levels
3. **Unclear Data Flow**: Hard to track what students each role should see
4. **Class View Bug**: Shows students in periods the user doesn't teach

## Proposed Architecture

### Single Source of Truth: `useStudentAccess.js`

```javascript
// This composable handles ALL student access logic
export function useStudentAccess(currentUser, allStudents) {
  
  // Core access function - determines if user can see student
  const canUserSeeStudent = (userId, userRole, student) => {
    switch (userRole) {
      case 'admin':
      case 'administrator':
        return true // See all students
        
      case 'case_manager':
        return isCaseManager(userId, student) || teachesStudent(userId, student)
        
      case 'teacher':
      case 'service_provider':
        return teachesStudent(userId, student)
        
      case 'paraeducator':
        return isAssignedToStudent(userId, student)
        
      default:
        return false
    }
  }
  
  // Get all students user can access
  const getAccessibleStudents = () => {
    return allStudents.filter(student => 
      canUserSeeStudent(currentUser.uid, currentUser.role, student)
    )
  }
  
  // Get students for specific provider view
  const getProviderViewStudents = (providerView) => {
    const accessible = getAccessibleStudents()
    
    if (!['case_manager', 'sped_chair'].includes(currentUser.role)) {
      return accessible // Other roles don't have provider views
    }
    
    switch (providerView) {
      case 'case_manager':
        return accessible.filter(s => isCaseManager(currentUser.uid, s))
      case 'service_provider':
        return accessible.filter(s => teachesStudent(currentUser.uid, s))
      case 'all':
        return accessible
      default:
        return accessible
    }
  }
  
  // Get students grouped by period (for class view)
  const getStudentsByPeriod = (providerView) => {
    const students = getProviderViewStudents(providerView)
    const periods = {}
    
    students.forEach(student => {
      const schedule = student.app?.schedule?.periods || {}
      
      Object.entries(schedule).forEach(([period, data]) => {
        // Check if CURRENT USER teaches this period
        const teacherId = typeof data === 'string' ? data : data?.teacherId
        const coTeacherId = data?.coTeaching?.caseManagerId
        
        if (teacherId === currentUser.uid || coTeacherId === currentUser.uid) {
          if (!periods[period]) periods[period] = []
          periods[period].push(student)
        }
      })
    })
    
    return periods
  }
  
  return {
    canUserSeeStudent,
    getAccessibleStudents,
    getProviderViewStudents,
    getStudentsByPeriod
  }
}
```

### Simplified Role Views

Each role view becomes much simpler:

```javascript
// useCaseManagerView.js
export function useCaseManagerView(studentAccess, filterData) {
  const visibleStudents = computed(() => {
    return studentAccess.getProviderViewStudents(filterData.providerView)
  })
  
  const studentsByPeriod = computed(() => {
    return studentAccess.getStudentsByPeriod(filterData.providerView)
  })
  
  // Role-specific computed properties...
}
```

### Clear Data Flow

```
Database Query (all students)
    ↓
useStudentAccess (single filtering point)
    ↓
Role View (adds role-specific computed properties)
    ↓
UI Filters (search, grade, etc.)
    ↓
Display
```

## Benefits

1. **Single source of truth** for who can see which students
2. **No double filtering** - access logic happens once
3. **Class view fix** - `getStudentsByPeriod` only returns students in periods the user teaches
4. **Easier to test** - all logic in one place
5. **Clearer mental model** - each layer has one responsibility

## Migration Steps

1. Create `useStudentAccess.js` with all access logic
2. Update role views to use the new composable
3. Remove filtering logic from `useStudentViews.js` 
4. Update `useStudentQueries.js` to just fetch all students (let frontend filter)
5. Test thoroughly with all roles

Would you like me to implement this cleaner architecture? 