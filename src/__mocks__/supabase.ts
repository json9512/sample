import { jest } from '@jest/globals'

// Create a mock that can be reused across tests
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    } as any),
    onAuthStateChange: jest.fn().mockImplementation(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    })) as any,
    signOut: jest.fn().mockResolvedValue({ error: null } as any),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: { url: 'https://oauth-url.com' },
      error: null,
    } as any),
    exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null } as any),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
})

export const mockSupabaseClient = createMockSupabaseClient()