# Student Table Architecture

This document describes the modular architecture of the Student Table system in CaseManageVue.

## 📋 **Overview**

The Student Table has been refactored from a monolithic component into a modular, maintainable architecture. The table displays comprehensive student data with role-based filtering, search capabilities, and action buttons, all while maintaining FERPA compliance and security.

## 🏗️ **Architecture Structure**

### **Main Component**
- **`StudentTable.vue`**: Orchestrates the table display and manages overall table state

### **Cell Components**
- **`StudentInfoCell.vue`**: Student name, grade, case manager, dates, flags
- **`StudentServicesCell.vue`**: Class services and related services display  
- **`StudentScheduleCell.vue`**: Student class schedule by periods
- **`StudentAccommodationsCell.vue`**: Instruction and assessment accommodations
- **`StudentDocsCell.vue`**: Document links (At-A-Glance, BIP)
- **`StudentActionsCell.vue`**: Edit, email, and teacher feedback buttons
- **`StudentFeedbackCell.vue`**: Teacher feedback status and actions

### **Business Logic**
- **`useStudentTable.js`**: Composable with all helper functions and data processing logic

### **Styling**
- **`StudentTable.css`**: Centralized styles for all table components

## 📁 **File Structure**

```
src/components/students/
├── StudentTable.vue                    # Main table component
└── table/
    ├── index.js                       # Barrel export for clean imports
    ├── useStudentTable.js             # Helper functions composable
    ├── StudentTable.css               # External table styles
    ├── StudentInfoCell.vue            # Student info display
    ├── StudentServicesCell.vue        # Services display
    ├── StudentScheduleCell.vue        # Schedule display
    ├── StudentAccommodationsCell.vue  # Accommodations display
    ├── StudentDocsCell.vue            # Documents display
    ├── StudentActionsCell.vue         # Action buttons
    ├── StudentFeedbackCell.vue        # Feedback status
    └── README.md                      # Component documentation
```

## 🔧 **Helper Functions Composable**

### **useStudentTable.js**
Contains all data processing and utility functions:

```javascript
export function useStudentTable(props) {
  const { userMap, currentUser, appSettings } = props
  
  // User mapping functions
  const getUserName = (userId) => { /* ... */ }
  const getUserInitials = (userId) => { /* ... */ }
  const getUserInitialLastName = (userId) => { /* ... */ }
  
  // Date formatting and urgency
  const formatDate = (dateString) => { /* ... */ }
  const getDateUrgencyClass = (dateString, type) => { /* ... */ }
  const isDateUrgent = (dateString, daysThreshold) => { /* ... */ }
  
  // Student data extraction
  const getCaseManagerId = (student) => { /* ... */ }
  const getFlagValue = (student, flagName) => { /* ... */ }
  const hasFlags = (student) => { /* ... */ }
  
  // Schedule processing
  const getSchedule = (student) => { /* ... */ }
  
  // Services processing
  const getClassServices = (student) => { /* ... */ }
  const getOtherServices = (student) => { /* ... */ }
  const hasServiceProviders = (student) => { /* ... */ }
  
  // Paraeducator assignments
  const isDirectAssignment = (student, aideId) => { /* ... */ }
  
  // Utility functions
  const formatListFromText = (text) => { /* ... */ }
  const getFlagClass = (flagValue) => { /* ... */ }
  
  return {
    // User functions
    getUserName,
    getUserInitials,
    getUserInitialLastName,
    
    // Date functions
    formatDate,
    getDateUrgencyClass,
    isDateUrgent,
    
    // Student data functions
    getCaseManagerId,
    getFlagValue,
    hasFlags,
    getSchedule,
    getClassServices,
    getOtherServices,
    hasServiceProviders,
    isDirectAssignment,
    
    // Utility functions
    formatListFromText,
    getFlagClass
  }
}
```

## 🧩 **Cell Component Details**

### **StudentInfoCell.vue**
**Purpose**: Displays core student identification and status information

```javascript
// Props
{
  student: Object,           // Student data object
  currentUser: Object,       // Current user for role-based display
  getUserName: Function,     // Helper function for user names
  getCaseManagerId: Function,// Helper function for case manager
  formatDate: Function,      // Date formatting helper
  getDateUrgencyClass: Function, // Date urgency styling
  getFlagValue: Function,    // Flag value extraction
  getFlagClass: Function,    // Flag styling
  hasFlags: Function         // Flag existence check
}

// Display Elements
- Student name with grade level
- Case manager name with initials
- Important dates (Review, Reeval, Meeting) with urgency indicators
- Testing flags with color coding
- Plan type badge (IEP, 504, RTI, None)
```

