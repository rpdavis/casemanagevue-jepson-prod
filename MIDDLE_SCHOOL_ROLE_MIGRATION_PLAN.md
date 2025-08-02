# 🏫 Enhanced School Role System Migration Plan

## 📋 Overview

This document outlines the comprehensive plan for migrating the current role system to an enhanced structure optimized for **all school levels** with particular focus on **primary and larger schools** where role complexity and staff differentiation is most critical. This migration affects **multiple critical systems** and must be executed carefully to maintain FERPA compliance and system security.

### **Target Environments**
- **Primary Focus**: Elementary schools, large middle schools, high schools
- **Secondary Benefit**: Smaller schools with simplified role needs
- **Scalability**: Designed to handle complex staff hierarchies and specialized roles

## 🚨 **CRITICAL REQUIREMENT: PRESERVE EXISTING FUNCTIONALITY**

**⚠️ MUST NOT BREAK EXISTING ROLES:**
- Roles that are **unchanged** or **renamed only** must maintain **identical permissions and views**
- **NO functional changes** to existing role behavior
- **NEW permissions/views ONLY** for genuinely new roles (`school_admin`, `staff_edit`)
- Existing users must experience **zero disruption** in their current workflows

## 🎯 Corrected Role Definitions

### **Current vs. New Role Structure**

| Current Role | New Role | Purpose | Access Level |
|-------------|----------|---------|--------------|
| `admin` | `admin` | **UNCHANGED** - System Administrator | Full system access |
| `administrator` | `staff_view` | **IEP Access Staff** - Counselors, nurses, etc. | View all students, **NO** admin panel |
| `administrator_504_CM` | `admin_504` | **504 Plan Coordinator** | Edit 504 students, limited admin |
| `sped_chair` | `sped_chair` | **UNCHANGED** - Special Education Chair | Full student + aide access |
| `case_manager` | `case_manager` | **UNCHANGED** - Case Manager | Own caseload only |
| `teacher` | `teacher` | **UNCHANGED** - Teacher | View assigned students |
| `service_provider` | `service_provider` | **UNCHANGED** - Related Services | Edit served students |
| `paraeducator` | `paraeducator` | **UNCHANGED** - Paraeducator/Aide | View assigned students |
| **NEW** | `school_admin` | **School Administrator** - Principal, AP | Students + aides + users, NO system settings |
| **NEW** | `staff_edit` | **Student Editor** - Counselors who need editing | Edit all students, **NO** admin panel |

### **🚨 CRITICAL CLARIFICATIONS**

#### **Role Purpose & Scope**
- **`staff_view`** = Staff who need **IEP access** (counselors, nurses, intervention specialists)
- **NOT for substitutes or observers** - they get **NO ACCESS** to this app
- **`staff_edit`** = Staff who need to **edit student records** but not access admin functions

#### **School Size & Complexity Considerations**
- **Large/Primary Schools**: Will benefit most from granular role separation (`staff_view` vs `staff_edit`)
- **Smaller Schools**: May use fewer distinct roles but system supports full complexity when needed
- **Growing Schools**: Can easily add role differentiation as staff specialization increases

## 📊 Impact Analysis

### **Files Requiring Updates**

#### **1. Core Configuration Files**
- ✅ `src/config/roles.js` - **PARTIALLY UPDATED** (needs completion)
- ❌ `functions/index.js` - **NEEDS UPDATE** (lines 50-51, 61-62, 524, 622)
- ❌ `firestore.rules` - **NEEDS COMPLETE OVERHAUL** (lines 40-87)

#### **2. Router & Guards**
- ❌ `src/router/guards.js` - **NEEDS UPDATE** (line 40)
- ❌ `src/router/index.js` - **NEEDS UPDATE** (line 97)

