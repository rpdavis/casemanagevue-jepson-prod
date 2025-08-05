import { config } from '@vue/test-utils'

// Mock fetch for Firebase rules testing
if (typeof fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: new Map(),
      status: 200
    })
  )
}

// Mock Firebase
global.firebase = {
  auth: () => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  }),
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      get: jest.fn()
    }))
  }),
  functions: () => ({
    httpsCallable: jest.fn()
  }),
  storage: () => ({
    ref: jest.fn(() => ({
      put: jest.fn(),
      getDownloadURL: jest.fn()
    }))
  })
}

// Mock Vue Router
jest.mock('vue-router', () => ({
  createRouter: jest.fn(),
  createWebHistory: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/'
  })
}))

// Mock Pinia
jest.mock('pinia', () => ({
  createPinia: jest.fn(),
  defineStore: jest.fn()
}))

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock TextEncoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      return Buffer.from(str, 'utf8')
    }
  }
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(buffer) {
      return Buffer.from(buffer).toString('utf8')
    }
  }
}

// Mock ReadableStream for Firebase rules testing
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor(source) {
      this.source = source
    }
    
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        cancel: () => Promise.resolve(),
        releaseLock: () => {}
      }
    }
  }
}

// Mock WritableStream for Firebase rules testing
if (typeof WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {
    constructor(sink) {
      this.sink = sink
    }
    
    getWriter() {
      return {
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: () => Promise.resolve(),
        releaseLock: () => {}
      }
    }
  }
} 