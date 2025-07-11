// Input Validation and Sanitization Utilities
// Provides comprehensive security validation for all user inputs

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VALID_ROLES = [
  'admin',
  'administrator', 
  'administrator_504_CM',
  'sped_chair',
  'case_manager',
  'teacher',
  'service_provider',
  'paraeducator'
]

const VALID_GRADES = [
  'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'TK', 'Pre-K', 'Ungraded'
]

const VALID_PLAN_TYPES = ['IEP', '504']

const VALID_PROVIDERS = [
  'SLP', 'OT', 'PT', 'SC', 'MH', 'TR', 'AUD', 'VI', 'AT', 'DHH', 'O&M', 'BIS', 'HN', 'SW'
]

const VALID_FILE_TYPES = {
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv'],
  excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}

// ─── SANITIZATION FUNCTIONS ───────────────────────────────────────────────────
/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Raw input string
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return ''
  }

  let sanitized = input

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Trim whitespace
  if (options.trim !== false) {
    sanitized = sanitized.trim()
  }

  // Remove HTML tags if specified
  if (options.stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }

  // Escape HTML entities
  if (options.escapeHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // Remove potentially dangerous characters
  if (options.removeDangerous) {
    sanitized = sanitized.replace(/[<>'"&]/g, '')
  }

  // Limit length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength)
  }

  return sanitized
}

/**
 * Sanitize email input
 * @param {string} email - Raw email string
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return ''
  }

  return email.toLowerCase().trim()
}

/**
 * Sanitize numeric input
 * @param {any} input - Raw numeric input
 * @param {Object} options - Sanitization options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const num = parseFloat(input)
  
  if (isNaN(num)) {
    return null
  }

  // Apply min/max constraints
  if (options.min !== undefined && num < options.min) {
    return options.min
  }
  
  if (options.max !== undefined && num > options.max) {
    return options.max
  }

  // Round to specified decimal places
  if (options.decimals !== undefined) {
    return Math.round(num * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals)
  }

  return num
}

/**
 * Sanitize date input
 * @param {string} dateString - Raw date string
 * @returns {string|null} ISO date string or null if invalid
 */
export function sanitizeDate(dateString) {
  if (!dateString) return null
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return null
  }

  // Return ISO date string (YYYY-MM-DD)
  return date.toISOString().split('T')[0]
}

