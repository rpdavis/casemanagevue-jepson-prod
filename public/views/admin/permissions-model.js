console.log("model");
import {
  VALID_ROLES,
  STAFF_ROLES,
  ADMIN_ONLY,
  STUDENT_ACCESS_ROLES,
  CASE_MANAGEMENT_ROLES
} from '../../firebase/roles.js';

// Define all permission actions here:
export const PERMISSION_ACTIONS = {
  VIEW_USERS: "view_users",
  EDIT_USER: "edit_user",
  DELETE_USER: "delete_user",
  MANAGE_SUBJECTS: "manage_subjects",
  MANAGE_ROLES: "manage_roles",
  VIEW_STUDENTS: "view_students",
  EDIT_STUDENT: "edit_student"
  // Add more as needed
};

// Default permissions matrix for each role
export const PERMISSIONS_MATRIX = {
  admin: [
    ...Object.values(PERMISSION_ACTIONS)
  ],
  administrator: [
    ...Object.values(PERMISSION_ACTIONS)
  ],
  administrator_504_CM: [
    ...Object.values(PERMISSION_ACTIONS)
  ],
  sped_chair: [
    ...Object.values(PERMISSION_ACTIONS)
  ],
  case_manager: [
    PERMISSION_ACTIONS.VIEW_USERS,
    PERMISSION_ACTIONS.EDIT_USER,
    PERMISSION_ACTIONS.VIEW_STUDENTS,
    PERMISSION_ACTIONS.EDIT_STUDENT
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