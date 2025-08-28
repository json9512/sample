// Unit tests for conversation CRUD operations
// Tests the ConversationService following the mandatory development cycle

import { ConversationService } from '@/lib/database/conversations'
import { ConversationValidator } from '@/lib/database/validation'
import type { Conversation } from '@/types/chat'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          single: jest.fn(),
        })),
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
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
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    }
  },
  createResult: jest.fn((data, error = null) => ({ data, error })),
  isDatabaseError: jest.fn((error) => error && typeof error.code === 'string')
}))

describe('ConversationService', () => {
  const mockConversation: Conversation = {
    id: 'test-conversation-id',
    user_id: 'test-user-id',
    title: 'Test Conversation',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserConversations', () => {
    it('should return user conversations ordered by updated_at desc', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [mockConversation],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await ConversationService.getUserConversations()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data).toEqual([mockConversation])
      expect(result.error).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      const mockError = { code: 'DB_ERROR', message: 'Database error' }
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      })

      const result = await ConversationService.getUserConversations()

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('createConversation', () => {
    const validCreateData = {
      title: 'New Conversation'
    }

    it('should create a conversation with valid data', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockConversation,
              error: null
            })
          })
        })
      })

      const result = await ConversationService.createConversation(validCreateData)

      expect(result.data).toEqual(mockConversation)
      expect(result.error).toBeNull()
    })

    it('should handle authentication errors', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await ConversationService.createConversation(validCreateData)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        code: 'AUTH_ERROR',
        message: 'User not authenticated'
      })
    })
  })

  describe('updateConversation', () => {
    const updateData = { title: 'Updated Title' }

    it('should update a conversation successfully', async () => {
      const updatedConversation = { ...mockConversation, title: 'Updated Title' }
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedConversation,
                error: null
              })
            })
          })
        })
      })

      const result = await ConversationService.updateConversation('test-id', updateData)

      expect(result.data).toEqual(updatedConversation)
      expect(result.error).toBeNull()
    })
  })

  describe('deleteConversation', () => {
    it('should delete a conversation successfully', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

      const result = await ConversationService.deleteConversation('test-id')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('generateConversationTitle', () => {
    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(60)
      const title = ConversationService.generateConversationTitle(longMessage)
      
      expect(title).toHaveLength(50)
      expect(title.endsWith('...')).toBe(true)
    })

    it('should handle short messages', () => {
      const shortMessage = 'Hello world'
      const title = ConversationService.generateConversationTitle(shortMessage)
      
      expect(title).toBe(shortMessage)
    })

    it('should provide fallback for empty messages', () => {
      const title = ConversationService.generateConversationTitle('')
      expect(title).toBe('New Conversation')
    })

    it('should normalize whitespace', () => {
      const messyMessage = '  Hello\n\n  world  \t'
      const title = ConversationService.generateConversationTitle(messyMessage)
      expect(title).toBe('Hello world')
    })
  })
})

describe('ConversationValidator', () => {
  describe('validateCreateData', () => {
    it('should validate correct data', () => {
      const validData = { title: 'Test Conversation' }
      const result = ConversationValidator.validateCreateData(validData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing title', () => {
      const invalidData = {} as any
      const result = ConversationValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required and must be a string')
    })

    it('should reject empty title', () => {
      const invalidData = { title: '   ' }
      const result = ConversationValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title cannot be empty')
    })

    it('should reject overly long title', () => {
      const invalidData = { title: 'A'.repeat(201) }
      const result = ConversationValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title must be 200 characters or less')
    })
  })

  describe('sanitizeTitle', () => {
    it('should trim and normalize whitespace', () => {
      const messy = '  Hello   world  '
      const clean = ConversationValidator.sanitizeTitle(messy)
      expect(clean).toBe('Hello world')
    })
  })
})