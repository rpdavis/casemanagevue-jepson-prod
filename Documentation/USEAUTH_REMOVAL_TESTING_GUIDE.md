# useAuth Removal Testing Guide

## Overview
The `useAuth` composable has been removed and replaced with `authStore` (Pinia store) to eliminate authentication conflicts and potential save crashes. This guide lists all areas that need testing to ensure the authentication system works correctly.

## Files Modified
- ✅ `src/views/AppSettings.vue`
- ✅ `src/views/AdminView.vue` 
- ✅ `src/views/AdminStudents.vue`
- ✅ `src/components/SessionTimeoutDebug.vue`
- ✅ `src/composables/useAdminPanelPermissions.js`
- ✅ `src/composables/useAuth.js` (DELETED)

## Critical Testing Areas

### 🔥 **Priority 1: Core Authentication**
Test these first as they're most likely to break:

#### **Login/Logout Flow**
- [ ] **Login Page** (`/login`)
  - Try logging in with Google
  - Verify redirect to main app after login
  - Check that user info appears in navigation
- [ ] **Logout Process**
  - Click logout from navigation menu
  - Verify redirect to login page
  - Confirm user session is cleared

#### **App Settings** (Primary Issue Location)
- [ ] **Navigate to App Settings** (`/admin` → App Settings tab)
  - Verify page loads without errors
  - Check that current user info is displayed
  - **CRITICAL**: Try saving settings (this was the original crash)
  - Verify settings persist after page refresh

### 🚨 **Priority 2: Admin Functions** 
These components were directly modified:

#### **Admin Panel Access**
- [ ] **Admin View** (`/admin`)
  - Verify admin panel loads for admin users
  - Check that all tabs are visible and clickable
  - Confirm user role-based permissions work
- [ ] **Admin Students** (`/admin` → Students tab)
  - Verify student list loads
  - Try editing a student record
  - Check that permission debugging info shows correct user
- [ ] **Admin Users** (`/admin` → Users tab)
  - Verify user list displays
  - Try adding/editing users
  - Check role assignments work

#### **Permission-Based Features**
- [ ] **Admin Panel Permissions** (uses `useAdminPanelPermissions.js`)
  - Verify different admin roles see appropriate tabs
  - Test that non-admin users can't access admin features
  - Check permission matrix functionality

### 🔧 **Priority 3: Debug/Development Features**

#### **Session Timeout Debug**
- [ ] **Access Session Timeout Debug** (if available in testing menu)
  - Verify component loads without errors
  - Check that current user info displays
  - Test timeout functionality

### 🌐 **Priority 4: General App Functionality**
Test these to ensure no side effects:

#### **Navigation & Routing**
- [ ] **Main Navigation**
  - Verify user name/role appears in nav bar
  - Check that protected routes work correctly
  - Test route guards (try accessing admin as non-admin)

#### **Student Management**
- [ ] **Students View** (`/students`)
  - Verify student list loads based on user role
  - Check filtering works correctly
  - Test student editing permissions

#### **Other Admin Features**
- [ ] **Time Table** (`/admin` → Time Table tab)
- [ ] **Aide Assignment** (`/admin` → Aide Assignment tab)  
- [ ] **Teacher Feedback** (`/admin` → Teacher Feedback tab)
- [ ] **Audit Logs** (`/admin` → Audit Logs tab)

## Testing Scenarios by User Role

### **Admin User Testing**
- [ ] Login as admin
- [ ] Access all admin panel tabs
- [ ] Save app settings (CRITICAL TEST)
- [ ] Edit students and users
- [ ] Check audit logging works

### **Teacher/Case Manager Testing**
- [ ] Login as teacher/case manager
- [ ] Verify limited access to admin features
- [ ] Check student filtering by role
- [ ] Test student editing permissions

### **Paraeducator Testing**
- [ ] Login as paraeducator
- [ ] Verify access only to assigned students
- [ ] Check aide schedule functionality

## Signs of Success ✅
- No console errors related to `useAuth`
- App settings save without crashing
- User authentication state persists across page refreshes
- Role-based permissions work correctly
- No duplicate authentication listeners

## Signs of Problems ❌
- Console errors mentioning `useAuth` 
- App settings still crash on save
- User gets logged out unexpectedly
- Permission errors or access denied messages
- Blank user info in navigation

## Rollback Plan
If critical issues are found:
1. The changes were simple import/variable replacements
2. Can quickly revert by recreating `useAuth.js` from git history
3. Change the 5 modified files back to use `useAuth`

## Expected Benefits
- **Eliminated authentication conflicts** that may have caused save crashes
- **Single source of truth** for user authentication
- **Better debugging** with Pinia devtools
- **Consistent with rest of codebase** (90% already used authStore)

---

## Quick Test Checklist
**Minimum tests to verify everything works:**
1. ✅ Login/logout works
2. ✅ App settings save without crashing  
3. ✅ Admin panel loads and shows correct user
4. ✅ Student list loads based on user role
5. ✅ No console errors

**If these 5 tests pass, the migration was successful!**