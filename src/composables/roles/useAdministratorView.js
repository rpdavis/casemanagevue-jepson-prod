import { useAdminView } from './useAdminView'

export function useAdministratorView(studentData, filterData) {
  // Use the full admin view logic for the 'administrator' role
  return useAdminView(studentData, filterData)
} 