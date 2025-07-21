# Teacher Feedback System - User Guide

## Overview

The Teacher Feedback system allows case managers to send Google Forms to teachers for collecting feedback about students. This system uses Firebase Cloud Functions to send emails and sync responses automatically.

## For Administrators

### Setting Up Forms

1. **Create Google Form Manually**
   - Go to [Google Forms](https://forms.google.com)
   - Create a new form with your desired questions
   - Customize the form title and description
   - Add questions like:
     - Student performance in class
     - Behavioral observations
     - Accommodation effectiveness
     - Suggestions for improvement

2. **Link Form to Google Sheets**
   - In your form, go to "Responses" tab
   - Click "Create Spreadsheet" 
   - This creates a linked Google Sheet for responses

3. **Add Form to System**
   - Go to Admin Panel > Teacher Feedback
   - Click "Add Form"
   - Enter form title and description
   - Paste the Google Form URL (viewform link)
   - Paste the Google Sheets URL (spreadsheet link)
   - Click "Add Form"

### Managing Forms

- **View Forms**: See all added forms with response counts
- **Sync Responses**: Manually sync responses from Google Sheets
- **Edit Forms**: Click edit to modify the Google Form directly
- **Delete Forms**: Remove forms from the system

## For Case Managers

### Sending Feedback Forms

1. **From Student Table**
   - Find the student in the Students view
   - Click the 📝 button in the Actions column
   - This opens the Teacher Feedback Dialog

2. **Select Form and Teachers**
   - Choose which feedback form to send
   - Select teachers from the student's schedule
   - Choose send method:
     - **Copy Link**: Copies form URL to clipboard
     - **Send Email**: Automatically emails teachers

3. **Email Sending**
   - Uses Firebase Cloud Functions to send emails
   - Includes student information and form link
   - Tracks sent emails in the system
   - Falls back to mailto if cloud sending fails

### Viewing Responses

- Responses are automatically synced from Google Sheets
- View response counts in the Admin Panel
- Click "View Sheet" to see responses in Google Sheets
- Responses are also stored in Firestore for reporting

## System Features

### Automatic Email Sending

- **Professional Emails**: Automatically formatted with student info
- **Teacher Context**: Includes student name, grade, and case manager
- **Reliable Delivery**: Uses Gmail API through Cloud Functions
- **Fallback Support**: Opens email client if cloud sending fails

### Response Syncing

- **Auto-Sync**: Responses sync every 30 minutes automatically
- **Manual Sync**: Click sync button for immediate updates
- **Real-time Data**: Responses appear in Firestore for reporting
- **No Duplicates**: Smart syncing prevents duplicate entries

### Security & Privacy

- **Role-Based Access**: Only case managers and admins can send forms
- **Secure Storage**: All data encrypted in Firestore
- **Audit Trail**: Complete log of sent forms and responses
- **FERPA Compliant**: Student data handled according to privacy laws

## Workflow Example

### Typical Case Manager Workflow

1. **Quarterly Review Process**
   ```
   1. Open Students view
   2. Filter students by case load
   3. For each student:
      - Click 📝 Teacher Feedback button
      - Select "Quarterly Review" form
      - Select all teachers
      - Click "Send Email"
   4. Monitor responses in Admin Panel
   5. Review responses in Google Sheets
   ```

2. **IEP Meeting Preparation**
   ```
   1. Two weeks before IEP meeting
   2. Send "IEP Input" form to teachers
   3. Set reminder to follow up
   4. Sync responses before meeting
   5. Include teacher feedback in IEP discussion
   ```

### Form Templates

**Academic Performance Form:**
- Current grade in class
- Assignment completion rate
- Test/quiz performance
- Areas of strength
- Areas needing support

**Behavioral Observation Form:**
- Classroom behavior
- Peer interactions
- Following directions
- Attention and focus
- Coping strategies effectiveness

**Accommodation Review Form:**
- Which accommodations are being used
- Effectiveness of each accommodation
- Suggestions for modifications
- Additional support needed

## Troubleshooting

### Common Issues

**Forms not sending:**
- Check internet connection
- Verify teacher email addresses
- Try using "Copy Link" method
- Contact admin if Cloud Functions are down

**No responses showing:**
- Check if teachers have submitted responses
- Try manual sync in Admin Panel
- Verify Google Sheets permissions
- Contact admin if auto-sync is failing

**Permission errors:**
- Verify you have case_manager role
- Contact admin to check user permissions
- Ensure you're logged in properly

### Getting Help

1. **Check System Status**: Admin Panel shows sync status
2. **Try Manual Actions**: Use copy link if email fails
3. **Contact Administrator**: For technical issues
4. **Check Documentation**: Refer to setup guides

## Best Practices

### For Case Managers

- **Plan Ahead**: Send forms with adequate response time
- **Follow Up**: Check response rates and remind teachers
- **Be Specific**: Include context about why feedback is needed
- **Regular Use**: Establish routine feedback collection
- **Review Responses**: Use feedback to inform decisions

### For Administrators

- **Regular Maintenance**: Monitor Cloud Functions logs
- **Form Updates**: Keep forms current and relevant
- **User Training**: Train case managers on proper usage
- **Data Backup**: Regularly export response data
- **Security Reviews**: Monitor access and permissions

## Data Flow

```
1. Admin creates Google Form
2. Admin adds form to system
3. Case manager selects form for student
4. Cloud Function sends emails to teachers
5. Teachers complete Google Form
6. Responses saved to Google Sheets
7. Auto-sync copies responses to Firestore
8. Case managers view responses in system
```

This workflow ensures reliable data collection while maintaining security and ease of use for all stakeholders. 