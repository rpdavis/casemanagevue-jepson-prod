export const VALID_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider"
];

export const STAFF_ROLES = [
  "teacher",
  "case_manager",
  "service_provider"
];

export const ADMIN_ONLY = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair"
];

// Useful role groups for guardPage()
export const STUDENT_ACCESS_ROLES = [
  "admin",
  "administrator",
  "administrator_504_CM",
  "sped_chair",
  "case_manager",
  "teacher",
  "service_provider"
];

export const CASE_MANAGEMENT_ROLES = [
  "admin",
  "sped_chair",
  "case_manager",
  "administrator_504_CM"
];

export function isApprovedRole(role) {
  return VALID_ROLES.includes(role);
}

/**
 * Determines whether a user can edit a student’s data
 */
export function canEditStudent(student, currentUser) {
  if (!currentUser) return false;

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