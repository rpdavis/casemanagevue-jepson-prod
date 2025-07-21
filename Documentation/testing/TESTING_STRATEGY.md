# Testing Strategy & Guide

This document outlines the comprehensive testing strategy for the CaseManageVue application.

## 📋 **Overview**

CaseManageVue implements a multi-layered testing strategy to ensure security, functionality, and compliance:
- **Security Testing**: FERPA compliance and data protection
- **Unit Testing**: Individual component and function testing
- **Integration Testing**: API and database integration
- **End-to-End Testing**: Complete user workflows
- **Role-Based Testing**: Access control validation
- **Performance Testing**: Load and stress testing

## 🔒 **Security Testing**

### **FERPA Compliance Testing**
Security is the highest priority given sensitive student IEP data.

```javascript
// Security test suite
describe('FERPA Compliance', () => {
  describe('Data Access Control', () => {
    test('teachers can only access assigned students', async () => {
      const teacherUser = { uid: 'teacher123', role: 'teacher' }
      const students = await loadStudentsForUser(teacherUser)
      
      // Verify only assigned students are returned
      students.forEach(student => {
        expect(student.app.staffIds).toContain(teacherUser.uid)
      })
    })
    
    test('case managers can only access their caseload', async () => {
      const cmUser = { uid: 'cm123', role: 'case_manager' }
      const students = await loadStudentsForUser(cmUser)
      
      students.forEach(student => {
        expect(student.app.studentData.caseManagerId).toBe(cmUser.uid)
      })
    })
    
    test('paraeducators can only access assigned students', async () => {
      const aideUser = { uid: 'aide123', role: 'paraeducator' }
      const students = await loadStudentsForUser(aideUser)
      
      // Verify aide assignment
      students.forEach(student => {
        const hasAssignment = checkAideAssignment(student, aideUser.uid)
        expect(hasAssignment).toBe(true)
      })
    })
  })
  
  describe('Document Security', () => {
    test('unauthorized users cannot access student documents', async () => {
      const unauthorizedUser = { uid: 'other123', role: 'teacher' }
      const studentId = 'student456'
      
      await expect(
        accessStudentDocument(studentId, unauthorizedUser)
      ).rejects.toThrow('Access denied')
    })
    
    test('document URLs are secure and temporary', async () => {
      const docUrl = await generateDocumentUrl('student123', 'bip.pdf')
      
      expect(docUrl).toMatch(/^https:\/\/firebasestorage/)
      expect(docUrl).toMatch(/token=/)
      
      // URL should expire
      const urlParams = new URLSearchParams(docUrl.split('?')[1])
      const tokenExpiry = urlParams.get('token_expires')
      expect(new Date(tokenExpiry)).toBeAfter(new Date())
    })
  })
})
```

### **Database Security Testing**
```javascript
// Firestore Rules Testing
describe('Firestore Security Rules', () => {
  test('unauthenticated users cannot read students', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore()
    
    await expect(
      unauthedDb.collection('students').get()
    ).rejects.toThrow('permission-denied')
  })
  
  test('staffIds array enforces access control', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher123').firestore()
    
    // Should be able to read students where teacher is in staffIds
    const authorizedDoc = teacherDb.collection('students').doc('student-with-teacher')
    await expect(authorizedDoc.get()).resolves.toBeTruthy()
    
    // Should NOT be able to read students where teacher is not in staffIds  
    const unauthorizedDoc = teacherDb.collection('students').doc('student-without-teacher')
    await expect(unauthorizedDoc.get()).rejects.toThrow('permission-denied')
  })
})
```

## 🧪 **Unit Testing**

