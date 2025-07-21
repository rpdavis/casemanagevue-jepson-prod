# Vue Composables Reference

This document provides a comprehensive reference for all Vue composables in the CaseManageVue application.

## 📋 **Core Data Composables**

### `useStudentData.js`
**Purpose**: Central student data management and coordination  
**Location**: `src/composables/useStudentData.js`

```javascript
const {
  // State
  currentUser,
  isAdmin,
  showProviderView,
  isLoading,
  error,
  
  // Data
  students,
  userMap,
  userList,
  caseManagers,
  teacherList,
  userRoles,
  
  // Methods
  fetchData,
  refreshData,
  setStudents
} = useStudentData()
```

**Key Features**:
- Coordinates all student data fetching
- Manages user authentication state
- Provides role-based data access
- Integrates with security testing

### `useStudentQueries.js`
**Purpose**: Role-based database queries for secure student access  
**Location**: `src/composables/useStudentQueries.js`

```javascript
const {
  // State
  students,
  loading,
  error,
  totalCount,
  
  // Methods
  loadStudents,
  getStudent,
  verifyStudentAccess,
  
  // Role-specific queries
  getAdminStudents,
  getCaseManagerStudents,
  getTeacherStudents,
  getServiceProviderStudents,
  getParaeducatorStudents
} = useStudentQueries()
```

**Security Features**:
- Database-level filtering using `staffIds` array
- Role-based query validation
- FERPA compliant access control

### `useStudentFilters.js`
**Purpose**: Search, filtering, and sorting functionality  
**Location**: `src/composables/useStudentFilters.js`

```javascript
const {
  // State
  showFilters,
  filteredStudents,
  currentFilters,
  
  // Methods
  toggleFilters,
  clearFilters,
  applyFilters,
  debouncedApplyFilters,
  
  // Filter options
  caseManagerOptions,
  teacherOptions,
  paraeducatorOptions
} = useStudentFilters(studentData)
```

## 🎭 **Role-Based View Composables**

### `useRoleBasedView.js`
**Purpose**: Factory for creating role-specific views  
**Location**: `src/composables/roles/useRoleBasedView.js`

```javascript
const roleView = useRoleBasedView(studentData, filterData)

// Returns appropriate role view:
// - useAdminView (admin)
// - useCaseManagerView (case_manager)  
// - useTeacherView (teacher)
// - useServiceProviderView (service_provider)
// - useParaeducatorView (paraeducator)
// - useSpedChairView (sped_chair)
// - useAdministratorView (administrator)
// - useAdministrator504View (administrator_504_CM)
```

### Individual Role Views
Each role has its own composable with specific access patterns:

```javascript
// Example: useCaseManagerView.js
const {
  visibleStudents,      // Students user can access
  providerViewOptions,  // Provider view dropdown options
  canAccessStudent,     // Individual student access check
  getStudentsByView     // Filter by provider view
} = useCaseManagerView(studentData, filterData)
```

## 🔧 **Utility Composables**

### `useAuth.js`
**Purpose**: Authentication state management  
**Location**: `src/composables/useAuth.js`

```javascript
const {
  currentUser,      // Reactive user object
  waitForAuthInit   // Promise for auth initialization
} = useAuth()
```

### `usePermissions.js`
**Purpose**: Permission checking and validation  
**Location**: `src/composables/usePermissions.js`

```javascript
const {
  hasPermission,           // Check specific permission
  canPerformAction,        // Check action permission
  getUserPermissions,      // Get all user permissions
  permissionsMatrix        // Full permissions matrix
} = usePermissions()
```

### `useAppSettings.js`
**Purpose**: Application settings management  
**Location**: `src/composables/useAppSettings.js`

```javascript
const {
  appSettings,        // Reactive settings object
  loadAppSettings,    // Load from Firestore
  saveAppSettings,    // Save to Firestore
  resetToDefaults     // Reset to default values
} = useAppSettings()
```

## 📊 **Data Integration Composables**

