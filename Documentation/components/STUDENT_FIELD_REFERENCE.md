# STUDENT FIELD REFERENCE GUIDE

## OVERVIEW
This document maps the field structures and naming conventions used across:
- **Aeries Import**: CSV field mapping to Firestore
- **SEIS Import**: CSV field mapping to Firestore  
- **App Form/Table**: Direct Firestore field names
- **Data Hierarchy**: Priority order for field resolution

## DATA HIERARCHY (Priority Order)
1. **student.overrides[field]** - App data (highest priority)
2. **student.aeries[field]** - Aeries import data
3. **student.seis[field]** - SEIS import data  
4. **student[field]** - Top-level field (lowest priority)

## AERIES IMPORT FIELD MAPPING

### CSV Field → Firestore Field (in student.aeries.*)
```
SSID → stateId
StudentNumber → localId
FirstName → firstName
LastName → lastName
Grade → grade
SchoolCode → schoolCode
SchoolName → schoolName

// Program flags (nested under programs.*)
IEP → programs.specialEducation
504 → programs.plan504
ELL → programs.ell

// Medical info (nested under medical.*)
MedicalNotes → medical.notes
Vision → medical.vision
Hearing → medical.hearing

// Test scores (nested under testScores.*)
CAASPP → testScores.CAASPP
ELPAC → testScores.ELPAC

// Dates
ReviewDate → reviewDate
ReevalDate → reevalDate
MeetingDate → meetingDate

// Accommodations
InstructionAccommodations → instruction
AssessmentAccommodations → assessment

// Other fields
DOB → dob
Gender → gender
Ethnicity → ethnicity
Address → address
City → city
State → state
ZipCode → zipCode
Phone → phone
ParentName → parentName
ParentPhone → parentPhone
ParentEmail → parentEmail
CaseManager → caseManager
Disability → disability
ServiceMinutes → serviceMinutes
Goals → goals
Notes → notes
Plan → plan
SpeechProvider → speechProvider
MHProvider → mhProvider
OTProvider → otProvider
Flag1 → flag1
Flag2 → flag2
```

## SEIS IMPORT FIELD MAPPING

### CSV Field → Firestore Field (direct to student.*)
```
SSID → ssid
FirstName → firstName
LastName → lastName
MiddleName → middleName
Grade → grade
DOB → dob
Gender → gender
Ethnicity → ethnicity
School → school
Address → address
City → city
State → state
ZipCode → zipCode
Phone → phone
ParentName → parentName
ParentPhone → parentPhone
ParentEmail → parentEmail
ELL → ell
504 → 504
IEP → iep
CaseManager → caseManager
Disability → disability
ServiceMinutes → serviceMinutes
Goals → goals
Notes → notes
Plan → plan
ReviewDate → reviewDate
ReevalDate → reevalDate
MeetingDate → meetingDate
SpeechProvider → speechProvider
MHProvider → mhProvider
OTProvider → otProvider
InstructionAccommodations → instruction
AssessmentAccommodations → assessment
Flag1 → flag1
Flag2 → flag2
IEP_Services → iepServices (array)
```

## APP FORM/TABLE FIELDS (Direct Firestore)

### Core Student Info
```
firstName (string)
lastName (string)
grade (string) - from appSettings.grades
plan (string) - "IEP" or "504"
reviewDate (date string)
reevalDate (date string)
meetingDate (date string)
caseManagerId (string) - references user ID (camelCase, preferred)
```

### Schedule & Services
```
schedule (object) - { "1": "teacher_id", "2": "teacher_id", ... }
services (array) - ["Co-teach:English", "RSP:Math", ...]
speechId (string) - references user ID
otId (string) - references user ID  
mhId (string) - references user ID
ptId (string) - references user ID
scId (string) - references user ID
trId (string) - references user ID
audId (string) - references user ID
viId (string) - references user ID
atId (string) - references user ID
dhhId (string) - references user ID
omId (string) - references user ID
bisId (string) - references user ID
hnId (string) - references user ID
swId (string) - references user ID
```

