# Student Bulk Import Guide

## Overview
The Student Bulk Importer allows you to import multiple students from a CSV file into the CaseManageVue system. The importer maps CSV fields to the app's database structure and validates data before importing.

## CSV Template
Use the `bulk_students_template.csv` file as a starting point. This template includes all available fields that can be imported.

## Required Fields
These fields must be present and have values for successful import:
- **SSID**: State Student ID (9-10 digits)
- **FirstName**: Student's first name
- **LastName**: Student's last name  
- **Grade**: Grade level (K, 1-12)

## Field Categories

### Basic Student Information
| CSV Column | Database Field | Description | Example |
|------------|----------------|-------------|---------|
| SSID | app.studentData.ssid | State Student ID | 123456789 |
| FirstName | app.studentData.firstName | First name | John |
| LastName | app.studentData.lastName | Last name | Doe |
| Grade | app.studentData.grade | Grade level | 9 |
| Plan | app.studentData.plan | Plan type | IEP, 504, RTI, None |
| CaseManagerId | app.studentData.caseManagerId | Case manager user ID | user003 |

### Important Dates
| CSV Column | Database Field | Format | Example |
|------------|----------------|--------|---------|
| ReviewDate | app.dates.reviewDate | YYYY-MM-DD | 2025-07-15 |
| ReevalDate | app.dates.reevalDate | YYYY-MM-DD | 2025-12-15 |
| MeetingDate | app.dates.meetingDate | YYYY-MM-DD | 2025-07-10 |

### Class Schedule (Teacher IDs)
| CSV Column | Database Field | Description |
|------------|----------------|-------------|
| Period1Teacher | app.schedule.periods.1 | Period 1 teacher user ID |
| Period2Teacher | app.schedule.periods.2 | Period 2 teacher user ID |
| Period3Teacher | app.schedule.periods.3 | Period 3 teacher user ID |
| Period4Teacher | app.schedule.periods.4 | Period 4 teacher user ID |
| Period5Teacher | app.schedule.periods.5 | Period 5 teacher user ID |
| Period6Teacher | app.schedule.periods.6 | Period 6 teacher user ID |
| SHTeacher | app.schedule.periods.SH | Study Hall teacher user ID |

### Class Services
| CSV Column | Database Field | Format | Example |
|------------|----------------|--------|---------|
| ClassServices | app.schedule.classServices | Comma-separated list | "SDC: English,RSP: Math,Co-teach: Science" |

### Service Providers (User IDs)
| CSV Column | Database Field | Description |
|------------|----------------|-------------|
| SpeechProvider | app.providers.speechId | Speech therapist |
| OTProvider | app.providers.otId | Occupational therapist |
| PTProvider | app.providers.ptId | Physical therapist |
| ATProvider | app.providers.atId | Assistive technology |
| Audiologist | app.providers.audId | Audiologist |
| BISProvider | app.providers.bisId | Behavior intervention |
| DHHProvider | app.providers.dhhId | Deaf/hard of hearing |
| HNProvider | app.providers.hnId | Health nurse |
| MHProvider | app.providers.mhId | Mental health |
| OMProvider | app.providers.omId | Orientation & mobility |
| SCProvider | app.providers.scId | School counselor |
| SWProvider | app.providers.swId | Social worker |
| TRProvider | app.providers.trId | Transition specialist |
| VIProvider | app.providers.viId | Vision specialist |

### Student Flags
| CSV Column | Database Field | Format | Description |
|------------|----------------|--------|-------------|
| Flag1 | app.flags.flag1 | true/false | Boolean flag 1 |
| Flag2 | app.flags.flag2 | true/false | Boolean flag 2 |

### Notes & Accommodations
| CSV Column | Database Field | Description |
|------------|----------------|-------------|
| Assessment | app.assessment | Assessment notes |
| Instruction | app.instruction | Instruction notes |

### Contact Information (Aeries Data)
| CSV Column | Database Field | Format | Example |
|------------|----------------|--------|---------|
| Email | aeries.email | Email address | john.doe@school.edu |
| Phone | aeries.phone | Phone number | 555-0123 |
| BirthDate | aeries.birthDate | YYYY-MM-DD | 2008-03-15 |
| Gender | aeries.gender | M/F | M |
| Address | aeries.address | Street address | 123 Main St |
| City | aeries.city | City name | Anytown |
| State | aeries.state | State code | CA |
| ZipCode | aeries.zipCode | ZIP code | 90210 |
| ParentName | aeries.parentName | Parent/guardian name | Jane Doe |
| ParentPhone | aeries.parentPhone | Parent phone | 555-0456 |
| ParentEmail | aeries.parentEmail | Parent email | jane.doe@email.com |
| AttendanceRate | aeries.attendanceRate | Percentage | 95.2 |

## User ID Mapping

### Teacher and Provider IDs
The system will automatically attempt to map teacher and provider values to Firebase user IDs by searching for:
1. Exact user ID match (e.g., "user003")
2. User name match
3. Email address match
4. Aeries ID match

### Examples
```csv
# These will all map to the same user if they exist:
Period1Teacher: user007
Period1Teacher: John Smith
Period1Teacher: john.smith@school.edu
Period1Teacher: 12345
```

## Data Validation

### SSID Format
- Must be 9-10 digits
- Must be unique across all students

### Grade Values
- Valid values: K, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

### Plan Types
- Valid values: IEP, 504, RTI, None

### Date Format
- All dates must be in YYYY-MM-DD format
- Invalid dates will be skipped

### Boolean Fields
- Flags accept: true/false, 1/0, yes/no, y/n

## Import Process

1. **Upload CSV**: Select your CSV file
2. **Map Fields**: Verify field mappings (auto-mapping available)
3. **Preview**: Review data and validation errors
4. **Import**: Choose to import valid records only or all records

## Error Handling

### Common Errors
- Missing required fields
- Invalid SSID format
- Invalid grade values
- Invalid plan types
- Duplicate SSID values

### Import Options
- **Valid Only**: Import only records without validation errors
- **All Records**: Attempt to import all records (may cause errors)
- **Update Existing**: Update students if SSID already exists

## Tips for Success

1. **Use the Template**: Start with `bulk_students_template.csv`
2. **Validate User IDs**: Ensure teacher and provider IDs exist in your system
3. **Check Dates**: Use proper YYYY-MM-DD format
4. **Review Preview**: Always review the preview before importing
5. **Start Small**: Test with a few records first

## Example CSV Row
```csv
123456789,John,Doe,9,IEP,user003,2025-07-15,2025-12-15,2025-07-10,user007,user008,user009,user010,user011,user012,user013,"SDC: English,RSP: Math",user020,user021,,,,,,,user025,,,,,,,true,false,Reading comprehension goals,Extra time for tests,john.doe@school.edu,555-0123,2008-03-15,M,123 Main St,Anytown,CA,90210,Jane Doe,555-0456,jane.doe@email.com,95.2
```

This creates a complete student record with:
- Basic info (John Doe, Grade 9, IEP)
- Case manager and dates
- Full 7-period schedule
- Class services
- Speech and MH providers
- Contact information
- Assessment notes 