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

/**
 * Determines whether a user can edit a student’s data.
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