### Accommodations & Flags
```
instruction (string) - instruction accommodations
assessment (string) - assessment accommodations
flag1 (boolean) - separate setting
flag2 (boolean) - preferential seating
```

### Documents
```
bipPdfUrl (string) - Firebase Storage URL
ataglancePdfUrl (string) - Firebase Storage URL
```

**File Management:**
- Files are stored in Firebase Storage under `students/{studentId}/bip.pdf` and `students/{studentId}/ataglance.pdf`
- Files can be uploaded via file input in the student form
- Files can be removed via "🗑️ Remove" button in edit mode
- File removal is tracked in form state (`removeBipFile`, `removeAtaglanceFile`)
- Actual file deletion from Firebase Storage occurs on form save

### Admin Overrides
```
overrides.numPeriods (number) - override default periods
```

### Metadata
```
createdAt (timestamp)
updatedAt (timestamp)
```

## USER FIELDS (for reference)

### Core User Info
```
id (string) - Firestore document ID
name (string)
email (string)
role (string) - "admin", "teacher", "case_manager", etc.
provider (string) - from appSettings.serviceProviders
```

## APP SETTINGS FIELDS (for reference)

### Dynamic Configuration
```
grades (array) - ["7", "8", "9", ...]
periods (array) - ["1", "2", "3", "4", "5", "6"]
classServices (array) - service categories for classes
serviceProviders (array) - provider abbreviations
customServiceProviders (array) - custom provider names
```

## PROVIDER FIELD SETUP & DISPLAY

### How Provider Fields Work

The provider system uses a **provider field** in user records instead of parsing job titles. This provides more reliable and admin-configurable service provider assignment.

### Data Flow

```
1. App Settings → serviceProviders array (e.g., ["SLP", "OT", "MH", "PT"])
2. User Creation → provider field set to abbreviation (e.g., "SLP", "OT")
3. useUsers Composable → organizes users by provider field
4. Student Form → dropdowns populated by provider type
```

### User Organization (useUsers.js)

Users are organized by their `provider` field:

```javascript
const userRoles = computed(() => {
  return {
    teachers: userList.value.filter(u => ["teacher", "case_manager", "sped_chair"].includes(u.role)),
    caseManagers: userList.value.filter(u => ["case_manager", "sped_chair", "administrator_504_CM"].includes(u.role)),
    speech: userList.value.filter(u => u.provider === 'SLP'),
    ot: userList.value.filter(u => u.provider === 'OT'),
    mh: userList.value.filter(u => u.provider === 'MH'),
    pt: userList.value.filter(u => u.provider === 'PT'),
    sc: userList.value.filter(u => u.provider === 'SC'),
    tr: userList.value.filter(u => u.provider === 'TR'),
    aud: userList.value.filter(u => u.provider === 'AUD'),
    vi: userList.value.filter(u => u.provider === 'VI'),
    at: userList.value.filter(u => u.provider === 'AT'),
    dhh: userList.value.filter(u => u.provider === 'DHH'),
    om: userList.value.filter(u => u.provider === 'O&M'),
    bis: userList.value.filter(u => u.provider === 'BIS'),
    hn: userList.value.filter(u => u.provider === 'HN'),
    sw: userList.value.filter(u => u.provider === 'SW')
  }
})
```

### Provider Field Mapping (StudentForm.vue)

Each provider abbreviation maps to a specific form field:

```javascript
const providerFieldMap = {
  SLP: 'speechId',
  OT: 'otId',
  MH: 'mhId',
  PT: 'ptId',
  SC: 'scId',
  TR: 'trId',
  AUD: 'audId',
  VI: 'viId',
  AT: 'atId',
  DHH: 'dhhId',
  'O&M': 'omId',
  BIS: 'bisId',
  HN: 'hnId',
  SW: 'swId'
}
```

### Form Display Logic

1. **Provider List**: Populated from `appSettings.value.serviceProviders`
2. **User Filtering**: `getProviderUsers(abbr)` gets users with matching provider
3. **Dropdown Display**: Only shows if users exist for that provider type
4. **Field Assignment**: Selected user ID saved to corresponding `*Id` field

