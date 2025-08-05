import { validateRole, validateEmail, sanitizeString, checkSecurityThreats } from '../src/utils/validation.js'

describe('Validation Utilities', () => {
  describe('validateRole', () => {
    test('should accept valid roles', () => {
      const validRoles = [
        'admin', 'school_admin', 'staff_view', 'staff_edit', 'admin_504',
        'sped_chair', 'case_manager', 'teacher', 'service_provider', 'paraeducator'
      ]
      
      validRoles.forEach(role => {
        const result = validateRole(role)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    test('should reject invalid roles', () => {
      const invalidRoles = [
        'invalid_role', 'admin_user', 'teacher_assistant', 'super_admin',
        'student', 'parent', '', null, undefined
      ]
      
      invalidRoles.forEach(role => {
        const result = validateRole(role)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Invalid role')
      })
    })

    test('should be case sensitive', () => {
      const result = validateRole('ADMIN')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid role')
    })
  })

  describe('validateEmail', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'admin@school.edu',
        'user+tag@example.com'
      ]
      
      validEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
        null,
        undefined
      ]
      
      invalidEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Invalid email format')
      })
    })
  })

  describe('sanitizeString', () => {
    test('should remove dangerous characters', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'onclick="alert(\'xss\')"',
        'onload="alert(\'xss\')"'
      ]
      
      dangerousInputs.forEach(input => {
        const sanitized = sanitizeString(input)
        expect(sanitized).not.toContain('<')
        expect(sanitized).not.toContain('>')
        expect(sanitized).not.toContain('"')
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain('&')
      })
    })

    test('should preserve safe content', () => {
      const safeInputs = [
        'John Smith',
        'john.smith@school.org',
        '123456',
        'teacher',
        'SLP'
      ]
      
      safeInputs.forEach(input => {
        const sanitized = sanitizeString(input)
        expect(sanitized).toBe(input)
      })
    })

    test('should handle null and undefined', () => {
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
    })
  })

  describe('checkSecurityThreats', () => {
    test('should detect SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "SELECT * FROM users",
        "INSERT INTO users VALUES",
        "UPDATE users WHERE id = 1",
        "DELETE FROM users WHERE id = 1"
      ]
      
      sqlInjectionAttempts.forEach(input => {
        const result = checkSecurityThreats(input)
        expect(result.isSafe).toBe(false)
        expect(result.threats.length).toBeGreaterThan(0)
      })
    })

    test('should detect XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'onload=alert("xss")',
        'onerror=alert("xss")'
      ]
      
      xssAttempts.forEach(input => {
        const result = checkSecurityThreats(input)
        expect(result.isSafe).toBe(false)
        expect(result.threats.length).toBeGreaterThan(0)
      })
    })

    test('should detect command injection attempts', () => {
      const commandInjectionAttempts = [
        '../etc/passwd',
        '..\\windows\\system32',
        '%2e%2e%2fetc%2fpasswd',
        '%2e%2e%5cwindows%5csystem32'
      ]
      
      commandInjectionAttempts.forEach(input => {
        const result = checkSecurityThreats(input)
        expect(result.isSafe).toBe(false)
        expect(result.threats.length).toBeGreaterThan(0)
      })
    })

    test('should accept safe input', () => {
      const safeInputs = [
        'John Smith',
        'john.smith@school.org',
        '123456',
        'teacher',
        'SLP',
        'Speech-Language Therapy'
      ]
      
      safeInputs.forEach(input => {
        const result = checkSecurityThreats(input)
        expect(result.isSafe).toBe(true)
        expect(result.threats).toEqual([])
      })
    })
  })
}) 