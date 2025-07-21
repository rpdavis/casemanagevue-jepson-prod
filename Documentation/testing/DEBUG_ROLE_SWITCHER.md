# 🔧 User Role Switcher - Debug Tool

This tool allows you to easily test different user roles and permissions during development without having to create multiple test accounts.

## 🚀 How to Use

### Visual Interface
1. **Access**: The role switcher appears as a floating panel in the top-right corner of the screen (only in development mode)
2. **Toggle**: Click the header to expand/collapse the switcher
3. **Keyboard Shortcut**: Press `Ctrl+Shift+R` to toggle the switcher

### Features

#### Current User Info
- Shows the current user's name, role, and UID
- Role is color-coded for easy identification

#### Role Selection
- Dropdown to select any available role
- Automatically creates a test user with that role

#### Quick Test Users
- Pre-configured test users for each role
- One-click switching between different user types
- Active user is highlighted in green

#### Permission Display
- Real-time display of current user's permissions
- Shows which permissions are granted (✅) or denied (❌)
- Updates automatically when switching roles

#### Actions
- **Reset to Real User**: Clears debug user and reloads with real authentication
- **Refresh Page**: Reloads the page to test full page refresh behavior

## 🎯 Available Test Users

| Role | Name | Email | Permissions |
|------|------|-------|-------------|
| Admin | Test Admin | admin@test.com | Full access |
| Case Manager | Test Case Manager | cm@test.com | Own caseload + limited admin |
| Paraeducator | Test Paraeducator | para@test.com | Assigned students only |
| Teacher | Test Teacher | teacher@test.com | Limited student access |
| Parent | Test Parent | parent@test.com | Minimal access |

## 🔒 Security Notes

- **Development Only**: This tool only appears in development mode (`localhost` or `import.meta.env.DEV`)
- **Local Storage**: Debug user is stored in localStorage for persistence across page refreshes
- **No Production**: This component is automatically hidden in production builds
- **Reset Function**: Always use "Reset to Real User" before deploying or testing real authentication

## 🛠️ Technical Details

### Persistence
- Debug users are stored in `localStorage` under the key `debug-user`
- Survives page refreshes and browser restarts
- Can be cleared manually or via the reset button

### Integration
- Integrates with the existing `useAuthStore` and `usePermissions` composables
- Updates all permission checks throughout the application
- Maintains consistency with the real authentication flow

### Keyboard Shortcuts
- `Ctrl+Shift+R`: Toggle the role switcher panel
- Works globally across the application

## 🐛 Troubleshooting

### Role Switcher Not Appearing
- Ensure you're running in development mode (`npm run dev`)
- Check that you're on `localhost` or have `import.meta.env.DEV` set to true
- Verify the component is imported in `App.vue`

### Permissions Not Updating
- Try refreshing the page after switching roles
- Check the browser console for any errors
- Ensure the `usePermissions` composable is working correctly

### Stuck in Debug Mode
- Use the "Reset to Real User" button
- Or manually clear localStorage: `localStorage.removeItem('debug-user')`
- Then refresh the page

## 📝 Usage Examples

### Testing Case Manager View
1. Click "Test Case Manager" button
2. Navigate to Students page
3. Verify only own caseload students are visible
4. Test editing permissions on students

### Testing Paraeducator Access
1. Click "Test Paraeducator" button
2. Check that only assigned students are visible
3. Verify limited access to admin features
4. Test aide schedule functionality

### Testing Admin Permissions
1. Click "Test Admin" button
2. Verify full access to all features
3. Test user management
4. Check permission matrix access

This tool makes it much easier to test and debug role-based access control without needing multiple test accounts or complex authentication setups! 