### User Management Integration

- **UserAddForm**: Provider dropdown populated from app settings
- **UserTable**: Provider field editable in user management
- **StudentForm**: Service provider dropdowns show only available users

### Benefits

- **Reliable**: No text parsing of job titles
- **Admin Configurable**: Service providers managed through App Settings
- **Consistent**: Explicit provider assignments
- **Extensible**: Easy to add new provider types

## FIELD RESOLUTION EXAMPLES

### Example 1: Student Name
```javascript
// Priority order:
student.overrides.firstName → student.overrides.lastName
student.aeries.firstName → student.aeries.lastName  
student.seis.firstName → student.seis.lastName
student.firstName → student.lastName
```

### Example 2: Grade
```javascript
// Priority order:
student.overrides.grade
student.aeries.grade
student.seis.grade
student.grade
```

### Example 3: Program Flags
```javascript
// Aeries nested structure:
student.aeries.programs.specialEducation
student.aeries.programs.plan504
student.aeries.programs.ell

// SEIS flat structure:
student.seis.iep
student.seis.504
student.seis.ell
```

### Example 4: Service Provider Assignment
```javascript
// User record:
{
  id: "user123",
  name: "Jane Smith",
  email: "jane@school.edu",
  role: "service_provider",
  provider: "SLP"  // ← This determines service provider type
}

// Student form field:
form.speechId = "user123"  // ← References user with provider: "SLP"

// Form dropdown population:
const speechUsers = userRoles.value.speech  // ← Users with provider: "SLP"
```

### Example 5: File Upload and Removal
```javascript
// File upload process:
const file = event.target.files[0]
const studentId = "student123"
const filePath = `students/${studentId}/bip.pdf`
const fileRef = storageRef(storage, filePath)
const snapshot = await uploadBytes(fileRef, file)
const downloadUrl = await getDownloadURL(snapshot.ref)

// File removal process:
form.removeBipFile = true  // ← Mark for removal
// On form save:
if (form.removeBipFile && student.bipPdfUrl) {
  await deleteFile(student.bipPdfUrl)  // ← Delete from Firebase Storage
  bipPdfUrl = null  // ← Clear URL in Firestore
}

// Form state tracking:
{
  bipFile: null,              // ← New file to upload
  ataglanceFile: null,        // ← New file to upload
  removeBipFile: false,       // ← Mark BIP for removal
  removeAtaglanceFile: false  // ← Mark At-A-Glance for removal
}
```

## IMPORTANT NOTES

1. **Aeries Data**: Stored under `student.aeries.*` with nested objects for programs, medical, testScores
2. **SEIS Data**: Stored directly under `student.*` with camelCase naming
3. **App Data**: Stored directly under `student.*` with camelCase naming
4. **Provider Fields**: Use camelCase with Id suffix (e.g., `speechId`, `otId`, `mhId`)
5. **Service Arrays**: Use colon format for class services (e.g., "Co-teach:English")
6. **Schedule Object**: Period numbers as keys, teacher IDs as values
7. **Flags**: Boolean values for flag1/flag2, or array for complex flags
8. **Provider Assignment**: Users assigned provider type via `provider` field, not job title parsing
9. **File Management**: Files stored in Firebase Storage, URLs stored in Firestore, removal tracked in form state
10. **Case Manager Field**: Use `caseManagerId` (camelCase) for new data, supports fallback to `casemanager_id` (snake_case) for backward compatibility

## COMMON MISTAKES TO AVOID

1. **Field Name Inconsistency**: All systems now use camelCase for consistency
2. **Nested vs Flat**: Aeries has nested objects, SEIS/App are flat
3. **Provider References**: Always use camelCase with Id suffix for user references
4. **Service Format**: Class services must include colon separator
5. **Date Format**: Use ISO date strings for consistency
6. **Provider Assignment**: Use `provider` field, not `title` field for service provider organization
7. **Dropdown Population**: Service provider dropdowns only show if users exist for that provider type
8. **File Removal**: File deletion from Firebase Storage only occurs on form save, not immediately on remove button click 