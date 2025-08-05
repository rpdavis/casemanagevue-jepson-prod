import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import UserAddForm from '../src/components/UserAddForm.vue'

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn()
}))

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn()
}))

describe('UserAddForm', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    wrapper = mount(UserAddForm, {
      global: {
        plugins: [pinia],
        stubs: {
          'router-link': true,
          'router-view': true
        }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Component Rendering', () => {
    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true)
    })

    test('should show both single user and bulk import sections', () => {
      expect(wrapper.find('.add-single').exists()).toBe(true)
      expect(wrapper.find('.add-bulk').exists()).toBe(true)
    })

    test('should display role reference cards', () => {
      expect(wrapper.find('.reference-cards').exists()).toBe(true)
      expect(wrapper.find('.roles-card').exists()).toBe(true)
      expect(wrapper.find('.providers-card').exists()).toBe(true)
      expect(wrapper.find('.aeries-card').exists()).toBe(true)
    })
  })

  describe('Single User Form', () => {
    test('should have all required form fields', () => {
      const form = wrapper.find('.add-single form')
      expect(form.exists()).toBe(true)
      
      expect(wrapper.find('input[name="name"]').exists()).toBe(true)
      expect(wrapper.find('input[name="email"]').exists()).toBe(true)
      expect(wrapper.find('select[name="role"]').exists()).toBe(true)
      expect(wrapper.find('select[name="provider"]').exists()).toBe(true)
      expect(wrapper.find('input[name="aeriesId"]').exists()).toBe(true)
    })

    test('should have all valid roles in dropdown', () => {
      const roleSelect = wrapper.find('select[name="role"]')
      const options = roleSelect.findAll('option')
      
      const validRoles = [
        'admin', 'school_admin', 'staff_view', 'staff_edit', 'admin_504',
        'sped_chair', 'case_manager', 'teacher', 'service_provider', 'paraeducator'
      ]
      
      validRoles.forEach(role => {
        const option = options.find(opt => opt.text() === role)
        expect(option.exists()).toBe(true)
      })
    })

    test('should show provider dropdown when service_provider is selected', async () => {
      const roleSelect = wrapper.find('select[name="role"]')
      await roleSelect.setValue('service_provider')
      
      const providerSelect = wrapper.find('select[name="provider"]')
      expect(providerSelect.isVisible()).toBe(true)
    })

    test('should hide provider dropdown for non-service provider roles', async () => {
      const roleSelect = wrapper.find('select[name="role"]')
      await roleSelect.setValue('teacher')
      
      const providerSelect = wrapper.find('select[name="provider"]')
      expect(providerSelect.isVisible()).toBe(false)
    })
  })

  describe('Bulk Import', () => {
    test('should have file upload input', () => {
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.attributes('accept')).toContain('.csv')
      expect(fileInput.attributes('accept')).toContain('.xls')
      expect(fileInput.attributes('accept')).toContain('.xlsx')
    })

    test('should display spreadsheet example', () => {
      expect(wrapper.find('.spreadsheet-example').exists()).toBe(true)
      expect(wrapper.find('.example-table').exists()).toBe(true)
    })

    test('should show all role badges in reference', () => {
      const roleBadges = wrapper.findAll('.role-badge')
      expect(roleBadges.length).toBeGreaterThan(0)
      
      const validRoles = [
        'admin', 'school_admin', 'staff_view', 'staff_edit', 'admin_504',
        'sped_chair', 'case_manager', 'teacher', 'service_provider', 'paraeducator'
      ]
      
      validRoles.forEach(role => {
        const badge = roleBadges.find(badge => badge.text() === role)
        expect(badge.exists()).toBe(true)
      })
    })

    test('should show all provider types in reference', () => {
      const providerBadges = wrapper.findAll('.provider-badge')
      expect(providerBadges.length).toBeGreaterThan(0)
      
      const validProviders = ['SLP', 'OT', 'PT', 'SC', 'MH', 'TR', 'AUD', 'VI', 'AT', 'DHH', 'O&M', 'BIS', 'HN', 'SW']
      
      validProviders.forEach(provider => {
        const badge = providerBadges.find(badge => badge.text() === provider)
        expect(badge.exists()).toBe(true)
      })
    })
  })

  describe('Form Validation', () => {
    test('should validate email format', async () => {
      const emailInput = wrapper.find('input[name="email"]')
      
      // Test invalid email
      await emailInput.setValue('invalid-email')
      await wrapper.find('form').trigger('submit')
      
      // Should show validation error
      expect(wrapper.text()).toContain('Invalid email format')
    })

    test('should validate required fields', async () => {
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      // Should show validation errors for required fields
      expect(wrapper.text()).toContain('Name is required')
      expect(wrapper.text()).toContain('Email is required')
      expect(wrapper.text()).toContain('Role is required')
    })

    test('should validate Aeries ID format', async () => {
      const aeriesInput = wrapper.find('input[name="aeriesId"]')
      
      // Test invalid Aeries ID
      await aeriesInput.setValue('abc123')
      await wrapper.find('form').trigger('submit')
      
      // Should show validation error for non-numeric Aeries ID
      expect(wrapper.text()).toContain('Aeries ID must be numeric')
    })
  })

  describe('Security Features', () => {
    test('should sanitize user input', async () => {
      const nameInput = wrapper.find('input[name="name"]')
      
      // Test XSS attempt
      await nameInput.setValue('<script>alert("xss")</script>')
      
      // The sanitized value should not contain script tags
      expect(nameInput.element.value).not.toContain('<script>')
    })

    test('should validate file upload security', async () => {
      const fileInput = wrapper.find('input[type="file"]')
      
      // Test file type validation
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      await fileInput.trigger('change', { target: { files: [invalidFile] } })
      
      // Should show error for invalid file type
      expect(wrapper.text()).toContain('Invalid file type')
    })
  })
}) 