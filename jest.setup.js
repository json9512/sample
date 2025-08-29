import '@testing-library/jest-dom'

// Mock cn utility globally
jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils')
  return {
    ...actual,
    cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
  }
})

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase clients globally
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => require('./src/__mocks__/supabase').mockSupabaseClient),
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => require('./src/__mocks__/supabase').mockSupabaseClient),
}))

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    getAll: jest.fn(() => []),
  })),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
}))

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}))

// Global fetch mock
global.fetch = jest.fn()

// Mock window.location with all required methods
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  },
  writable: true,
})

// Mock crypto for PKCE
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint8Array(32)),
    subtle: {
      digest: jest.fn(),
    },
  },
})

// Mock lucide-react icons globally
const React = require('react')
jest.mock('lucide-react', () => ({
  MessageSquare: (props) => React.createElement('div', { ...props, 'data-testid': 'message-square-icon' }, 'MessageSquare'),
  Send: (props) => React.createElement('div', { ...props, 'data-testid': 'send-icon' }, 'Send'),
  Square: (props) => React.createElement('div', { ...props, 'data-testid': 'square-icon' }, 'Square'),
  Search: (props) => React.createElement('div', { ...props, 'data-testid': 'search-icon' }, 'Search'),
  X: (props) => React.createElement('div', { ...props, 'data-testid': 'x-icon' }, 'X'),
  Plus: (props) => React.createElement('div', { ...props, 'data-testid': 'plus-icon' }, 'Plus'),
  MoreVertical: (props) => React.createElement('div', { ...props, 'data-testid': 'more-vertical-icon' }, 'MoreVertical'),
  Trash2: (props) => React.createElement('div', { ...props, 'data-testid': 'trash2-icon' }, 'Trash2'),
}))

// Suppress console warnings in tests
global.console.warn = jest.fn()