# DATABASE FIELD STRUCTURE REFERENCE

## OVERVIEW
This document provides the complete field structure for student data in the Firestore database, including all three data sources: App form data, Aeries import, and SEIS import.

## STUDENT DOCUMENT STRUCTURE

### Top-Level Fields
```javascript
{
  id: "firebase_doc_id",           // Firestore document ID (auto-generated)
  ssid: "123456789",              // State Student ID (top-level for reference)
  createdAt: timestamp,           // Document creation timestamp
  updatedAt: timestamp,           // Last update timestamp
  
  // Data sources (nested objects)
  app: { /* App form data */ },
  aeries: { /* Aeries import data */ },
  seis: { /* SEIS import data */ }
}
```

## APP DATA STRUCTURE

### app (map)
```javascript
{
  // Student basic information
  studentData: {
    firstName: "Jane",                    // Student first name
    lastName: "Doe",                   // Student last name
    grade: "7",                         // Current grade level
    plan: "IEP",                        // Plan type: "IEP", "504", "RTI", "None"
    caseManagerId: "user049",           // Firebase user ID of case manager
    ssid: "1231241242"                  // State Student ID
  },

  // Important dates
  dates: {
    reviewDate: "2025-07-03",           // IEP review date
    reevalDate: "2025-07-15",           // Re-evaluation date
    meetingDate: "2025-07-09"           // Meeting date
  },

  // Class schedule
  schedule: {
    periods: {                          // Class schedule by period
      1: "user003",                     // Firebase user ID of teacher for period 1
      2: "user006",                     // Firebase user ID of teacher for period 2
      3: "user003",                     // Firebase user ID of teacher for period 3
      4: "user007",                     // Firebase user ID of teacher for period 4
      5: "user009",                     // Firebase user ID of teacher for period 5
      6: "user011",                     // Firebase user ID of teacher for period 6
      SH: "user011"                     // Firebase user ID of teacher for SH period
    },
    classServices: [                    // Array of class service types
      "SDC: English",
      "SDC: Math", 
      "SDC: History",
      "SDC: Science",
      "Co-teach: English",
      "Co-teach: Math",
      "RSP: English",
      "RSP: Math",
      "Directed Studies: Directed Studies",
      "FA: FA"
    ]
  },

  // Service providers
  providers: {
    speechId: "",                       // Firebase user ID of speech provider
    otId: "",                           // Firebase user ID of OT provider
    ptId: "",                           // Firebase user ID of PT provider
    atId: "",                           // Firebase user ID of AT provider
    audId: "",                          // Firebase user ID of audiologist
    bisId: "",                          // Firebase user ID of BIS provider
    dhhId: "",                          // Firebase user ID of DHH provider
    hnId: "",                           // Firebase user ID of HN provider
    mhId: "",                           // Firebase user ID of MH provider
    omId: "",                           // Firebase user ID of OM provider
    scId: "",                           // Firebase user ID of SC provider
    swId: "",                           // Firebase user ID of SW provider
    trId: "",                           // Firebase user ID of TR provider
    viId: ""                            // Firebase user ID of VI provider
  },

  // Student flags
  flags: {
    flag1: true,                        // Boolean flag 1
    flag2: true                         // Boolean flag 2
  },

  // Documents
  documents: {
    bipPdfUrl: "https://firebasestorage.googleapis.com/v0/b/casemangervue.firebasestorage.app/o/students%2Ftemp%2Fbip.pdf?alt=media&token=0eef4c95-5115-4988-8d37-c49b2e685206",
    ataglancePdfUrl: "https://firebasestorage.googleapis.com/v0/b/casemangervue.firebasestorage.app/o/students%2Ftemp%2Fataglance.pdf?alt=media&token=bf986204-8fdc-4435-9733-662b6a20bfc0"
  },

  // Additional fields
  accommodations: {},                   // Map for accommodations
  assessment: "—asdfasdf",              // Assessment notes (string)
  instruction: "—adfasdfasf"           // Instruction notes (string)
}
```