### **Composable Testing**
```javascript
// Testing Vue composables
describe('useStudentQueries', () => {
  test('should load students based on user role', async () => {
    const mockUser = { uid: 'user123', role: 'case_manager' }
    const { loadStudents } = useStudentQueries()
    
    // Mock the auth store
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      currentUser: computed(() => mockUser)
    })
    
    const students = await loadStudents()
    
    expect(students).toBeDefined()
    expect(Array.isArray(students)).toBe(true)
  })
  
  test('should verify student access correctly', async () => {
    const { verifyStudentAccess } = useStudentQueries()
    const student = { app: { staffIds: ['teacher123'] } }
    
    const hasAccess = await verifyStudentAccess(student, 'teacher123', 'teacher')
    expect(hasAccess).toBe(true)
    
    const noAccess = await verifyStudentAccess(student, 'other456', 'teacher')  
    expect(noAccess).toBe(false)
  })
})

// Testing utility functions
describe('scheduleUtils', () => {
  test('should extract teacher IDs from schedule', () => {
    const schedule = {
      period1: 'teacher123',
      period2: { teacherId: 'teacher456', coTeaching: { caseManagerId: 'cm789' } }
    }
    
    const teacherIds = getAllTeacherIdsFromSchedule(schedule)
    expect(teacherIds).toEqual(['teacher123', 'teacher456'])
  })
  
  test('should identify co-teaching arrangements', () => {
    const period = { teacherId: 'teacher123', coTeaching: { caseManagerId: 'cm456' } }
    
    expect(isCoTeachingCaseManager(period, 'cm456')).toBe(true)
    expect(isCoTeachingCaseManager(period, 'other789')).toBe(false)
  })
})
```

### **Component Testing**
```javascript
// Testing Vue components
describe('StudentTable', () => {
  test('should render student data correctly', async () => {
    const mockStudents = [
      { 
        id: 'student1',
        app: { 
          studentData: { firstName: 'John', lastName: 'Doe', grade: '7' },
          staffIds: ['teacher123']
        }
      }
    ]
    
    const wrapper = mount(StudentTable, {
      props: {
        students: mockStudents,
        userMap: { teacher123: { firstName: 'Jane', lastName: 'Smith' } },
        currentUser: { uid: 'teacher123', role: 'teacher' }
      }
    })
    
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Grade 7')
  })
  
  test('should show edit button for authorized users', async () => {
    const wrapper = mount(StudentTable, {
      props: { 
        /* props */
        currentUser: { uid: 'admin123', role: 'admin' }
      }
    })
    
    expect(wrapper.find('[data-testid="edit-button"]').exists()).toBe(true)
  })
  
  test('should hide edit button for unauthorized users', async () => {
    const wrapper = mount(StudentTable, {
      props: {
        /* props */
        currentUser: { uid: 'teacher123', role: 'teacher' }
      }
    })
    
    expect(wrapper.find('[data-testid="edit-button"]').exists()).toBe(false)
  })
})
```

## 🔗 **Integration Testing**

### **API Integration Testing**
```javascript
// Testing external API integrations
describe('Aeries API Integration', () => {
  test('should authenticate with Aeries successfully', async () => {
    const { connect } = useAeriesAPI()
    
    // Mock successful authentication response
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ access_token: 'test-token' })
    })
    
    await expect(connect()).resolves.toBeTruthy()
  })
  
  test('should handle authentication failures', async () => {
    const { connect } = useAeriesAPI()
    
    global.fetch = vi.fn().mockRejectedValue(new Error('Auth failed'))
    
    await expect(connect()).rejects.toThrow('Auth failed')
  })
})

// Testing Firebase integration
describe('Firebase Integration', () => {
  test('should save student data to Firestore', async () => {
    const studentData = {
      app: {
        studentData: { firstName: 'Test', lastName: 'Student' }
      }
    }
    
    const docRef = await addDoc(collection(db, 'students'), studentData)
    expect(docRef.id).toBeDefined()
    
    const savedDoc = await getDoc(docRef)
    expect(savedDoc.data()).toMatchObject(studentData)
  })
  
  test('should enforce security rules', async () => {
    // Test with unauthorized user
    const unauthorizedDb = testEnv.authenticatedContext('unauthorized').firestore()
    
    await expect(
      addDoc(unauthorizedDb.collection('students'), { test: 'data' })
    ).rejects.toThrow('permission-denied')
  })
})
```

