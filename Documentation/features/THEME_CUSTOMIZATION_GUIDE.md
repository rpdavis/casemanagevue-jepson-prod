# Theme Customization Guide

## Overview

The CaseManage application now includes a comprehensive theme customization system that allows administrators to modify the visual appearance of the application in real-time. All theme changes are saved to the database and applied globally across the application.

## Accessing Theme Customization

1. Navigate to the **Admin Panel**
2. Go to **System Configuration** category
3. Click on **Theme Customization** tab

## Available Customization Options

### 🎨 Color Palette

#### Primary Colors
- **Primary Color**: Main brand color used for buttons, links, and highlights
- **Primary Hover**: Color for hover states of primary elements
- **Primary Light**: Light variant for backgrounds and subtle highlights
- **Primary Dark**: Dark variant for emphasis and contrast

#### Secondary Colors
- **Secondary Color**: Secondary brand color for less prominent elements
- **Secondary Hover**: Hover state for secondary elements

#### Status Colors
- **Success**: Green color for success states and positive actions
- **Warning**: Yellow/Orange color for warning states
- **Error**: Red color for error states and destructive actions
- **Info**: Blue color for informational states

### 🏞️ Background Colors

- **Primary Background**: Main application background color
- **Secondary Background**: Background for cards and content areas
- **Tertiary Background**: Background for subtle sections
- **Muted Background**: Background for disabled or inactive elements

### 📝 Text Colors

- **Primary Text**: Main text color for headings and important content
- **Secondary Text**: Color for less important text
- **Muted Text**: Color for disabled or placeholder text
- **Inverse Text**: Text color for dark backgrounds (usually white)

### 🔲 Border Radius

- **Small**: 4px - Used for small elements like buttons
- **Medium**: 6px - Used for medium-sized elements
- **Large**: 8px - Used for cards and larger elements
- **Extra Large**: 12px - Used for prominent elements

### 🔤 Typography

- **Font Family**: Choose from popular web fonts including Inter, Roboto, Open Sans, and more
- **Base Font Size**: Adjust the base font size for the entire application

## Features

### Real-time Preview
All changes are applied immediately to the interface, allowing you to see the effects in real-time.

### Live Preview Section
A sample card with various button styles is provided to preview your theme changes.

### Save and Revert
- **Save Theme**: Permanently saves your changes to the database
- **Revert Changes**: Undoes unsaved changes and returns to the last saved state
- **Reset to Defaults**: Restores the original theme settings

### Import/Export
- **Export Theme**: Download your current theme as a JSON file
- **Import Theme**: Load a previously exported theme file

## Best Practices

### Color Selection
1. **Contrast**: Ensure sufficient contrast between text and background colors for accessibility
2. **Consistency**: Use consistent color variations throughout your theme
3. **Branding**: Align colors with your organization's brand guidelines

### Typography
1. **Readability**: Choose fonts that are easy to read on screens
2. **Web-safe**: Use fonts that are widely available and load quickly
3. **Hierarchy**: Use font sizes that create clear visual hierarchy

### Testing
1. **Multiple Views**: Test your theme across different pages and components
2. **Responsive**: Verify the theme works well on different screen sizes
3. **Accessibility**: Ensure color combinations meet accessibility standards

## Technical Details

### CSS Variables
The theme system uses CSS custom properties (variables) that are applied to the document root. This ensures:
- Consistent theming across all components
- Real-time updates without page refresh
- Efficient rendering and performance

### Database Storage
Theme settings are stored in Firestore under `app_settings/theme` and include:
- All color values
- Typography settings
- Border radius values
- Timestamp of last update

### Browser Compatibility
The theme system works in all modern browsers that support:
- CSS custom properties (CSS variables)
- HTML5 color inputs
- File API for import/export

## Troubleshooting

### Theme Not Loading
1. Check browser console for errors
2. Verify Firebase connection
3. Try refreshing the page

### Changes Not Saving
1. Ensure you have admin permissions
2. Check internet connection
3. Verify Firebase write permissions

### Import Issues
1. Ensure the file is a valid JSON format
2. Check that all required theme properties are present
3. Verify the file was exported from this system

## Security Considerations

- Only users with admin permissions can modify themes
- Theme data is validated before saving
- Import files are validated for security
- All changes are logged with timestamps

## Support

For issues with theme customization:
1. Check this documentation first
2. Review browser console for errors
3. Contact your system administrator
4. Ensure you have the latest version of the application 