## AERIES DATA STRUCTURE

### aeries (imported from Aeries CSV/API)
```javascript
{
  // Basic student info
  firstName: "John",
  lastName: "Doe",
  grade: "9",
  birthDate: "2005-03-15",
  gender: "M",
  
  // Contact info
  address: "123 Main St",
  city: "Anytown",
  state: "CA",
  zipCode: "90210",
  phone: "(555) 123-4567",
  email: "john.doe@student.edu",
  
  // Parent/Guardian info
  parentName: "Jane Doe",
  parentPhone: "(555) 987-6543",
  parentEmail: "jane.doe@email.com",
  
  // Academic info
 
  attendanceRate: "95.5",
  
  // Schedule data (nested objects)
  schedule: {
    periods: {                          // Class schedule by period
      1: "user007",                     // Teacher ID for period 1
      2: "user008",                     // Teacher ID for period 2
      3: "user009",                     // Teacher ID for period 3
      4: "user010",                     // Teacher ID for period 4
      5: "user011",                     // Teacher ID for period 5
      6: "user012",                     // Teacher ID for period 6
      SH: "user013"                     // Teacher ID for SH period
    }
  }
}
```

## SEIS DATA STRUCTURE

### seis (imported from SEIS CSV/API)
```javascript
{
  // Basic student info
  firstName: "John",
  lastName: "Doe",
  grade: "9",
  birthDate: "2005-03-15",
  gender: "M",
  
  // Special education info
  eligibilityCategory: "Specific Learning Disability",
  primaryDisability: "Dyslexia",
  secondaryDisability: "ADHD",
  
  // IEP info
  iepStartDate: "2023-09-01",
  iepEndDate: "2024-06-30",
  annualReviewDate: "2024-03-15",
  triennialDate: "2024-06-20",
  
  // Services and accommodations
  services: [
    "Speech and Language Therapy",
    "Occupational Therapy",
    "Resource Specialist Program"
  ],
 
  
  // Goals and objectives
  goals: [
    "Improve reading comprehension by 20%",
    "Develop organizational skills",
    "Increase attention span during class"
  ],
}

## USER DOCUMENT STRUCTURE

### users collection
```javascript
{
  
  aeriesId: "124123",             // Aeries system ID (for import mapping)
  createdAt: timestamp,
  email: "user@school.edu",       // Email address
  name: "John Smith",             // Display name
  provider: "OT",                 // Service provider type (if applicable)
  role: "service_provider"        // User role
}
```

## FIELD MAPPING NOTES

### User ID References
- **App data** uses Firebase user IDs for all provider and teacher references (e.g., "user003")
- **Aeries schedule** uses Firebase user IDs directly in `aeries.schedule.periods` (e.g., "user007")
- **Import process** should resolve Aeries teacher IDs to Firebase user IDs using the `aeriesId` field in users collection

### Data Source Priority
1. **App data** - Manual form entries (highest priority)
2. **Aeries data** - Imported from Aeries system
3. **SEIS data** - Imported from SEIS system

### Import Process
- **Aeries import**: Maps CSV fields to `aeries` object, resolves teacher IDs
- **SEIS import**: Maps CSV fields to `seis` object
- **User import**: Creates user documents with `aeriesId` for mapping

## VALIDATION RULES

### Required Fields
- `ssid` (top-level)
- `app.studentData.firstName`
- `app.studentData.lastName`
- `app.studentData.grade`

### Field Types
- **Dates**: ISO date strings (YYYY-MM-DD)
- **IDs**: Firebase user IDs (strings)
- **Arrays**: Service lists, accommodations, goals
- **Objects**: Schedule periods, assessment scores

### Constraints
- SSID must be unique across all students
- User IDs must reference existing users in users collection
- Grade must be valid (K-12 or numeric 0-12)
- Plan types must be from predefined list 