#### **3. Vue Components**
- ❌ `src/components/AdminPermissionsMatrix.vue` - **NEEDS MAJOR UPDATE**
- ❌ `src/components/students/StudentFilters.vue` - **NEEDS UPDATE** (line 96)
- ❌ `src/views/AdminAideSchedule.vue` - **NEEDS UPDATE** (line 186)
- ❌ `src/views/AdminAideAssignment.vue` - **NEEDS UPDATE** (line 114)
- ❌ `src/views/AppSettings.vue` - **NEEDS UPDATE** (lines 213-214)

#### **4. Composables & Utilities**
- ❌ `src/composables/roles/useRoleBasedView.js` - **NEEDS UPDATE** (lines 26, 31, 36, 41, 46)
- ❌ `src/composables/roles/useBaseRoleView.js` - **NEEDS ANALYSIS**
- ❌ `src/utils/iepSecurity.js` - **NEEDS UPDATE** (line 159)
- ❌ `src/utils/securityTest.js` - **NEEDS ANALYSIS**
- ❌ `src/utils/pdfSecurity.js` - **NEEDS ANALYSIS**

#### **5. Cloud Functions**
- ❌ `functions/teacherFeedback.js` - **NEEDS UPDATE** (lines 14-15)
- ❌ `functions/teacherFeedback/helpers.js` - **NEEDS UPDATE** (line 7)

#### **6. Test Data & Seeds**
- ❌ Multiple CSV and JSON files with test data - **NEEDS CLEANUP**

## 🔒 Security & FERPA Considerations

### **Admin Panel Access Control**

**NEW PERMISSION**: `ACCESS_ADMIN_PANEL`

| Role | Admin Panel Access | Justification |
|------|-------------------|---------------|
| `admin` | ✅ Full | System administration |
| `school_admin` | ✅ Limited | School management needs |
| `sped_chair` | ✅ Limited | Department management |
| `staff_view` | ❌ None | IEP access only |
| `staff_edit` | ❌ None | Student editing only |
| `admin_504` | ❌ None | 504 coordination only |
| All others | ❌ None | No administrative needs |

### **Student Data Access Levels**

| Role | View Students | Edit Students | Scope |
|------|--------------|---------------|-------|
| `admin` | ✅ All | ✅ All | System-wide |
| `school_admin` | ✅ All | ✅ All | School-wide |
| `sped_chair` | ✅ All | ✅ All | SPED focus |
| `staff_view` | ✅ All | ❌ None | **IEP access for counselors** |
| `staff_edit` | ✅ All | ✅ All | **Counselors who need editing** |
| `admin_504` | ✅ All | ✅ 504 only | 504 plans |
| `case_manager` | ✅ Assigned | ✅ Assigned | Own caseload |
| `teacher` | ✅ Assigned | ❌ None | Own classes |
| `service_provider` | ✅ Served | ✅ Served | Own services |
| `paraeducator` | ✅ Assigned | ❌ None | Assigned students |

## 🗺️ Migration Strategy

### **Phase 1: Preparation & Testing**
1. **Create comprehensive test plan**
2. **Update all configuration files** ⚠️ **PRESERVE existing role behavior**
3. **Test in development environment**
4. **Verify Firestore rules work correctly**

### **Phase 2: Database Migration**
1. **Create user role migration script**
2. **Map existing users to new roles** ⚠️ **MAINTAIN current access levels**:
   - `administrator` → `staff_view` (preserve current permissions)
   - `administrator_504_CM` → `admin_504` (preserve current permissions)
   - Consider case-by-case for `staff_edit` assignments (NEW functionality only)
3. **Update Cloud Functions roles** ⚠️ **NO behavior changes for existing roles**

### **Phase 3: Frontend Updates**
1. **Update all Vue components** ⚠️ **PRESERVE existing views/permissions**
2. **Update router guards** ⚠️ **MAINTAIN current access patterns**
3. **Update permission checks** ⚠️ **ADD new permissions, don't modify existing**
4. **Test admin panel access controls** ⚠️ **NEW controls only for new roles**

