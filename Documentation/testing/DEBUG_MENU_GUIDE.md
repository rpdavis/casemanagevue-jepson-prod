# Debug Menu Guide

## Overview
The Debug Menu is a development-only feature that provides role switching and testing capabilities for the CaseManageVue application. It allows developers to quickly test different user roles and permissions without needing to log in as different users.

## Accessing the Debug Menu

### Method 1: Navigation Menu
1. **Main NavBar**: Click the "Menu ▼" dropdown → "🔧 Show Debug Menu"
2. **Student Navigation Menu**: Click the hamburger menu (☰) → Debug section → "🔧 Show Debug Menu"

### Method 2: Keyboard Shortcut
- Press **Ctrl+Shift+D** to toggle the debug menu visibility
- If the menu is hidden, this will show it and expand it
- If the menu is visible, this will toggle its expanded/collapsed state

## Features

### 🔧 Debug Panel Controls
- **Expand/Collapse**: Click the header to expand or collapse the debug panel
- **Close**: Click the "×" button to hide the debug menu entirely

### 👤 Current User Information
- **User Details**: Shows current user's name, email, role, and UID
- **Role Display**: Color-coded role indicator

### 🔄 Role Switching
- **Quick Role Switch**: Dropdown to select and switch to any available role
- **Test Users**: Pre-configured test users for common roles:
  - Admin User (admin)
  - Case Manager (case_manager)
  - Paraeducator (paraeducator)
  - Teacher (teacher)
  - Service Provider (service_provider)

### ✅ Permission Checker
- **Current Permissions**: Live display of what the current user can do
- **Permission Status**: Green checkmarks (✅) for granted permissions, red X (❌) for denied
- **Permission Types**:
  - View Users
  - Edit Users
  - Delete Users
  - Manage Subjects
  - Manage Roles
  - View Students
  - Edit Students (Own Caseload)
  - Edit All Students
  - Testing Access

### 🧪 Testing Scenarios
- **Pre-defined Test Cases**: Common testing scenarios for different features
- **Feature Coverage**: Students Page, Admin Panel, Navigation testing

### 🔄 Reset Functions
- **Reset to Real User**: Removes debug user and refreshes to get authentic user
- **Refresh Page**: Simple page refresh for testing

## Availability

### Development Mode Only
The debug menu is only available when:
- `import.meta.env.DEV` is true (Vite development mode)
- OR `window.location.hostname === 'localhost'`

### Production Safety
- The debug menu is automatically hidden in production builds
- No debug functionality is exposed to end users

## Technical Implementation

### Global State Management
- Uses `useDebugMenu()` composable for global state management
- Shared state across all components that need debug functionality

### Persistent User Switching
- Debug users are stored in `localStorage` as `debug-user`
- Persists across page refreshes during development
- Automatically cleared when resetting to real user

### Integration Points
- **NavBar.vue**: Main navigation dropdown menu
- **StudentNavMenu.vue**: Student page hamburger menu
- **UserRoleSwitcher.vue**: The debug panel itself
- **App.vue**: Global debug menu container

## Usage Tips

1. **Testing Role-Based Features**: Switch to different roles to test permissions and UI visibility
2. **Quick Testing**: Use the pre-configured test users for common scenarios
3. **Permission Verification**: Check the permission list to verify role configurations
4. **Reset When Done**: Always reset to real user when finished testing

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+D | Toggle debug menu visibility |

## Troubleshooting

### Debug Menu Not Showing
- Ensure you're in development mode (`npm run dev`)
- Check that you're on localhost or development environment
- Verify the debug menu option appears in navigation menus

### Role Switch Not Working
- Check browser console for errors
- Verify the role exists in the available roles list
- Try refreshing the page after switching

### Permissions Not Updating
- Check if permissions matrix is properly loaded
- Verify the role has been properly applied
- Check Firestore for permission configuration

## Security Notes

- Debug functionality is development-only
- No debug features are available in production
- All debug users are clearly marked as test users
- Real user authentication is preserved and can be restored 