### `useAeriesAPI.js`
**Purpose**: Aeries SIS integration  
**Location**: `src/composables/useAeriesAPI.js`

```javascript
const {
  // Connection state
  isConnected,
  isConnecting,
  connectionStatus,
  
  // Configuration
  connectionConfig,
  availableEndpoints,
  
  // Methods
  connect,
  disconnect,
  testEndpoint,
  fetchSchools,
  fetchClasses
} = useAeriesAPI()
```

### `useGoogleSheetsIntegration.js`
**Purpose**: Google Sheets real-time synchronization  
**Location**: `src/composables/useGoogleSheetsIntegration.js`

```javascript
const {
  // State
  linkedSheetId,
  lastSyncTime,
  syncStatus,
  
  // Methods
  createLinkedGoogleSheet,
  syncNow,
  openGoogleSheet,
  unlinkSheet,
  exportToCSV
} = useGoogleSheetsIntegration(students, users, testingData)
```

### `useImporters.js`
**Purpose**: CSV and bulk data import functionality  
**Location**: `src/composables/useImporters.js`

```javascript
const {
  // Import state
  isImporting,
  importProgress,
  importResults,
  
  // Methods
  importStudentsFromCSV,
  importUsersFromCSV,
  validateImportData,
  processImportFile
} = useImporters()
```

## 🎯 **Feature-Specific Composables**

### `useTeacherFeedback.js`
**Purpose**: Teacher feedback form system  
**Location**: `src/composables/useTeacherFeedback.js`

```javascript
const {
  // State
  feedbackForms,
  formsLoading,
  feedbackResponses,
  
  // Methods
  sendFeedbackForm,
  syncFormResponses,
  getFeedbackForStudent,
  createGoogleForm
} = useTeacherFeedback()
```

### `useAideAssignment.js`
**Purpose**: Paraeducator assignment management  
**Location**: `src/composables/useAideAssignment.js`

```javascript
const {
  // State
  aideAssignment,
  
  // Methods
  loadAideAssignment,
  shouldAideSeeStudent,
  getStudentsForAide,
  updateAideAssignment
} = useAideAssignment()
```

### `useStudentViews.js`
**Purpose**: Student grouping and view organization  
**Location**: `src/composables/useStudentViews.js`

```javascript
const {
  // View modes
  currentViewMode,
  
  // Grouped data
  studentsByClass,
  testingViewStudents,
  
  // Methods
  groupStudentsByPeriod,
  getClassViewData
} = useStudentViews(studentData, filterData, roleBasedStudents)
```

## 🔒 **Security Composables**

### `useIEPSecurity.js`
**Purpose**: IEP data encryption and security  
**Location**: `src/composables/useIEPSecurity.js`

```javascript
const {
  // Encryption
  encryptSensitiveData,
  decryptSensitiveData,
  
  // Validation
  validateEncryption,
  isDataEncrypted,
  
  // Access logging
  logIEPAccess,
  auditDataAccess
} = useIEPSecurity()
```

### `useStudentAccess.js`
**Purpose**: Student access verification and logging  
**Location**: `src/composables/useStudentAccess.js`

```javascript
const {
  // Access control
  canUserAccessStudent,
  verifyStudentPermissions,
  
  // Audit logging
  logStudentAccess,
  trackDataExport,
  
  // Security testing
  runSecurityTest,
  validateAccess
} = useStudentAccess()
```

## 📱 **UI & Navigation Composables**

### `useStudentNavActions.js`
**Purpose**: Student navigation and actions  
**Location**: `src/composables/useStudentNavActions.js`

```javascript
const {
  // Navigation state
  currentView,
  availableViews,
  
  // Actions
  handleNavAction,
  switchToView,
  updateViewMode
} = useStudentNavActions(studentData)
```

### `useCustomTabs.js`
**Purpose**: Custom tab management for Google Sheets  
**Location**: `src/composables/useCustomTabs.js`

```javascript
const {
  // Tab state
  customTabs,
  showAddTabForm,
  newTabName,
  selectedTeachers,
  
  // Methods
  addCustomTab,
  removeCustomTab,
  resetForm,
  toggleAddTabForm
} = useCustomTabs(testingData, googleSheetsIntegration)
```

