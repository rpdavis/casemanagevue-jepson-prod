// src/utils/validation.js
// Client-side security validation utilities

// ─── INPUT SANITIZATION ──────────────────────────────────────────────────────
export function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, maxLength);
}

export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().substring(0, 255);
}

export function sanitizeNumeric(input, min = 0, max = 999999) {
  const num = parseFloat(input);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

export function sanitizeDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

// ─── VALIDATION FUNCTIONS ────────────────────────────────────────────────────
export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true };
}

export function validateStringLength(value, fieldName, minLength = 0, maxLength = 255) {
  if (typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` };
  }
  
  if (value.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (value.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
  }
  
  return { isValid: true };
}

export function validateRole(role) {
  const validRoles = [
    'admin', 'school_admin', 'staff_view', 'staff_edit', 'admin_504', 'sped_chair',
    'case_manager', 'teacher', 'service_provider', 'paraeducator'
  ];
  
  if (!validRoles.includes(role)) {
    return { isValid: false, error: 'Invalid role' };
  }
  
  return { isValid: true };
}

export function validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` };
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.vbs$/i, /\.js$/i, /\.jar$/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { isValid: false, error: 'Suspicious file type detected' };
  }
  
  return { isValid: true };
}

// ─── SECURITY THREAT DETECTION ───────────────────────────────────────────────
export function checkSecurityThreats(input) {
  if (typeof input !== 'string') {
    return { isSafe: true, threats: [] };
  }
  
  const threats = [];
  
  // Check for script injection
  if (/<script|javascript:|vbscript:|onload=|onerror=/i.test(input)) {
    threats.push('Script injection attempt');
  }
  
  // Check for SQL injection patterns
  if (/(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b).*(\bfrom\b|\binto\b|\bwhere\b)/i.test(input)) {
    threats.push('SQL injection pattern');
  }
  
  // Check for path traversal
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i.test(input)) {
    threats.push('Path traversal attempt');
  }
  
  // Check for HTML injection
  if (/<[^>]*>/i.test(input)) {
    threats.push('HTML injection attempt');
  }
  
  // Check for null byte injection
  if (/\0/.test(input)) {
    threats.push('Null byte injection');
  }
  
  return {
    isSafe: threats.length === 0,
    threats
  };
}

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const rateLimitStorage = {};

export function checkRateLimit(action, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `${action}_${Math.floor(now / windowMs)}`;
  
  if (!rateLimitStorage[key]) {
    rateLimitStorage[key] = 0;
  }
  
  rateLimitStorage[key]++;
  
  if (rateLimitStorage[key] > limit) {
    return { 
      allowed: false, 
      error: `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds.` 
    };
  }
  
  // Clean up old entries
  Object.keys(rateLimitStorage).forEach(storageKey => {
    const keyTime = parseInt(storageKey.split('_').pop()) * windowMs;
    if (now - keyTime > windowMs * 2) {
      delete rateLimitStorage[storageKey];
    }
  });
  
  return { allowed: true };
}

