import { createUserProfile, getUserProfile, updateUserProfile, syncUserFromAuth } from './userService'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}

jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}))

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should fetch user profile by id', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2023-01-01T00:00:00Z',
      }

      const mockSelect = mockSupabaseClient.from().select()
      const mockEq = mockSelect.eq()
      mockEq.single.mockResolvedValue({ data: mockUser, error: null })

      const result = await getUserProfile('123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockSelect.eq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(mockUser)
    })

    it('should handle user not found', async () => {
      const mockSelect = mockSupabaseClient.from().select()
      const mockEq = mockSelect.eq()
      mockEq.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'User not found' } 
      })

      const result = await getUserProfile('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw error for database errors', async () => {
      const mockSelect = mockSupabaseClient.from().select()
      const mockEq = mockSelect.eq()
      const dbError = { code: 'PGRST001', message: 'Database error' }
      mockEq.single.mockResolvedValue({ data: null, error: dbError })

      await expect(getUserProfile('123')).rejects.toThrow('Database error')
    })
  })

  describe('createUserProfile', () => {
    it('should create new user profile', async () => {
      const newUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      }

      const mockUpsert = mockSupabaseClient.from().upsert()
      const mockSelect = mockUpsert.select()
      mockSelect.single.mockResolvedValue({ data: newUser, error: null })

      const result = await createUserProfile(newUser)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockUpsert.select).toHaveBeenCalled()
      expect(result).toEqual(newUser)
    })

    it('should handle creation errors', async () => {
      const newUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      }

      const mockUpsert = mockSupabaseClient.from().upsert()
      const mockSelect = mockUpsert.select()
      const dbError = { code: 'PGRST001', message: 'Creation failed' }
      mockSelect.single.mockResolvedValue({ data: null, error: dbError })

      await expect(createUserProfile(newUser)).rejects.toThrow('Creation failed')
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
        avatar_url: 'https://example.com/new-avatar.jpg',
      }

      const updatedUser = {
        id: '123',
        email: 'test@example.com',
        ...updates,
      }

      const mockUpdate = mockSupabaseClient.from().update()
      const mockEq = mockUpdate.eq()
      const mockSelect = mockEq.select()
      mockSelect.single.mockResolvedValue({ data: updatedUser, error: null })

      const result = await updateUserProfile('123', updates)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(updatedUser)
    })

    it('should handle update errors', async () => {
      const updates = { name: 'Updated Name' }

      const mockUpdate = mockSupabaseClient.from().update()
      const mockEq = mockUpdate.eq()
      const mockSelect = mockEq.select()
      const dbError = { code: 'PGRST001', message: 'Update failed' }
      mockSelect.single.mockResolvedValue({ data: null, error: dbError })

      await expect(updateUserProfile('123', updates)).rejects.toThrow('Update failed')
    })
  })

  describe('syncUserFromAuth', () => {
    it('should sync user from auth metadata', async () => {
      const authUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        app_metadata: {
          provider: 'google',
        },
      }

      const syncedUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google',
      }

      const mockUpsert = mockSupabaseClient.from().upsert()
      const mockSelect = mockUpsert.select()
      mockSelect.single.mockResolvedValue({ data: syncedUser, error: null })

      const result = await syncUserFromAuth(authUser as any)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
      expect(result).toEqual(syncedUser)
    })

    it('should use email as name fallback when full_name is not available', async () => {
      const authUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: { provider: 'google' },
      }

      const mockUpsert = mockSupabaseClient.from().upsert()
      const mockSelect = mockUpsert.select()
      mockSelect.single.mockResolvedValue({ 
        data: { name: 'test' }, 
        error: null 
      })

      await syncUserFromAuth(authUser as any)

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test', // Should extract name from email
        }),
        { onConflict: 'id' }
      )
    })
  })
})