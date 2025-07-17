# Role View System Changes

## Overview
This document tracks changes made to standardize and improve the role-based view system.

## Phase 1: Core Infrastructure

### useBaseRoleView.js Changes
- Added standardized schedule handling functions:
  ```javascript
  standardizeScheduleAccess(schedule, userId)
  getProviderViewStudents(students, userId, providerView)
  getClassViewStudents(students, userId)
  groupStudentsByPeriod(students, userId)
  ```
- Enhanced visibleStudents computed property to use standardized filtering
- Added proper null checks and error handling
- Added support for both string and object schedule formats

### useCaseManagerView.js Changes
- Removed duplicate schedule handling code
- Added currentUserId computed property
- Updated visibleStudents to use standardized filtering
- Simplified studentsByPeriod using standardized grouping
- Updated managedStudents and serviceStudents to use standard provider view filtering
- Removed redundant filtering functions
- Maintained existing service grouping functionality

### useServiceProviderView.js Changes
- Simplified visibleStudents to use standard provider view filtering
- Updated studentsByPeriod to use standardized grouping
- Removed duplicate schedule handling code
- Added proper null checks

### useTeacherView.js Changes
- Updated visibleStudents to use standard provider view filtering
- Simplified studentsByPeriod using standardized grouping
- Removed redundant filtering functions
- Maintained accommodation and service provider grouping
- Added showProviderView and providerViewOptions

### useSpedChairView.js Changes
- Added currentUserId and currentRole computed properties
- Converted provider view filtering to switch statement for better organization
- Updated to use standardized schedule access functions
- Added studentsByPeriod using standardized grouping
- Improved error handling with unknown provider views
- Maintained special IEP/504 filtering functionality
- Better role-based view option handling

### useParaeducatorView.js Changes
- Added currentUserId computed property
- Updated to use standardized schedule access functions
- Improved direct assignment handling with better null checks
- Enhanced class assignment logic using standardized schedule format
- Removed redundant filtering functions
- Added proper error states for missing data
- Added showProviderView and providerViewOptions
- Maintained existing accommodation grouping
- Better handling of aide assignment data structures

## Key Benefits
1. Consistent Co-Teaching Support
   - All views now properly handle co-teaching relationships
   - Both main teachers and co-teaching case managers are included

2. Standardized Schedule Handling
   - Single source of truth for schedule access
   - Handles both legacy string format and new object format
   - Better error handling and type safety

3. Improved Code Organization
   - Removed duplicate code
   - Centralized common functionality
   - Better separation of concerns

4. Enhanced Maintainability
   - Standardized filtering logic
   - Consistent period grouping
   - Unified provider view handling

## Completed Changes
- [x] Update useBaseRoleView.js with standardized functions
- [x] Update useCaseManagerView.js
- [x] Update useServiceProviderView.js
- [x] Update useTeacherView.js
- [x] Update useSpedChairView.js
- [x] Update useParaeducatorView.js

## Next Steps
- [ ] Add comprehensive error logging
- [ ] Add performance optimizations
- [ ] Add migration helpers for legacy data
- [ ] Add unit tests for standardized functions
- [ ] Document new standardized approach
- [ ] Create migration guide for future changes

## Testing Notes
Areas to verify after changes:
1. Co-teaching functionality in all views
2. Class view period grouping
3. Provider view filtering
4. Schedule format handling
5. Permission inheritance
6. IEP/504 filtering in SPED Chair view
7. Paraeducator assignments and grouping
8. Error handling for missing or malformed data 