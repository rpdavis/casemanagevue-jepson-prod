# Student Form Architecture

This document describes the modular architecture of the Student Form system in CaseManageVue.

## 📋 **Overview**

The Student Form has been refactored into a modular, maintainable architecture that separates concerns and makes the codebase easier to work with. The form handles comprehensive student data including basic information, schedules, services, documents, and accommodations.

## 🏗️ **Architecture Structure**

### **Main Orchestrator**
- **`StudentForm.vue`**: Main component that coordinates all subcomponents and manages the overall form state

### **Form Sections (Subcomponents)**
- **`StudentBasicInfo.vue`**: Name, SSID, grade, plan, dates, case manager
- **`StudentSchedule.vue`**: Period/teacher assignments and schedule management
- **`StudentClassServices.vue`**: Class service type selections (RSP, Co-teach, etc.)
- **`StudentProviders.vue`**: Service provider assignments (Speech, OT, PT, etc.)
- **`StudentDocuments.vue`**: File uploads for BIP and At-A-Glance documents
- **`StudentAccommodations.vue`**: Instruction and assessment accommodation text areas
- **`StudentFlags.vue`**: Testing flags and special indicators

### **Business Logic**
- **`useStudentForm.js`**: Composable containing all form state, validation, and submission logic

## 📁 **File Structure**

```
src/components/students/
├── StudentForm.vue                    # Main form component (legacy location)
└── form/
    ├── StudentForm.vue               # New modular form component
    ├── useStudentForm.js             # Form business logic composable
    ├── StudentBasicInfo.vue          # Basic student information
    ├── StudentSchedule.vue           # Class schedule management
    ├── StudentClassServices.vue      # Service type selections
    ├── StudentProviders.vue          # Provider assignments
    ├── StudentDocuments.vue          # Document uploads
    ├── StudentAccommodations.vue     # Accommodations text
    ├── StudentFlags.vue              # Testing flags
    └── StudentForm.md                # Component documentation
```

## 🔄 **Data Flow**

### **State Management**
1. **Centralized State**: All form state is managed in the main `StudentForm.vue` component
2. **Props Down**: Data flows down to subcomponents via props and v-model
3. **Events Up**: Subcomponents emit events or update reactive objects
4. **Composable Logic**: `useStudentForm.js` handles all business logic, validation, and API calls

### **Form Initialization**
```javascript
// useStudentForm.js initializes form with default or existing data
const form = reactive({
  // Basic info
  firstName: student?.app?.studentData?.firstName || '',
  lastName: student?.app?.studentData?.lastName || '',
  grade: student?.app?.studentData?.grade || '',
  plan: student?.app?.studentData?.plan || 'None',
  
  // Dates
  reviewDate: student?.app?.dates?.reviewDate || '',
  reevalDate: student?.app?.dates?.reevalDate || '',
  meetingDate: student?.app?.dates?.meetingDate || '',
  
  // Schedule
  schedule: student?.app?.schedule?.periods || {},
  classServices: student?.app?.schedule?.classServices || [],
  
  // Providers
  providers: student?.app?.providers || {},
  
  // Files
  files: {
    bipFile: null,
    ataglanceFile: null
  },
  
  // Accommodations
  accommodations: student?.app?.accommodations || {},
  
  // Flags
  flags: student?.app?.flags || {}
})
```

## 🧩 **Component Details**

### **StudentBasicInfo.vue**
**Purpose**: Handles core student identification and basic information

```javascript
// Props
{
  firstName: String,
  lastName: String,
  ssid: String,
  grade: String,
  plan: String,
  reviewDate: String,
  reevalDate: String,
  meetingDate: String,
  caseManagerId: String,
  gradeOptions: Array,
  caseManagers: Array
}

// Features
- Student name and SSID validation
- Grade level selection
- Plan type (IEP, 504, RTI, None)
- Important dates with date pickers
- Case manager assignment dropdown
```

### **StudentSchedule.vue**
**Purpose**: Manages class period and teacher assignments

```javascript
// Props
{
  schedule: Object,        // Period -> Teacher ID mapping
  periods: Array,          // Available periods from app settings
  teacherList: Array,      // Available teachers
  userMap: Object          // User ID to name mapping
}

// Features
- Dynamic period selection based on app settings
- Teacher dropdown for each period
- Co-teaching support (future enhancement)
- Schedule validation
```

### **StudentClassServices.vue**
**Purpose**: Service type selections and class service management

```javascript
// Props
{
  classServices: Array,           // Selected services
  availableClassServices: Array  // Available service options
}

// Features
- Checkbox-based service selection
- Service categories (RSP, Co-teach, SDC, etc.)
- Dynamic service options from app settings
- Multi-select capability
```

### **StudentProviders.vue**
**Purpose**: Service provider assignments

```javascript
// Props
{
  providers: Object,              // Provider assignments
  serviceProviders: Array,        // Available providers by type
  customServiceProviders: Array, // Custom provider types
  userRoles: Object              // User role mapping
}

// Features
- Provider type dropdowns (Speech, OT, PT, etc.)
- Dynamic provider lists based on user roles
- Support for multiple provider types
- Custom provider type support
```

### **StudentDocuments.vue**
**Purpose**: Document upload and management

```javascript
// Props
{
  files: Object,           // File upload state
  onFileChange: Function,  // File change handler
  removeBipFile: Function, // BIP file removal
  removeAtaglanceFile: Function // At-A-Glance file removal
}

// Features
- BIP document upload
- At-A-Glance document upload
- File validation (type, size)
- Secure file handling
- File removal capability
```

