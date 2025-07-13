export const VALID_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider",
  "paraeducator"
];

// Useful role groups for route guards
export const STUDENT_ACCESS_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider",
  "paraeducator"
];

export const ADMIN_ONLY = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair"
];

// --- Permission Actions ---
export const PERMISSION_ACTIONS = {
  VIEW_USERS: "view_users",
  EDIT_USER: "edit_user",
  DELETE_USER: "delete_user",
  MANAGE_SUBJECTS: "manage_subjects",
  MANAGE_ROLES: "manage_roles",
  VIEW_STUDENTS: "view_students",
  EDIT_STUDENT_CM: "edit_student_CM",      // Case Manager: edit students on their caseload
  EDIT_STUDENT_ALL: "edit_student_All",    // Sped Chair/Admin: edit any student
  TESTING: "testing",                      // Legacy - kept for backward compatibility
  TESTING_ALL: "testing_all",              // Full testing access to all students
  TESTING_PARTIAL: "testing_partial"       // Testing access to assigned students only
};

// --- Permissions Matrix ---
// This matrix matches the Firebase security rules exactly
export const PERMISSIONS_MATRIX = {
  admin: [
    // Admin has all permissions (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.MANAGE_SUBJECTS,
    PERMISSION_ACTIONS.MANAGE_ROLES,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.TESTING_ALL
  ],
  administrator: [
    // Administrator has most permissions (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.MANAGE_SUBJECTS,
    PERMISSION_ACTIONS.MANAGE_ROLES,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.TESTING_ALL
  ],
  administrator_504_CM: [
    // 504 CM Admin has user management and student editing (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.MANAGE_SUBJECTS,
    PERMISSION_ACTIONS.MANAGE_ROLES,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL
  ],
  sped_chair: [
    // SPED Chair has admin-level student access but limited user management (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL
  ],
  case_manager: [
    // Case Manager can view users/students, edit own caseload (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_CM,
    PERMISSION_ACTIONS.TESTING_PARTIAL
  ],
  teacher: [
    // Teacher can view users/students only (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.TESTING_PARTIAL
  ],
  service_provider: [
    // Service Provider can view users/students only (matches Firebase rules)
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.TESTING_PARTIAL
  ],
  paraeducator: [
    // Paraeducator can view users/students only (matches Firebase rules)
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
    case "sped_chair":
      return true;
    case "case_manager":
      return isOwnCase;
    case "administrator_504_CM":
      return isOwnCase && student.plan === "504";
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