## 💾 **Storage & Persistence Composables**

### `useStorage.js`
**Purpose**: Local and secure storage management  
**Location**: `src/composables/useStorage.js`

```javascript
const {
  // Local storage
  saveToLocal,
  loadFromLocal,
  removeFromLocal,
  
  // Secure storage
  saveSecureData,
  loadSecureData,
  clearSecureData
} = useStorage()
```

### `usePdfHandler.js`
**Purpose**: PDF document management  
**Location**: `src/composables/usePdfHandler.js`

```javascript
const {
  // Upload state
  isUploading,
  uploadProgress,
  
  // Methods
  uploadPdf,
  deletePdf,
  generateSecureUrl,
  validatePdfAccess
} = usePdfHandler()
```

## 🧪 **Testing & Debug Composables**

### `useTestingData.js`
**Purpose**: Testing view data management  
**Location**: `src/composables/useTestingData.js`

```javascript
const {
  // Testing data
  availablePeriods,
  availableTeachers,
  
  // Methods
  getStudentsForTeachers,
  getStudentTeacherPeriods,
  filterTestingStudents
} = useTestingData(students, users, appSettings)
```

### `useDebugMenu.js`
**Purpose**: Debug tools and system monitoring  
**Location**: `src/composables/useDebugMenu.js`

```javascript
const {
  // Debug state
  debugMode,
  debugInfo,
  
  // Methods
  toggleDebugMode,
  runSystemCheck,
  exportDebugData
} = useDebugMenu()
```

## 📊 **Data Processing Composables**

### `useStudentForm.js`
**Purpose**: Student form state and validation  
**Location**: `src/components/students/form/useStudentForm.js`

```javascript
const {
  // Form state
  form,
  isSaving,
  
  // Validation
  validateForm,
  formErrors,
  
  // File handling
  onFileChange,
  removeBipFile,
  removeAtaglanceFile,
  
  // Submission
  handleSubmit
} = useStudentForm(props, emit)
```

### `useStudentTable.js`
**Purpose**: Student table helper functions  
**Location**: `src/components/students/table/useStudentTable.js`

```javascript
const {
  // User mapping
  getUserName,
  getUserInitials,
  
  // Date formatting
  formatDate,
  getDateUrgencyClass,
  
  // Data extraction
  getCaseManagerId,
  getFlagValue,
  getSchedule,
  getClassServices,
  
  // Utilities
  formatListFromText,
  getFlagClass
} = useStudentTable(props)
```

## 🔧 **Usage Patterns**

### Composable Composition
```javascript
// Typical view component setup
export default {
  setup() {
    // Core data
    const studentData = useStudentData()
    const filterData = useStudentFilters(studentData)
    const roleView = useRoleBasedView(studentData, filterData)
    
    // Feature-specific
    const navActions = useStudentNavActions(studentData)
    const studentViews = useStudentViews(studentData, filterData, roleView.visibleStudents)
    
    // Return composed functionality
    return {
      ...studentData,
      ...filterData,
      ...roleView,
      ...navActions,
      ...studentViews
    }
  }
}
```

### Security Integration
```javascript
// Security-aware composable usage
const { loadStudents } = useStudentQueries()
const { runSecurityTest } = useStudentAccess()

// Load data with automatic security validation
const students = await loadStudents()
const securityResult = runSecurityTest(students, currentUser)

if (!securityResult.isSecure) {
  console.error('Security violation detected')
}
```

## 📅 **Best Practices**

1. **Reactive Data**: Use `ref()` and `computed()` for reactive state
2. **Error Handling**: Include error states and loading indicators
3. **Security First**: Always validate access and permissions
4. **Composition**: Combine composables for complex functionality
5. **Testing**: Include security and access validation
6. **Documentation**: Document complex composables with examples

---

**Last Updated**: July 2025  
**Total Composables**: 25+ active composables covering all major functionality 