### **StudentAccommodations.vue**
**Purpose**: Accommodation text management

```javascript
// Props
{
  accommodations: Object  // Instruction and assessment accommodations
}

// Features
- Instruction accommodations textarea
- Assessment accommodations textarea
- Character count indicators
- Auto-save functionality (future enhancement)
```

### **StudentFlags.vue**
**Purpose**: Testing flags and special indicators

```javascript
// Props
{
  flags: Object  // Flag state object
}

// Features
- Testing flag checkboxes (flag1, flag2)
- Special setting indicators
- Flag state management
- Conditional flag display
```

## ⚙️ **Business Logic Composable**

### **useStudentForm.js**
The composable handles all complex form logic:

```javascript
export function useStudentForm(props, emit) {
  // Form state
  const form = reactive({ /* form data */ })
  const isSaving = ref(false)
  
  // App settings
  const { appSettings, loadAppSettings } = useAppSettings()
  
  // Computed properties
  const periods = computed(() => appSettings.value?.periods || [])
  const gradeOptions = computed(() => appSettings.value?.gradeOptions || [])
  const availableClassServices = computed(() => appSettings.value?.classServices || [])
  
  // File handling
  const onFileChange = (event, fileType) => {
    // Handle file upload logic
  }
  
  // Form validation
  const validateForm = () => {
    // Validation logic
  }
  
  // Form submission
  const handleSubmit = async (event) => {
    // Save form data to Firestore
  }
  
  return {
    form,
    isSaving,
    appSettings,
    periods,
    gradeOptions,
    availableClassServices,
    onFileChange,
    validateForm,
    handleSubmit
  }
}
```

## 🔄 **Form Submission Flow**

1. **Validation**: Form data is validated for required fields and data integrity
2. **Data Transformation**: Form data is transformed into the proper Firestore document structure
3. **File Upload**: Documents are uploaded to Firebase Storage with secure URLs
4. **Database Save**: Student document is saved/updated in Firestore
5. **Success Handling**: Success message and form reset/close

### **Data Structure Mapping**
```javascript
// Form data -> Firestore document structure
const studentDocument = {
  id: studentId || generateId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  
  app: {
    studentData: {
      firstName: form.firstName,
      lastName: form.lastName,
      ssid: form.ssid,
      grade: form.grade,
      plan: form.plan,
      caseManagerId: form.caseManagerId
    },
    dates: {
      reviewDate: form.reviewDate,
      reevalDate: form.reevalDate,
      meetingDate: form.meetingDate
    },
    schedule: {
      periods: form.schedule,
      classServices: form.classServices
    },
    providers: form.providers,
    accommodations: form.accommodations,
    flags: form.flags,
    documents: {
      bipPdfUrl: uploadedBipUrl,
      ataglancePdfUrl: uploadedAtaglanceUrl
    }
  }
}
```

## 🔒 **Security Features**

### **Data Validation**
- Required field validation
- Data type checking
- SSID uniqueness validation
- File type and size validation

### **Access Control**
- Role-based form access
- Field-level permissions
- Document upload restrictions

### **Data Protection**
- Sensitive data encryption before storage
- Secure file upload to Firebase Storage
- FERPA compliant data handling

## 🧪 **Testing Strategy**

### **Unit Tests**
- Individual component testing
- Composable logic testing
- Validation function testing

### **Integration Tests**
- Form submission flow
- File upload process
- Data transformation accuracy

### **User Acceptance Tests**
- Role-based access testing
- Form usability testing
- Data integrity verification

## 📊 **Benefits of Modular Architecture**

### **Maintainability**
- **Separation of Concerns**: Each component has a single responsibility
- **Easier Debugging**: Issues can be isolated to specific components
- **Code Reusability**: Components can be reused in other forms

### **Development Experience**
- **Parallel Development**: Multiple developers can work on different sections
- **Testing**: Each component can be tested independently
- **Documentation**: Clear component boundaries make documentation easier

### **Performance**
- **Lazy Loading**: Components can be loaded on demand
- **Optimized Rendering**: Only changed sections re-render
- **Memory Efficiency**: Unused components can be garbage collected

## 🔧 **Usage Examples**

### **Adding New Fields**
```javascript
// 1. Add to form state in useStudentForm.js
const form = reactive({
  // ... existing fields
  newField: ''
})

// 2. Add to appropriate component or create new one
// StudentBasicInfo.vue (if basic info field)
<input v-model="newField" />

// 3. Update validation and submission logic
const validateForm = () => {
  if (!form.newField) {
    errors.push('New field is required')
  }
}
```

### **Extending Functionality**
```javascript
// Add new composable for complex logic
import { useNewFeature } from '@/composables/useNewFeature'

export function useStudentForm(props, emit) {
  // ... existing logic
  
  const { newFeatureData, handleNewFeature } = useNewFeature()
  
  return {
    // ... existing returns
    newFeatureData,
    handleNewFeature
  }
}
```

## 📅 **Migration Notes**

### **From Legacy Form**
The original monolithic `StudentForm.vue` has been replaced with the modular architecture. Key changes:

1. **State Management**: Moved from component data to composable
2. **Component Structure**: Split into focused subcomponents
3. **Business Logic**: Extracted to `useStudentForm.js`
4. **File Organization**: Organized in `form/` subdirectory

### **Backward Compatibility**
- Form props and events remain the same
- Data structure is unchanged
- Existing integrations continue to work

---

**Last Updated**: July 2025  
**Architecture Version**: 2.0 (Modular)  
**Components**: 8 subcomponents + 1 composable 