// src/config/roles.js

export const USER_ROLES = {
  ADMIN: 'admin',
  ADMINISTRATOR: 'administrator',
  ADMIN_504_CM: 'administrator_504_CM',
  SPED_CHAIR: 'sped_chair',
  CASE_MANAGER: 'case_manager',
  TEACHER: 'teacher',
  SERVICE_PROVIDER: 'service_provider'
}

export const VALID_ROLES = Object.values(USER_ROLES)

export const STAFF_ROLES = [
  USER_ROLES.TEACHER,
  USER_ROLES.CASE_MANAGER,
  USER_ROLES.SERVICE_PROVIDER
]

export const ADMIN_ONLY = [
  USER_ROLES.ADMIN,
  USER_ROLES.ADMINISTRATOR,
  USER_ROLES.ADMIN_504_CM,
  USER_ROLES.SPED_CHAIR
]

export const PERMISSIONS_BY_ROLE = {
  [USER_ROLES.ADMIN]: ['manage_users', 'edit_all', 'view_all'],
  [USER_ROLES.TEACHER]: ['view_students', 'edit_grades'],
  [USER_ROLES.CASE_MANAGER]: ['edit_students'],
  // ...add others
}