### **Google Sheets Integration Testing**
```javascript
describe('Google Sheets Integration', () => {
  test('should create spreadsheet with student data', async () => {
    const { createLinkedGoogleSheet } = useGoogleSheetsIntegration()
    
    // Mock Google Sheets API
    global.gapi = {
      client: {
        sheets: {
          spreadsheets: {
            create: vi.fn().mockResolvedValue({
              result: { spreadsheetId: 'test-sheet-id' }
            })
          }
        }
      }
    }
    
    const sheetId = await createLinkedGoogleSheet()
    expect(sheetId).toBe('test-sheet-id')
  })
})
```

## 🎭 **Role-Based Testing**

### **Access Control Testing**
```javascript
// Test each role's access patterns
describe('Role-Based Access Control', () => {
  const roles = [
    'admin', 'administrator', 'sped_chair', 'administrator_504_CM',
    'case_manager', 'teacher', 'service_provider', 'paraeducator'
  ]
  
  roles.forEach(role => {
    describe(`${role} role`, () => {
      test(`should see appropriate students for ${role}`, async () => {
        const mockUser = { uid: `${role}123`, role }
        const { loadStudents } = useStudentQueries()
        
        // Mock auth store
        vi.mocked(useAuthStore).mockReturnValue({
          user: mockUser,
          currentUser: computed(() => mockUser)
        })
        
        const students = await loadStudents()
        
        // Verify role-specific access patterns
        if (['admin', 'administrator', 'sped_chair'].includes(role)) {
          // Should see all students
          expect(students.length).toBeGreaterThan(0)
        } else {
          // Should see only assigned students
          students.forEach(student => {
            const hasAccess = verifyRoleAccess(student, mockUser)
            expect(hasAccess).toBe(true)
          })
        }
      })
    })
  })
})

// Helper function to verify role-specific access
function verifyRoleAccess(student, user) {
  switch (user.role) {
    case 'teacher':
      return student.app.staffIds?.includes(user.uid)
    case 'case_manager':
      return student.app.studentData.caseManagerId === user.uid
    case 'service_provider':
      return student.app.staffIds?.includes(user.uid) ||
             Object.values(student.app.providers || {}).includes(user.uid)
    case 'paraeducator':
      return checkAideAssignment(student, user.uid)
    default:
      return false
  }
}
```

## 🎯 **End-to-End Testing**

### **User Workflow Testing**
```javascript
// Complete user journey testing
describe('Student Management Workflow', () => {
  test('admin can add new student', async () => {
    // Login as admin
    await loginAs('admin123')
    
    // Navigate to students page
    await page.goto('/students')
    
    // Click add student button
    await page.click('[data-testid="add-student-btn"]')
    
    // Fill out form
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.selectOption('[data-testid="grade"]', '7')
    await page.selectOption('[data-testid="plan"]', 'IEP')
    
    // Submit form
    await page.click('[data-testid="submit-btn"]')
    
    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible()
    
    // Verify student appears in table
    await expect(page.locator('text=John Doe')).toBeVisible()
  })
  
  test('teacher can view assigned students only', async () => {
    await loginAs('teacher123')
    await page.goto('/students')
    
    // Should only see students assigned to this teacher
    const studentRows = await page.locator('[data-testid="student-row"]').all()
    
    for (const row of studentRows) {
      const studentId = await row.getAttribute('data-student-id')
      const student = await getStudentById(studentId)
      
      expect(student.app.staffIds).toContain('teacher123')
    }
  })
})

// Teacher feedback workflow
describe('Teacher Feedback Workflow', () => {
  test('case manager can send feedback form', async () => {
    await loginAs('case_manager123')
    await page.goto('/students')
    
    // Click feedback button for a student
    await page.click('[data-testid="feedback-btn"]')
    
    // Select teachers
    await page.check('[data-testid="teacher-checkbox-teacher456"]')
    
    // Send form
    await page.click('[data-testid="send-feedback-btn"]')
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible()
    
    // Verify form was logged
    const logs = await getCollection('feedbackSendLog')
    expect(logs.length).toBeGreaterThan(0)
  })
})
```