// ─── VALIDATION FUNCTIONS ─────────────────────────────────────────────────────
/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export function validateRequired(value, fieldName) {
  const isEmpty = value === null || value === undefined || 
                  (typeof value === 'string' && value.trim() === '') ||
                  (Array.isArray(value) && value.length === 0)
  
  return {
    isValid: !isEmpty,
    error: isEmpty ? `${fieldName} is required` : null
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)
  
  return {
    isValid,
    error: isValid ? null : 'Invalid email format'
  }
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateStringLength(value, options = {}) {
  if (typeof value !== 'string') {
    return { isValid: false, error: 'Value must be a string' }
  }

  const { min = 0, max = Infinity, fieldName = 'Field' } = options
  const length = value.length

  if (length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` }
  }

  if (length > max) {
    return { isValid: false, error: `${fieldName} must be no more than ${max} characters` }
  }

  return { isValid: true, error: null }
}

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {Object} Validation result
 */
export function validateRole(role) {
  const isValid = VALID_ROLES.includes(role)
  
  return {
    isValid,
    error: isValid ? null : `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`
  }
}

/**
 * Validate grade
 * @param {string} grade - Grade to validate
 * @returns {Object} Validation result
 */
export function validateGrade(grade) {
  const isValid = VALID_GRADES.includes(grade)
  
  return {
    isValid,
    error: isValid ? null : `Invalid grade. Valid grades: ${VALID_GRADES.join(', ')}`
  }
}

/**
 * Validate plan type
 * @param {string} plan - Plan type to validate
 * @returns {Object} Validation result
 */
export function validatePlanType(plan) {
  const isValid = VALID_PLAN_TYPES.includes(plan)
  
  return {
    isValid,
    error: isValid ? null : `Invalid plan type. Valid types: ${VALID_PLAN_TYPES.join(', ')}`
  }
}

/**
 * Validate provider type
 * @param {string} provider - Provider type to validate
 * @returns {Object} Validation result
 */
export function validateProvider(provider) {
  if (!provider) return { isValid: true, error: null } // Optional field
  
  const isValid = VALID_PROVIDERS.includes(provider)
  
  return {
    isValid,
    error: isValid ? null : `Invalid provider type. Valid types: ${VALID_PROVIDERS.join(', ')}`
  }
}

/**
 * Validate SSID format
 * @param {string} ssid - SSID to validate
 * @returns {Object} Validation result
 */
export function validateSSID(ssid) {
  if (!ssid) {
    return { isValid: false, error: 'SSID is required' }
  }

  // SSID should be 10 digits
  const ssidRegex = /^\d{10}$/
  const isValid = ssidRegex.test(ssid)
  
  return {
    isValid,
    error: isValid ? null : 'SSID must be exactly 10 digits'
  }
}

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateFile(file, options = {}) {
  if (!file) {
    return { isValid: true, error: null } // Optional in most cases
  }

  const {
    allowedTypes = ['pdf'],
    maxSize = 10 * 1024 * 1024, // 10MB default
    fieldName = 'File'
  } = options

  // Check file type
  const allowedMimeTypes = allowedTypes.flatMap(type => VALID_FILE_TYPES[type] || [])
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `${fieldName} must be of type: ${allowedTypes.join(', ')}`
    }
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      isValid: false,
      error: `${fieldName} must be smaller than ${maxSizeMB}MB`
    }
  }

  return { isValid: true, error: null }
}

// ─── COMPOSITE VALIDATION FUNCTIONS ──────────────────────────────────────────
/**
 * Validate student data
 * @param {Object} studentData - Student data to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with all errors
 */
export function validateStudentData(studentData, options = {}) {
  const errors = []
  const { isNew = false } = options

  // Required fields
  if (isNew) {
    const ssidResult = validateSSID(studentData.ssid)
    if (!ssidResult.isValid) errors.push(ssidResult.error)
  }

  const firstNameResult = validateRequired(studentData.firstName, 'First Name')
  if (!firstNameResult.isValid) errors.push(firstNameResult.error)

  const lastNameResult = validateRequired(studentData.lastName, 'Last Name')
  if (!lastNameResult.isValid) errors.push(lastNameResult.error)

  const gradeResult = validateGrade(studentData.grade)
  if (!gradeResult.isValid) errors.push(gradeResult.error)

  // Plan validation - only if plan is provided
  if (studentData.plan) {
    const planResult = validatePlanType(studentData.plan)
    if (!planResult.isValid) errors.push(planResult.error)
  }

  // Optional fields with validation
  if (studentData.reviewDate) {
    const sanitizedDate = sanitizeDate(studentData.reviewDate)
    if (!sanitizedDate) errors.push('Invalid review date format')
  }

  if (studentData.reevalDate) {
    const sanitizedDate = sanitizeDate(studentData.reevalDate)
    if (!sanitizedDate) errors.push('Invalid reevaluation date format')
  }

  if (studentData.meetingDate) {
    const sanitizedDate = sanitizeDate(studentData.meetingDate)
    if (!sanitizedDate) errors.push('Invalid meeting date format')
  }

  // Validate text fields length
  const textFields = [
    { field: 'firstName', max: 50 },
    { field: 'lastName', max: 50 },
    { field: 'instruction', max: 2000 },
    { field: 'assessment', max: 2000 }
  ]

  textFields.forEach(({ field, max }) => {
    if (studentData[field]) {
      const lengthResult = validateStringLength(studentData[field], { max, fieldName: field })
      if (!lengthResult.isValid) errors.push(lengthResult.error)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result with all errors
 */
export function validateUserData(userData) {
  const errors = []

  // Required fields
  const nameResult = validateRequired(userData.name, 'Name')
  if (!nameResult.isValid) errors.push(nameResult.error)

  const emailResult = validateEmail(userData.email)
  if (!emailResult.isValid) errors.push(emailResult.error)

  const roleResult = validateRole(userData.role)
  if (!roleResult.isValid) errors.push(roleResult.error)

  // Optional provider validation
  if (userData.provider) {
    const providerResult = validateProvider(userData.provider)
    if (!providerResult.isValid) errors.push(providerResult.error)
  }

  // Validate text field lengths
  const nameLength = validateStringLength(userData.name, { min: 2, max: 100, fieldName: 'Name' })
  if (!nameLength.isValid) errors.push(nameLength.error)

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ─── SANITIZATION HELPERS ────────────────────────────────────────────────────
/**
 * Sanitize student form data
 * @param {Object} formData - Raw form data
 * @returns {Object} Sanitized form data
 */
export function sanitizeStudentFormData(formData) {
  const sanitized = {}

  // Basic string fields
  const stringFields = ['firstName', 'lastName', 'grade', 'plan', 'instruction', 'assessment']
  stringFields.forEach(field => {
    if (formData[field]) {
      sanitized[field] = sanitizeString(formData[field], { 
        trim: true, 
        maxLength: field.includes('instruction') || field.includes('assessment') ? 2000 : 100,
        removeDangerous: true
      })
    }
  })

  // SSID
  if (formData.ssid) {
    sanitized.ssid = sanitizeString(formData.ssid, { trim: true, maxLength: 10 })
  }

  // Dates
  const dateFields = ['reviewDate', 'reevalDate', 'meetingDate']
  dateFields.forEach(field => {
    if (formData[field]) {
      sanitized[field] = sanitizeDate(formData[field])
    }
  })

  // Boolean fields
  const booleanFields = ['flag1', 'flag2']
  booleanFields.forEach(field => {
    if (formData[field] !== undefined) {
      sanitized[field] = Boolean(formData[field])
    }
  })

  // Arrays (services)
  if (Array.isArray(formData.services)) {
    sanitized.services = formData.services
      .filter(service => typeof service === 'string')
      .map(service => sanitizeString(service, { trim: true, maxLength: 200 }))
      .filter(service => service.length > 0)
  }

  // Schedule object
  if (formData.schedule && typeof formData.schedule === 'object') {
    sanitized.schedule = {}
    Object.entries(formData.schedule).forEach(([period, teacherId]) => {
      if (teacherId && typeof teacherId === 'string') {
        sanitized.schedule[period] = sanitizeString(teacherId, { trim: true, maxLength: 50 })
      }
    })
  }

  return sanitized
}

/**
 * Sanitize user form data
 * @param {Object} formData - Raw form data
 * @returns {Object} Sanitized form data
 */
export function sanitizeUserFormData(formData) {
  const sanitized = {}

  // Basic string fields
  if (formData.name) {
    sanitized.name = sanitizeString(formData.name, { trim: true, maxLength: 100, removeDangerous: true })
  }

  if (formData.email) {
    sanitized.email = sanitizeEmail(formData.email)
  }

  if (formData.role) {
    sanitized.role = sanitizeString(formData.role, { trim: true, maxLength: 50 })
  }

  if (formData.provider) {
    sanitized.provider = sanitizeString(formData.provider, { trim: true, maxLength: 10 })
  }

  if (formData.aeriesId) {
    sanitized.aeriesId = sanitizeString(formData.aeriesId, { trim: true, maxLength: 20 })
  }

  return sanitized
}

// ─── SECURITY HELPERS ────────────────────────────────────────────────────────
/**
 * Check if input contains potential security threats
 * @param {string} input - Input to check
 * @returns {Object} Security check result
 */
export function checkSecurityThreats(input) {
  if (typeof input !== 'string') {
    return { isSafe: true, threats: [] }
  }

  const threats = []

  // Check for script injection
  if (/<script|javascript:|vbscript:|onload=|onerror=/i.test(input)) {
    threats.push('Script injection attempt detected')
  }

  // Check for SQL injection patterns
  if (/(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b).*(\bfrom\b|\binto\b|\bwhere\b)/i.test(input)) {
    threats.push('SQL injection pattern detected')
  }

  // Check for path traversal
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i.test(input)) {
    threats.push('Path traversal attempt detected')
  }

  // Check for null bytes
  if (input.includes('\0')) {
    threats.push('Null byte injection detected')
  }

  return {
    isSafe: threats.length === 0,
    threats
  }
}

/**
 * Rate limiting helper (basic implementation)
 * @param {string} key - Rate limit key (e.g., user ID, IP)
 * @param {number} limit - Maximum requests
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit result
 */
export function checkRateLimit(key, limit = 10, windowMs = 60000) {
  if (typeof window === 'undefined') {
    // Server-side rate limiting would be implemented differently
    return { allowed: true, remaining: limit }
  }

  const now = Date.now()
  const windowKey = `rateLimit_${key}`
  
  let requests = JSON.parse(localStorage.getItem(windowKey) || '[]')
  
  // Remove old requests outside the window
  requests = requests.filter(timestamp => now - timestamp < windowMs)
  
  if (requests.length >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  // Add current request
  requests.push(now)
  localStorage.setItem(windowKey, JSON.stringify(requests))
  
  return { allowed: true, remaining: limit - requests.length }
}

/**
 * Performs a rate-limited batch operation on Firestore documents
 * @param {Array} items - Array of items to process
 * @param {Function} operationFn - Function to perform on each batch
 * @param {number} batchSize - Size of each batch (default: 100)
 * @param {number} delayMs - Delay between batches in milliseconds (default: 1000)
 */
export const performRateLimitedBatchOperation = async (items, operationFn, batchSize = 100, delayMs = 1000) => {
  const batches = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }

  const results = []
  for (let i = 0; i < batches.length; i++) {
    try {
      const result = await operationFn(batches[i])
      results.push(result)
      
      // Add delay between batches, except for the last batch
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`Error in batch ${i + 1}:`, error)
      throw error
    }
  }

  return results
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export {
  VALID_ROLES,
  VALID_GRADES,
  VALID_PLAN_TYPES,
  VALID_PROVIDERS,
  VALID_FILE_TYPES
} 