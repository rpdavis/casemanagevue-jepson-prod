# 🧪 User View Testing Guide

This guide shows you how to test specific user views and permissions using the debug role switcher.

## 🚀 Quick Start

1. **Open the role switcher**: Look for the 🔧 Debug panel in the top-right corner
2. **Click to expand**: See all available test users and options
3. **Switch roles**: Click any test user button to instantly switch
4. **Test features**: Navigate through the app to see role-specific views

## 👥 Role-Specific Testing

### 🔴 **Admin** (`test-admin`)
**Full system access - highest privileges**

**What to test:**
- ✅ **Students Page**: Can view and edit ALL students
- ✅ **Admin Panel**: Full access to all admin features
- ✅ **Users Management**: Can create, edit, delete users
- ✅ **Permissions Matrix**: Can modify role permissions
- ✅ **Aide Assignments**: Can assign aides to students/classes
- ✅ **App Settings**: Can modify global settings
- ✅ **Navigation**: Admin button visible, all menu items accessible

**Test Scenarios:**
1. Go to Students page → Should see all students
2. Click Admin button → Should access all admin features
3. Try editing any student → Should work
4. Check Users tab → Should see all users
5. Test Permissions tab → Should be able to modify permissions

---

### 🔵 **Administrator** (`test-administrator`)
**Similar to Admin but with some restrictions**

**What to test:**
- ✅ **Students Page**: Can view and edit ALL students
- ✅ **Admin Panel**: Most admin features accessible
- ✅ **Users Management**: Can manage users
- ✅ **Permissions Matrix**: Can modify permissions
- ⚠️ **Some restrictions**: May have limited access to certain features

**Test Scenarios:**
1. Compare with Admin role → Should be very similar
2. Check for any subtle differences in permissions
3. Test all admin panel tabs

---

### 🟠 **Administrator 504/CM** (`test-administrator-504-cm`)
**Specialized admin for 504 plans and case management**

**What to test:**
- ✅ **Students Page**: Can view and edit ALL students
- ✅ **504 Plans**: Special access to 504 plan students
- ✅ **Case Management**: Enhanced case manager features
- ⚠️ **Restrictions**: May have limited access to non-504 students

**Test Scenarios:**
1. Look for 504-specific features
2. Test case management tools
3. Check if there are 504 plan filters

---

### 🟡 **SPED Chair** (`test-sped-chair`)
**Special Education department leadership**

**What to test:**
- ✅ **Students Page**: Can view and edit ALL students
- ✅ **SPED Features**: Special education specific tools
- ✅ **Case Manager Oversight**: Can view case manager work
- ⚠️ **Limited Admin**: May not have full admin privileges

**Test Scenarios:**
1. Check for SPED-specific navigation
2. Test oversight features
3. Verify student editing permissions

---

### 🔵 **Case Manager** (`test-case-manager`)
**Manages their own caseload of students**

**What to test:**
- ✅ **Students Page**: Can view and edit OWN caseload only
- ✅ **Caseload Filter**: Should default to "My Caseload" view
- ✅ **Student Editing**: Can edit students assigned to them
- ❌ **Other Students**: Cannot edit students not in their caseload
- ❌ **Admin Panel**: Should not have access

**Test Scenarios:**
1. Go to Students page → Should see limited students
2. Try to edit a student → Should work for own caseload
3. Check Admin button → Should not be visible
4. Test caseload filtering → Should show only assigned students

---

### 🟣 **Paraeducator** (`test-paraeducator`)
**Aide assigned to specific students/classes**

**What to test:**
- ✅ **Students Page**: Can view assigned students only
- ✅ **My Schedule Button**: Should be visible
- ✅ **Aide Schedule**: Can access their schedule
- ✅ **Student Filtering**: Paraeducator filter should work
- ❌ **Student Editing**: Cannot edit students
- ❌ **Admin Panel**: No access

**Test Scenarios:**
1. Go to Students page → Should see very limited students
2. Click "My Schedule" button → Should work
3. Check Admin button → Should not be visible
4. Test paraeducator filter → Should show assigned students
5. Try to edit a student → Should be disabled

