export const VALID_ROLES = [
  "admin",
  "school_admin",
  "staff_view", 
  "staff_edit",
  "admin_504",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider",
  "paraeducator"
];

// Useful role groups for route guards
export const STUDENT_ACCESS_ROLES = [
  "admin",
  "school_admin",
  "staff_view",
  "staff_edit", 
  "admin_504",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider",
  "paraeducator"
];

export const ADMIN_ONLY = [
  "admin",
  "school_admin",
  "admin_504",
  "sped_chair"
];

// --- Permission Actions ---
export const PERMISSION_ACTIONS = {
  VIEW_USERS: "view_users",
  EDIT_USER: "edit_user",
  DELETE_USER: "delete_user",
  VIEW_STUDENTS: "view_students",
  EDIT_STUDENT_CM: "edit_student_CM",      // Case Manager: edit students on their caseload
  EDIT_STUDENT_ALL: "edit_student_All",    // Admin/School Admin: edit any student
  ACCESS_ADMIN_PANEL: "access_admin_panel", // Controls admin panel access
  MANAGE_AIDES: "manage_aides",             // Aide schedule management
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings", // System-level configuration
  MANAGE_TEACHER_FEEDBACK: "manage_teacher_feedback", // Teacher feedback forms
  MANAGE_IMPORTS: "manage_imports",         // Data imports (SEIS, Aeries)
  MANAGE_BACKUPS: "manage_backups"          // Backup and restore operations
  // Note: Testing access is based on student access - no separate testing permissions needed
  // Removed: MANAGE_SUBJECTS, MANAGE_ROLES (unused in actual implementation)
};

// --- Permissions Matrix ---
// This matrix matches the Firebase security rules exactly
export const PERMISSIONS_MATRIX = {
  admin: [
    // Full system access
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.ACCESS_ADMIN_PANEL,
    PERMISSION_ACTIONS.MANAGE_AIDES,
    PERMISSION_ACTIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSION_ACTIONS.MANAGE_TEACHER_FEEDBACK,
    PERMISSION_ACTIONS.MANAGE_IMPORTS,
    PERMISSION_ACTIONS.MANAGE_BACKUPS
  ],
  
  school_admin: [
    // School-level admin: Students + Aides + Users, NO system settings
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.ACCESS_ADMIN_PANEL,
    PERMISSION_ACTIONS.MANAGE_AIDES,
    PERMISSION_ACTIONS.MANAGE_TEACHER_FEEDBACK,
    PERMISSION_ACTIONS.MANAGE_IMPORTS,
    PERMISSION_ACTIONS.MANAGE_BACKUPS
    // NO MANAGE_SYSTEM_SETTINGS - cannot change system config
  ],
  
  staff_view: [
    // View-only access (renamed from administrator)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS
  ],
  
  staff_edit: [
    // Edit all students, NO admin panel access (your new role!)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL
    // NO ACCESS_ADMIN_PANEL - cannot access admin panel
  ],
  
  admin_504: [
    // 504 plan coordination with user management (renamed from administrator_504_CM)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.ACCESS_ADMIN_PANEL,
    PERMISSION_ACTIONS.MANAGE_AIDES,
    PERMISSION_ACTIONS.MANAGE_TEACHER_FEEDBACK
  ],
  
  sped_chair: [
    // Special education leadership with user management
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.ACCESS_ADMIN_PANEL,
    PERMISSION_ACTIONS.MANAGE_AIDES,
    PERMISSION_ACTIONS.MANAGE_TEACHER_FEEDBACK
  ],
  
  case_manager: [
    // Edit own caseload and manage teacher feedback
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_CM,
    PERMISSION_ACTIONS.MANAGE_TEACHER_FEEDBACK
  ],
  
  teacher: [
    // View students in classes
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS
  ],
  
  service_provider: [
    // View/edit served students
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_CM
  ],
  
  paraeducator: [
    // View assigned students only
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS
  ]
};

/**
 * Determines whether a user can edit a student's data.
 * This can be moved to a composable like usePermissions.js if it becomes more complex.
 * @param {object} student - The student object from Firestore.
 * @param {object} currentUser - The currently logged-in user object.
 * @returns {boolean}
 */
export function canEditStudent(student, currentUser) {
  if (!currentUser || !student) return false;

  const isOwnCase = student.caseManagerId === currentUser.uid;

  switch (currentUser.role) {
    case "admin":
    case "school_admin":
    case "staff_edit":
      return true;
    case "sped_chair":
      // SPED Chair: Can only edit IEP students (not 504 students)
      return (student.app?.studentData?.plan || student.plan) === "IEP";
    case "case_manager":
    case "service_provider":
      return isOwnCase;
    case "admin_504":
      // 504 Coordinator: Can edit 504 students on their caseload
      return isOwnCase && (student.app?.studentData?.plan || student.plan) === "504";
    default:
      return false;
  }
}

// Utility: is an approved role
export function isApprovedRole(role) {
  return VALID_ROLES.includes(role);
}

// Utility: can a role perform a given action?
export function can(role, action) {
  if (!role || !action) return false;
  const allowed = PERMISSIONS_MATRIX[role];
  return !!(allowed && allowed.includes(action));
}

// Utility: can a user (object with .role) perform a given action?
export function canUser(user, action) {
  return user && can(user.role, action);
}

// --- Role Migration Map ---
// Use this to migrate existing users to new role structure
export const ROLE_MIGRATION_MAP = {
  // Old role -> New role
  'administrator': 'staff_view',           // General admin becomes view-only
  'administrator_504_CM': 'admin_504',     // 504 coordinator keeps similar access
  // All other roles stay the same
  'admin': 'admin',
  'sped_chair': 'sped_chair', 
  'case_manager': 'case_manager',
  'teacher': 'teacher',
  'service_provider': 'service_provider',
  'paraeducator': 'paraeducator'
};

// --- Role Descriptions for UI ---
export const ROLE_DESCRIPTIONS = {
  admin: 'System Administrator - Full access to all features and settings',
  school_admin: 'School Administrator - Manage students, aides, and users (no system settings)',
  staff_view: 'Staff Viewer - IEP access for counselors, nurses, intervention specialists',
  staff_edit: 'Staff Editor - Edit all students, no admin panel access',
  admin_504: '504 Plan Coordinator - Manage 504 plans, students, and aides',
  sped_chair: 'Special Education Chair - Manage special education programs',
  case_manager: 'Case Manager - Manage assigned student caseload only',
  teacher: 'Teacher - View students in assigned classes',
  service_provider: 'Service Provider - Manage students receiving services',
  paraeducator: 'Paraeducator - View assigned students only'
};