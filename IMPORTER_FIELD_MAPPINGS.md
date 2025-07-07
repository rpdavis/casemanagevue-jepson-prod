# Importer Field Mappings

This document shows the field mappings that the Aeries and SEIS importers are looking for in CSV files.

## Aeries Import Field Mappings (OneRoster Standard)

The Aeries importer now uses OneRoster standard field names and maps them to the database structure:

```
CSV Field Name → Database Field Path
====================================

OneRoster Standard Fields:
├── sourcedId → stateId
├── givenName → firstName
├── familyName → lastName
├── middleName → middleName
├── email → email
├── phone → phone
├── dateOfBirth → dob
├── sex → gender
├── grade → grade
├── school → school

Legacy/Alternative Field Names (also supported):
├── SSID → stateId
├── StateStudentID → stateId
├── StudentNumber → localId
├── FirstName → firstName
├── LastName → lastName
├── MiddleName → middleName
├── Email → email
├── Phone → phone
├── DOB → dob
├── Gender → gender
├── Grade → grade
├── School → school
├── SchoolCode → schoolCode
├── SchoolName → schoolName

OneRoster Special Education Fields:
├── specialEducation → programs.specialEducation
├── iep → programs.specialEducation
├── plan504 → programs.plan504
├── disabilities → disabilities
├── ell → programs.ell

Medical Information:
├── MedicalNotes → medical.notes
├── Vision → medical.vision
├── Hearing → medical.hearing

Test Scores:
├── CAASPP → testScores.CAASPP
├── ELPAC → testScores.ELPAC


Demographic Information:
├── DOB → dob
├── Gender → gender
├── Ethnicity → ethnicity

Address Information:
├── Address → address
├── City → city
├── State → state
├── ZipCode → zipCode

Contact Information:
├── Phone → phone
├── ParentName → parentName
├── ParentPhone → parentPhone
├── ParentEmail → parentEmail

Service Providers:
├── CaseManager → caseManager
├── SpeechProvider → speechProvider
├── MHProvider → mhProvider
├── OTProvider → otProvider

Other Fields:
├── Disability → disability
├── ServiceMinutes → serviceMinutes
├── Goals → goals
├── Notes → notes
├── Plan → plan
```

## SEIS Import Field Mappings

The SEIS importer looks for these CSV field names and maps them to the database structure:

```
CSV Field Name → Database Field Path
====================================

Core Student Fields:
├── SSID → ssid
├── FirstName → firstName
├── LastName → lastName
├── MiddleName → middleName
├── Grade → grade
├── DOB → dob
├── Gender → gender
├── Ethnicity → ethnicity
├── School → school

Address Information:
├── Address → address
├── City → city
├── State → state
├── ZipCode → zipCode

Contact Information:
├── Phone → phone
├── ParentName → parentName
├── ParentPhone → parentPhone
├── ParentEmail → parentEmail

Program Flags:
├── ELL → ell
├── 504 → 504
├── IEP → iep

Service Information:
├── CaseManager → caseManager
├── Disability → disability
├── ServiceMinutes → serviceMinutes
├── Goals → goals
├── Notes → notes
├── Plan → plan
├── IEP_Services → iepServices (special handling: splits on semicolons)

Important Dates:
├── ReviewDate → reviewDate
├── ReevalDate → reevalDate
├── MeetingDate → meetingDate

Service Providers:
├── SpeechProvider → speechProvider
├── MHProvider → mhProvider
├── OTProvider → otProvider

Accommodations (splits on semicolons):
├── ProgramAccommodations → programAccommodations
├── Accommodations → programAccommodations

Other Fields:
*Note: No flag fields are included as they are not part of the OneRoster standard*
```

## Database Structure

Both importers create nested objects in the database:

### Aeries Data Structure:
```
students/{docId}/
├── aeries/
│   ├── studentId
│   ├── stateId
│   ├── localId
│   ├── programs/
│   │   ├── specialEducation
│   │   ├── plan504
│   │   └── ell
│   ├── medical/
│   │   ├── notes
│   │   ├── vision
│   │   └── hearing
│   ├── testScores/
│   │   ├── CAASPP
│   │   └── ELPAC
│   ├── lastAeriesImport
│   └── [other mapped fields]
```

### SEIS Data Structure:
```
students/{docId}/
├── seis/
│   ├── ssid
│   ├── iepServices (array)
│   ├── lastSeisImport
│   └── [other mapped fields]
```

## Student Identification

Both importers use SSID as the primary identifier:
- Aeries: Looks for `sourcedId` (OneRoster standard), `SSID`, `ssid`, `StateStudentID`, or `stateStudentId`
- SEIS: Looks for `SSID` or `ssid`

The importers will:
1. Look for existing students by SSID in `app.studentData.ssid`
2. Update existing students with new import data
3. Create new students if no match is found

## Special Handling

- **Program Flags**: Aeries converts "Yes", "true", "1" to boolean values
- **IEP_Services**: SEIS splits this field on semicolons to create an array
- **ProgramAccommodations**: SEIS splits this field on semicolons to create an array
- **Import Timestamps**: Both add `lastAeriesImport` or `lastSeisImport` timestamps
- **Fallback Mapping**: If a field isn't in the mapping, it uses `toCamelCase()` conversion 