---

### 🟢 **Teacher** (`test-teacher`)
**Regular teacher with limited student access**

**What to test:**
- ✅ **Students Page**: Can view students they teach
- ✅ **Student Information**: Can view but not edit
- ❌ **Student Editing**: Cannot edit students
- ❌ **Admin Panel**: No access

**Test Scenarios:**
1. Go to Students page → Should see students they teach
2. Try to edit a student → Should be disabled
3. Check Admin button → Should not be visible

---

### 🔵 **Service Provider** (`test-service-provider`)
**Specialized service provider (OT, PT, Speech, etc.)**

**What to test:**
- ✅ **Students Page**: Can view students they provide services to
- ✅ **Service Information**: Can view service details
- ❌ **Student Editing**: Cannot edit students
- ❌ **Admin Panel**: No access

**Test Scenarios:**
1. Go to Students page → Should see students with their services
2. Check for service-specific information
3. Test service provider filters

---



## 🧪 Systematic Testing Approach

### **1. Navigation Testing**
For each role, test:
- [ ] Admin button visibility
- [ ] Menu item accessibility
- [ ] Role-specific buttons (My Schedule, etc.)
- [ ] Breadcrumb navigation

### **2. Student Page Testing**
For each role, test:
- [ ] Student list visibility
- [ ] Student count (should vary by role)
- [ ] Edit button availability
- [ ] Filter functionality
- [ ] Search functionality
- [ ] Export functionality

### **3. Permission Testing**
For each role, test:
- [ ] Can view students
- [ ] Can edit students (own caseload vs all)
- [ ] Can access admin features
- [ ] Can manage users
- [ ] Can modify permissions

### **4. Feature-Specific Testing**
- [ ] **Paraeducator**: Test aide assignment filtering
- [ ] **Case Manager**: Test caseload filtering
- [ ] **Admin**: Test all admin panel tabs
- [ ] **Teacher**: Test class-based student views

## 🔄 Testing Workflow

### **Quick Test Cycle:**
1. **Switch to Test Admin** → Verify full access
2. **Switch to Test Case Manager** → Verify caseload restrictions
3. **Switch to Test Paraeducator** → Verify aide assignments
4. **Switch to Test Teacher** → Verify limited access
5. **Switch to Test Service Provider** → Verify service-based access

### **Detailed Test Cycle:**
1. **Start with Admin** → Establish baseline
2. **Test each role systematically** → Note differences
3. **Test edge cases** → Try to access forbidden features
4. **Test navigation** → Ensure proper button visibility
5. **Test data filtering** → Verify role-based data access

## 🐛 Common Issues to Look For

### **Permission Issues:**
- [ ] Users can access features they shouldn't
- [ ] Users cannot access features they should
- [ ] Edit buttons appear for non-editable content
- [ ] Admin buttons visible to non-admins

### **Data Issues:**
- [ ] Wrong students showing for role
- [ ] Missing students that should be visible
- [ ] Incorrect filtering behavior
- [ ] Paraeducator assignments not working

### **UI Issues:**
- [ ] Buttons visible to wrong roles
- [ ] Missing role-specific features
- [ ] Incorrect navigation items
- [ ] Broken role-based styling

## 🎯 Pro Tips

1. **Use the permission display** in the role switcher to see what permissions each role has
2. **Test systematically** - don't jump between roles randomly
3. **Take notes** - document any issues you find
4. **Test edge cases** - try to break the permission system
5. **Use the keyboard shortcut** (`Ctrl+Shift+R`) to quickly toggle the switcher

## 🔧 Troubleshooting

### **Role Switcher Not Working:**
- Check browser console for errors
- Ensure you're in development mode
- Try refreshing the page
- Clear localStorage and try again

### **Permissions Not Updating:**
- Refresh the page after switching roles
- Check if the permission system is working
- Verify the role is correctly set

### **Stuck in Debug Mode:**
- Use "Reset to Real User" button
- Or manually clear localStorage: `localStorage.removeItem('debug-user')`

This testing approach will help you thoroughly verify that your role-based access control is working correctly! 🎉 