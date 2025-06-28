export const VALID_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider"
];

// Useful role groups for route guards
export const STUDENT_ACCESS_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider"
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
  TESTING: "testing"
};

// --- Permissions Matrix ---
export const PERMISSIONS_MATRIX = {
  admin: [
    ...Object.values(PERMISSION_ACTIONS)
  ],
  administrator: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.MANAGE_SUBJECTS,
    PERMISSION_ACTIONS.MANAGE_ROLES,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
    PERMISSION_ACTIONS.TESTING
  ],
  administrator_504_CM: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.DELETE_USER,
    PERMISSION_ACTIONS.MANAGE_SUBJECTS,
    PERMISSION_ACTIONS.MANAGE_ROLES,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL
  ],
  sped_chair: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_ALL
  ],
  case_manager: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT_CM
  ],
  teacher: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.VIEW_STUDENTS
  ],
  service_provider: [
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

  const isOwnCase = student.casemanager_id === currentUser.uid;

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