// ─── STUDENT DATA VALIDATION ─────────────────────────────────────────────────
export function validateStudentData(data, options = {}) {
  const errors = [];
  const { isNew = false } = options;
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid student data'] };
  }
  
  // Validate student data structure
  if (!data.app || !data.app.studentData) {
    errors.push('Student data structure is invalid');
    return { isValid: false, errors };
  }
  
  const studentData = data.app.studentData;
  
  // Required fields
  const requiredFields = [
    { field: 'firstName', name: 'First Name' },
    { field: 'lastName', name: 'Last Name' },
    { field: 'caseManagerId', name: 'Case Manager' }
  ];
  
  requiredFields.forEach(({ field, name }) => {
    const validation = validateRequired(studentData[field], name);
    if (!validation.isValid) {
      errors.push(validation.error);
    }
  });
  
  // String length validations
  const stringFields = [
    { field: 'firstName', name: 'First Name', maxLength: 100 },
    { field: 'lastName', name: 'Last Name', maxLength: 100 },
    { field: 'studentId', name: 'Student ID', maxLength: 50 },
    { field: 'grade', name: 'Grade', maxLength: 10 }
  ];
  
  stringFields.forEach(({ field, name, maxLength }) => {
    if (studentData[field]) {
      const validation = validateStringLength(studentData[field], name, 1, maxLength);
      if (!validation.isValid) {
        errors.push(validation.error);
      }
    }
  });
  
  // Security threat detection
  const textFields = ['firstName', 'lastName', 'studentId', 'grade'];
  textFields.forEach(field => {
    if (studentData[field]) {
      const securityCheck = checkSecurityThreats(studentData[field]);
      if (!securityCheck.isSafe) {
        errors.push(`Security threat detected in ${field}: ${securityCheck.threats.join(', ')}`);
      }
    }
  });
  
  // Validate encrypted fields
  if (data.app.accommodations && 
      typeof data.app.accommodations !== 'string' && 
      data.app.accommodations !== null) {
    errors.push('Accommodations must be encrypted string or null');
  }
  
  if (data.app.classServices && 
      typeof data.app.classServices !== 'string' && 
      data.app.classServices !== null) {
    errors.push('Class services must be encrypted string or null');
  }
  
  if (studentData.plan && 
      typeof studentData.plan !== 'string' && 
      studentData.plan !== null) {
    errors.push('Student plan must be encrypted string or null');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ─── USER DATA VALIDATION ────────────────────────────────────────────────────
export function validateUserData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid user data'] };
  }
  
  // Required fields
  const requiredValidation = validateRequired(data.name, 'Name');
  if (!requiredValidation.isValid) errors.push(requiredValidation.error);
  
  const emailRequiredValidation = validateRequired(data.email, 'Email');
  if (!emailRequiredValidation.isValid) errors.push(emailRequiredValidation.error);
  
  const roleRequiredValidation = validateRequired(data.role, 'Role');
  if (!roleRequiredValidation.isValid) errors.push(roleRequiredValidation.error);
  
  // Email format validation
  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error);
    }
  }
  
  // Role validation
  if (data.role) {
    const roleValidation = validateRole(data.role);
    if (!roleValidation.isValid) {
      errors.push(roleValidation.error);
    }
  }
  
  // String length validations
  if (data.name) {
    const nameValidation = validateStringLength(data.name, 'Name', 1, 100);
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error);
    }
  }
  
  if (data.email) {
    const emailLengthValidation = validateStringLength(data.email, 'Email', 1, 255);
    if (!emailLengthValidation.isValid) {
      errors.push(emailLengthValidation.error);
    }
  }
  
  // Security threat detection
  const textFields = ['name', 'email'];
  textFields.forEach(field => {
    if (data[field]) {
      const securityCheck = checkSecurityThreats(data[field]);
      if (!securityCheck.isSafe) {
        errors.push(`Security threat detected in ${field}: ${securityCheck.threats.join(', ')}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ─── SANITIZATION HELPERS ────────────────────────────────────────────────────
export function sanitizeStudentFormData(formData) {
  const sanitized = { ...formData };
  
  // Handle nested app.studentData structure
  if (sanitized.app && sanitized.app.studentData) {
    const studentData = sanitized.app.studentData;
    
    // Sanitize text fields
    const textFields = ['firstName', 'lastName', 'studentId', 'grade'];
    textFields.forEach(field => {
      if (studentData[field]) {
        studentData[field] = sanitizeString(studentData[field], 100);
      }
    });
  } else {
    // Handle flat form structure (direct form fields)
    const textFields = ['firstName', 'lastName', 'studentId', 'grade'];
    textFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = sanitizeString(sanitized[field], 100);
      }
    });
  }
  
  return sanitized;
}

export function sanitizeUserFormData(formData) {
  const sanitized = { ...formData };
  
  if (sanitized.name) {
    sanitized.name = sanitizeString(sanitized.name, 100);
  }
  
  if (sanitized.email) {
    sanitized.email = sanitizeEmail(sanitized.email);
  }
  
  return sanitized;
}

// ─── FORM VALIDATION INTEGRATION ─────────────────────────────────────────────
export function validateForm(formData, validationType = 'student') {
  // Rate limiting check
  const rateLimitCheck = checkRateLimit(`validate_${validationType}`, 20, 60000);
  if (!rateLimitCheck.allowed) {
    return { isValid: false, errors: [rateLimitCheck.error] };
  }
  
  switch (validationType) {
    case 'student':
      return validateStudentData(formData);
    case 'user':
      return validateUserData(formData);
    default:
      return { isValid: false, errors: ['Unknown validation type'] };
  }
}

// ─── BATCH OPERATIONS ────────────────────────────────────────────────────────
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
// Aliases for backward compatibility
export const validateFile = validateFileUpload;
export const sanitizeNumber = sanitizeNumeric; 