### **StudentServicesCell.vue**
**Purpose**: Shows class services and related services

```javascript
// Props
{
  student: Object,
  getClassServices: Function,
  getOtherServices: Function,
  hasServiceProviders: Function,
  formatListFromText: Function
}

// Display Elements
- Class services list (RSP, Co-teach, SDC)
- Related services indicators
- Service provider status
- Service type badges
```

### **StudentScheduleCell.vue**
**Purpose**: Displays student class schedule by periods

```javascript
// Props
{
  student: Object,
  currentUser: Object,
  userMap: Object,
  getSchedule: Function,
  getUserInitials: Function
}

// Display Elements
- Period-by-period schedule
- Teacher initials for each period
- Co-teaching indicators
- Empty period indicators
- Role-based schedule filtering
```

### **StudentAccommodationsCell.vue**
**Purpose**: Shows instruction and assessment accommodations

```javascript
// Props
{
  student: Object,
  formatListFromText: Function
}

// Display Elements
- Instruction accommodations summary
- Assessment accommodations summary
- Truncated text with expand option
- Accommodation type indicators
```

### **StudentDocsCell.vue**
**Purpose**: Document access and management

```javascript
// Props
{
  student: Object,
  currentUser: Object
}

// Display Elements
- At-A-Glance document link
- BIP document link
- Document availability indicators
- Role-based access control
- Secure document URLs
```

### **StudentActionsCell.vue**
**Purpose**: Action buttons for student management

```javascript
// Props
{
  student: Object,
  currentUser: Object,
  canEdit: Boolean,
  onEdit: Function,
  onEmail: Function,
  onFeedback: Function
}

// Action Elements
- Edit button (role-based visibility)
- Email button with student email
- Teacher feedback button
- Action button styling and states
```

### **StudentFeedbackCell.vue**
**Purpose**: Teacher feedback status and management

```javascript
// Props
{
  student: Object,
  currentUser: Object,
  feedbackForms: Array,
  onSendFeedback: Function
}

// Display Elements
- Feedback form status
- Last feedback date
- Send feedback button
- Feedback response indicators
```

## 🎨 **Styling Architecture**

### **StudentTable.css**
Centralized styles organized by component:

```css
/* Table structure */
.student-table { /* ... */ }
.table-header { /* ... */ }
.table-row { /* ... */ }

/* Student info styles */
.student-name { /* ... */ }
.grade-badge { /* ... */ }
.case-manager { /* ... */ }

/* Date and urgency styles */
.date-display { /* ... */ }
.date-urgent { /* ... */ }
.date-warning { /* ... */ }

/* Flag and badge styles */
.flag-badge { /* ... */ }
.flag-active { /* ... */ }
.plan-badge { /* ... */ }

/* Service and schedule styles */
.service-list { /* ... */ }
.schedule-period { /* ... */ }
.teacher-initials { /* ... */ }

/* Action button styles */
.action-buttons { /* ... */ }
.btn-edit { /* ... */ }
.btn-email { /* ... */ }
.btn-feedback { /* ... */ }

/* Accommodation styles */
.accommodation-text { /* ... */ }
.accommodation-summary { /* ... */ }

/* Document link styles */
.document-link { /* ... */ }
.document-available { /* ... */ }
.document-missing { /* ... */ }
```

## 🔄 **Data Flow**

### **Props Flow**
1. **Main Table**: Receives students array, user data, and app settings
2. **Helper Functions**: Created by `useStudentTable` composable
3. **Cell Components**: Receive student data and helper functions as props
4. **Event Handling**: Actions bubble up from cells to main component

### **State Management**
```javascript
// Main StudentTable.vue
export default {
  setup(props, { emit }) {
    // Create helper functions
    const helpers = useStudentTable(props)
    
    // Event handlers
    const handleEdit = (student) => emit('edit-student', student)
    const handleEmail = (student) => emit('email-student', student)
    const handleFeedback = (student) => emit('feedback-student', student)
    
    return {
      ...helpers,
      handleEdit,
      handleEmail,
      handleFeedback
    }
  }
}
```

## 🔒 **Security Features**

### **Role-Based Display**
- Different data visibility based on user role
- Action button availability by permissions
- Document access control
- Schedule filtering by teacher assignments

### **Data Protection**
- Sensitive data is not exposed to unauthorized users
- Document URLs are generated securely
- FERPA compliant data display
- Audit logging for data access