## 📊 **Performance Testing**

### **Load Testing**
```javascript
// Test application performance under load
describe('Performance Testing', () => {
  test('should handle large student datasets', async () => {
    // Create 1000 mock students
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `student${i}`,
      app: {
        studentData: { 
          firstName: `Student${i}`, 
          lastName: 'Test',
          grade: `${Math.floor(Math.random() * 12) + 1}`
        },
        staffIds: ['teacher123']
      }
    }))
    
    const startTime = performance.now()
    
    const wrapper = mount(StudentTable, {
      props: {
        students: largeDataset,
        currentUser: { uid: 'teacher123', role: 'teacher' }
      }
    })
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render within reasonable time (< 1 second)
    expect(renderTime).toBeLessThan(1000)
    
    // Should display all students
    expect(wrapper.findAll('[data-testid="student-row"]')).toHaveLength(1000)
  })
  
  test('should handle rapid filter changes', async () => {
    const wrapper = mount(StudentsView)
    
    // Rapid filter changes
    for (let i = 0; i < 10; i++) {
      await wrapper.find('[data-testid="search-input"]').setValue(`test${i}`)
      await wrapper.vm.$nextTick()
    }
    
    // Should not crash and should show filtered results
    expect(wrapper.find('[data-testid="student-table"]').exists()).toBe(true)
  })
})
```

### **Memory Testing**
```javascript
describe('Memory Management', () => {
  test('should not have memory leaks', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    // Create and destroy components multiple times
    for (let i = 0; i < 100; i++) {
      const wrapper = mount(StudentTable, { props: mockProps })
      wrapper.unmount()
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(10000000) // 10MB threshold
  })
})
```

## 🔧 **Testing Setup & Configuration**

### **Test Environment Setup**
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts'
      ]
    }
  }
})
```

### **Test Utilities**
```javascript
// src/test/utils.js
export const mockUser = (role, uid = null) => ({
  uid: uid || `${role}123`,
  role,
  email: `${role}@test.com`,
  displayName: `Test ${role}`
})

export const mockStudent = (overrides = {}) => ({
  id: 'student123',
  app: {
    studentData: {
      firstName: 'John',
      lastName: 'Doe',
      grade: '7',
      plan: 'IEP',
      caseManagerId: 'cm123'
    },
    staffIds: ['teacher123'],
    schedule: {
      periods: {
        period1: 'teacher123',
        period2: 'teacher456'
      }
    },
    ...overrides
  }
})

export const loginAs = async (userId) => {
  // Mock authentication for testing
  const mockAuth = {
    currentUser: { uid: userId },
    signInWithCredential: vi.fn()
  }
  
  vi.mocked(getAuth).mockReturnValue(mockAuth)
}
```

## 📈 **Continuous Integration**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

### **Test Scripts**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --reporter=verbose",
    "test:security": "vitest run --config vitest.security.config.js",
    "test:integration": "vitest run --config vitest.integration.config.js",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## 📊 **Test Coverage Goals**

### **Coverage Targets**
- **Overall Coverage**: 85%+
- **Security Functions**: 100%
- **Critical Composables**: 95%+
- **Components**: 80%+
- **Utilities**: 90%+

### **Priority Areas**
1. **Security & Access Control**: 100% coverage required
2. **Data Processing**: High coverage for student data handling
3. **API Integrations**: Comprehensive error handling tests
4. **Role-Based Views**: Complete role coverage
5. **Form Validation**: All validation paths tested

---

**Last Updated**: July 2025  
**Test Frameworks**: Vitest, Playwright, Firebase Test SDK  
**Coverage**: 85%+ overall, 100% security functions 