### **Phase 4: Validation & Deployment**
1. **Comprehensive testing** ⚠️ **Verify NO regression in existing functionality**
2. **Security audit**
3. **FERPA compliance check**
4. **Production deployment**

### **School Size Considerations**
- **Large Schools**: Full role differentiation provides maximum benefit
- **Small Schools**: Can use subset of roles as needed
- **Migration Flexibility**: Schools can adopt new roles gradually

## 🧪 Testing Checklist

### **Critical Test Cases**

#### **Admin Panel Access**
- [ ] `admin` - Full access to all admin functions
- [ ] `school_admin` - Access to students/aides/users, NO system settings
- [ ] `sped_chair` - Access to students/aides, NO user management
- [ ] `staff_view` - **NO admin panel access**
- [ ] `staff_edit` - **NO admin panel access**
- [ ] `admin_504` - **NO admin panel access**

#### **Student Data Access**
- [ ] `staff_view` - Can view all student IEPs, **CANNOT edit**
- [ ] `staff_edit` - Can view and edit all students, **NO admin panel**
- [ ] `admin_504` - Can edit 504 students only
- [ ] All other roles maintain current behavior

#### **FERPA Compliance**
- [ ] Each role has clear educational justification
- [ ] Minimum necessary access principle maintained
- [ ] Audit logging works for all roles
- [ ] No unauthorized data exposure

## ⚠️ Critical Risks & Mitigation

### **High-Risk Areas**

1. **Firestore Security Rules**
   - **Risk**: Breaking student data access
   - **Mitigation**: Comprehensive testing, gradual rollout

2. **Admin Panel Access**
   - **Risk**: Locking out legitimate administrators
   - **Mitigation**: Careful permission mapping, backup admin accounts

3. **IEP Data Access**
   - **Risk**: Breaking counselor/nurse access to student information
   - **Mitigation**: Clear `staff_view` vs `staff_edit` distinction

4. **Cloud Functions**
   - **Risk**: Breaking teacher feedback, file access, user management
   - **Mitigation**: Update all functions simultaneously

### **Rollback Plan**

1. **Database snapshot before migration**
2. **Keep old role names as aliases during transition**
3. **Gradual user migration with rollback capability**

## 📝 Implementation Order

### **Step 1: Core Configuration** ⚠️ **CRITICAL FIRST**
1. Complete `src/config/roles.js` updates
2. Update `functions/index.js` role constants
3. **COMPLETELY REWRITE** `firestore.rules`

### **Step 2: Security & Access Control**
1. Update `src/utils/iepSecurity.js`
2. Update PDF security handlers
3. Update router guards

### **Step 3: UI Components**
1. Update `AdminPermissionsMatrix.vue`
2. Update all role-based view composables
3. Update admin views

### **Step 4: Testing & Validation**
1. Comprehensive role-based testing
2. Admin panel access verification
3. Student data access verification

### **Step 5: Data Migration**
1. Create user migration script
2. Execute migration with rollback capability
3. Verify all users have correct access

## 🎯 Success Criteria

- [ ] All 10 roles function correctly
- [ ] `staff_view` provides IEP access without editing
- [ ] `staff_edit` provides student editing without admin panel
- [ ] `school_admin` manages school operations without system access
- [ ] No FERPA violations or unauthorized access
- [ ] All existing functionality preserved
- [ ] Admin panel access properly restricted
- [ ] Migration completed without data loss

## 📞 Next Steps

1. **REVIEW THIS PLAN** - Ensure all requirements captured
2. **APPROVE ROLE DEFINITIONS** - Confirm `staff_view` vs `staff_edit` distinction
3. **BEGIN IMPLEMENTATION** - Start with core configuration files
4. **CONTINUOUS TESTING** - Test after each major change

---

**⚠️ IMPORTANT**: This migration affects **security-critical systems**. Each step must be thoroughly tested before proceeding to the next phase.