### **Access Control**
```javascript
// Example: Role-based schedule display
const getSchedule = (student) => {
  const schedule = student.app?.schedule?.periods || {}
  
  // Teachers only see their own periods
  if (currentUser.role === 'teacher') {
    return Object.entries(schedule)
      .filter(([period, teacherId]) => teacherId === currentUser.uid)
      .reduce((acc, [period, teacherId]) => {
        acc[period] = teacherId
        return acc
      }, {})
  }
  
  // Admins and case managers see full schedule
  return schedule
}
```

## 📊 **Performance Optimizations**

### **Efficient Rendering**
- Cell components only re-render when their specific data changes
- Helper functions are memoized to prevent unnecessary recalculations
- Large datasets are handled with virtual scrolling (future enhancement)

### **Memory Management**
- Components are lightweight and focused
- No memory leaks from event listeners
- Proper cleanup of reactive references

### **Bundle Optimization**
- Tree-shakeable exports from `index.js`
- Components can be lazy-loaded if needed
- CSS is external and cacheable

## 🧪 **Testing Strategy**

### **Unit Tests**
```javascript
// Test helper functions
describe('useStudentTable', () => {
  it('should format user names correctly', () => {
    const { getUserName } = useStudentTable(mockProps)
    expect(getUserName('user123')).toBe('John Doe')
  })
  
  it('should calculate date urgency correctly', () => {
    const { getDateUrgencyClass } = useStudentTable(mockProps)
    expect(getDateUrgencyClass(pastDate, 'review')).toBe('date-urgent')
  })
})
```

### **Component Tests**
```javascript
// Test individual cell components
describe('StudentInfoCell', () => {
  it('should display student name and grade', () => {
    const wrapper = mount(StudentInfoCell, { props: mockProps })
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Grade 7')
  })
})
```

### **Integration Tests**
- Full table rendering with real data
- Role-based display testing
- Action button functionality
- Data flow validation

## 🔧 **Usage Examples**

### **Basic Table Usage**
```vue
<template>
  <StudentTable
    :students="students"
    :user-map="userMap"
    :current-user="currentUser"
    :app-settings="appSettings"
    :feedback-forms="feedbackForms"
    @edit-student="handleEditStudent"
    @email-student="handleEmailStudent"
    @feedback-student="handleFeedbackStudent"
  />
</template>
```

### **Custom Cell Implementation**
```vue
<!-- Custom cell component -->
<template>
  <td class="custom-cell">
    <CustomData :student="student" />
  </td>
</template>

<script>
import { useStudentTable } from './table'

export default {
  props: ['student', 'currentUser'],
  setup(props) {
    const { getUserName, formatDate } = useStudentTable(props)
    return { getUserName, formatDate }
  }
}
</script>
```

### **Adding New Helper Functions**
```javascript
// Extend useStudentTable.js
export function useStudentTable(props) {
  // ... existing functions
  
  // New helper function
  const getCustomData = (student) => {
    // Custom data processing logic
    return processedData
  }
  
  return {
    // ... existing returns
    getCustomData
  }
}
```

## 📈 **Benefits of Modular Architecture**

### **Maintainability**
- **Single Responsibility**: Each cell handles one aspect of student data
- **Easy Debugging**: Issues can be isolated to specific components
- **Consistent Styling**: Centralized CSS prevents style conflicts

### **Reusability**
- **Component Reuse**: Cells can be used in other tables or views
- **Function Reuse**: Helper functions work across different contexts
- **Style Reuse**: CSS classes can be applied to other components

### **Performance**
- **Optimized Rendering**: Only changed cells re-render
- **Code Splitting**: Components can be loaded on demand
- **Memory Efficiency**: Smaller, focused components use less memory

### **Development Experience**
- **Parallel Development**: Different developers can work on different cells
- **Easy Testing**: Each component can be tested independently
- **Clear Structure**: Component boundaries make the code easier to understand

## 📅 **Migration from Legacy Table**

### **Key Changes**
1. **Monolithic → Modular**: Split large component into focused cells
2. **Inline Functions → Composable**: Moved helper functions to `useStudentTable.js`
3. **Inline Styles → External CSS**: Centralized styling in `StudentTable.css`
4. **Complex Logic → Simple Props**: Simplified component interfaces

### **Backward Compatibility**
- Main component props and events remain the same
- Data structure is unchanged
- Existing integrations continue to work
- Performance is improved without breaking changes

---

**Last Updated**: July 2025  
**Architecture Version**: 2.0 (Modular)  
**Components**: 7 cell components + 1 composable + 1 CSS file 