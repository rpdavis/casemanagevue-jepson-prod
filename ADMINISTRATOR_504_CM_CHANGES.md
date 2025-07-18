# Administrator 504 CM Role Changes

This document outlines all the changes needed to implement the administrator_504_CM role that can edit only students with 504 plans.

## Firebase Rules Changes

### File: `firestore.rules`

In the `students` collection rules, update the condition for administrator_504_CM:

```javascript
// Current rule (line ~45):
allow read, write: if request.auth != null && 
  resource.data.app.caseManagers != null && 
  request.auth.uid in resource.data.app.caseManagers &&
  hasRole('administrator_504_CM');

// Change to:
allow read, write: if request.auth != null && 
  hasRole('administrator_504_CM') &&
  resource.data.app.studentData.plan == "504";
```

## Frontend Code Changes

### File: `src/config/roles.js`

Update the administrator_504_CM role definition (around line 45):

```javascript
// Current:
administrator_504_CM: {
  name: 'Administrator 504 CM',
  permissions: ['read', 'write'],
  studentAccess: {
    type: 'caseload',
    additionalFilters: {
      plan: '504'
    }
  }
},

// Change to:
administrator_504_CM: {
  name: 'Administrator 504 CM', 
  permissions: ['read', 'write'],
  studentAccess: {
    type: 'filtered',
    filters: {
      plan: '504'
    }
  }
},
```

### File: `src/composables/useStudentAccess.js`

Update the getFilteredStudents function to handle administrator_504_CM properly:

```javascript
// Around line 45-50, in the role-based filtering section:
// Add this condition for administrator_504_CM:
if (userRole === 'administrator_504_CM') {
  return students.filter(student => student.plan === '504');
}
```

## Summary

The administrator_504_CM role should:
1. **Firebase Rules**: Allow read/write access to any student with `plan == "504"`
2. **Frontend**: Filter students to show only those with 504 plans
3. **No caseload restriction**: Unlike other roles, this role sees ALL 504 students, not just their caseload

## Testing

After implementing these changes:
1. Login as a user with administrator_504_CM role
2. Verify they can see all students with 504 plans
3. Verify they cannot see students with IEP plans
4. Verify they can edit 504 students (save data)
5. Test that they cannot edit IEP students

## Deployment

After making these changes:
1. Deploy Firebase rules: `firebase deploy --only firestore:rules`
2. Build and deploy frontend: `npm run build && firebase deploy --only hosting` 