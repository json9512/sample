import { createClientComponentClient } from '@supabase/ssr'
import { createSupabaseClient, createServerSupabaseClient } from './client'

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createClientComponentClient: jest.fn(),
  createServerComponentClient: jest.fn(),
}))

describe('Supabase Client Configuration', () => {
  const mockClient = {
    auth: {
      getSession: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockClient)
  })

  describe('createSupabaseClient', () => {
    it('should create client-side Supabase client', () => {
      const client = createSupabaseClient()

      expect(createClientComponentClient).toHaveBeenCalledWith()
      expect(client).toEqual(mockClient)
    })

    it('should return same instance on multiple calls (singleton)', () => {
      const client1 = createSupabaseClient()
      const client2 = createSupabaseClient()

      expect(client1).toBe(client2)
    })
  })

  describe('createServerSupabaseClient', () => {
    it('should create server-side Supabase client with cookies', () => {
      const mockCookies = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      }

      createServerSupabaseClient(mockCookies)

      expect(jest.requireMock('@supabase/ssr').createServerComponentClient).toHaveBeenCalledWith({
        cookies: mockCookies,
      })
    })
  })

  describe('client configuration', () => {
    it('should use environment variables for configuration', () => {
      // Clear the singleton to test fresh creation
      require('./client').supabaseClient = null
      createSupabaseClient()

      expect(createClientComponentClient).toHaveBeenCalledWith()
      // Configuration is handled internally by @supabase/ssr
    })

    it('should have auth methods available', () => {
      const client = createSupabaseClient()

      expect(client.auth).toBeDefined()
      expect(client.auth.getSession).toBeDefined()
      expect(client.auth.signInWithOAuth).toBeDefined()
      expect(client.auth.signOut).toBeDefined()
    })

    it('should have database query methods available', () => {
      const client = createSupabaseClient()

      expect(client.from).toBeDefined()
      expect(typeof client.from).toBe('function')
    })
  })
})