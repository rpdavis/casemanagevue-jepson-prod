# TestingLinks Component

## Overview
The TestingLinks component provides Google Sheets integration for creating and managing testing data sheets. It allows administrators to create linked Google Sheets with student data and configure custom tabs for specific teachers.

## Features

### Main Sheet Creation
- **Create Linked Google Sheet**: Button to create a new Google Sheet with student data
- **Sheet Structure**: Automatically includes columns for:
  - First Name
  - Last Name
  - Grade
  - Case Manager
  - Assessment Accommodations
- **Unlink Sheet**: Button to remove the linked sheet connection

### Custom Tabs Configuration
- **Add Custom Tab**: Create up to 5 custom tabs with teacher-specific data
- **Teacher Selection**: Checkbox interface to select specific teachers
- **Tab Structure**: Custom tabs include additional columns:
  - Period (shows the class period for selected teachers)
  - Teacher (shows the teacher name for the period)
- **Student Filtering**: Only shows students who have the selected teachers in their schedule
- **Tab Management**: Delete custom tabs as needed

### Data Preview
- **Real-time Preview**: Shows filtered students for selected teachers before creating tabs
- **Schedule Integration**: Automatically detects and uses student schedule data from:
  - Direct schedule object (`student.schedule`)
  - Nested structure (`student.app.schedule.periods`)
  - Aeries structure (`student.aeries.schedule.periods`)

## Props

```javascript
{
  students: {
    type: Array,
    default: () => []
  },
  userMap: {
    type: Object,
    default: () => ({})
  }
}
```

## Usage

```vue
<TestingLinks 
  :students="students" 
  :userMap="userMap" 
/>
```

## Dependencies

- `useGoogleSheets` composable for Google Sheets API integration
- `getDisplayValue` utility for consistent data display
- Student and user data from parent components

## Google Sheets Integration

The component uses the `useGoogleSheets` composable which provides:

- **Sheet Creation**: Creates new Google Sheets with proper headers
- **Data Population**: Automatically populates sheets with student data
- **Tab Management**: Creates and deletes custom tabs
- **API Integration**: Handles Google Sheets API calls (currently simulated)

## Data Structure

### Student Schedule Detection
The component automatically detects student schedule data from multiple possible structures:

1. **Direct Schedule**: `student.schedule`
2. **Nested Structure**: `student.app.schedule.periods`
3. **Aeries Structure**: `student.aeries.schedule.periods`

### Teacher Mapping
- Maps teacher IDs from student schedules to user objects
- Displays teacher names in the format "First Initial. Last Name"
- Falls back to teacher ID if user not found

### Case Manager Mapping
- Extracts case manager ID from multiple possible field locations
- Maps to user name for display
- Falls back to ID if user not found

## Limitations

- Maximum of 5 custom tabs allowed
- Requires Google Sheets API integration (currently simulated)
- Teacher selection is required for custom tabs
- Only shows students with valid schedule data for selected teachers

## Future Enhancements

- Real Google Sheets API integration
- Sheet template customization
- Data refresh/sync capabilities
- Export to other formats
- Batch operations for multiple tabs 