// Unit tests for message CRUD operations
// Tests the MessageService following the mandatory development cycle

import { MessageService } from '@/lib/database/messages'
import { MessageValidator } from '@/lib/database/validation'
import type { Message } from '@/types/chat'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
          range: jest.fn(),
        })),
        order: jest.fn(() => ({
          range: jest.fn(),
        })),
        count: 'exact',
        head: true,
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
  },
  createResult: jest.fn((data, error = null) => ({ data, error })),
  isDatabaseError: jest.fn((error) => error && typeof error.code === 'string')
}))

describe('MessageService', () => {
  const mockMessage: Message = {
    id: 'test-message-id',
    conversation_id: 'test-conversation-id',
    role: 'user',
    content: 'Test message content',
    created_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getConversationMessages', () => {
    it('should return messages for a conversation', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      const mockQuery = {
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [mockMessage],
            error: null
          })
        })
      }
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockQuery)
        })
      })

      const result = await MessageService.getConversationMessages('test-conversation-id')

      expect(result.data).toEqual([mockMessage])
      expect(result.error).toBeNull()
    })

    it('should handle pagination options', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      const mockRange = jest.fn().mockResolvedValue({ data: [mockMessage], error: null })
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder
          })
        })
      })

      const options = { limit: 50, offset: 10, orderBy: 'created_at' as const, ascending: false }
      await MessageService.getConversationMessages('test-conversation-id', options)

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockRange).toHaveBeenCalledWith(10, 59) // offset to offset + limit - 1
    })
  })

  describe('createMessage', () => {
    const validCreateData = {
      conversation_id: 'test-conversation-id',
      role: 'user' as const,
      content: 'Test message'
    }

    it('should create a message with valid data', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      
      // Mock conversation check
      const mockConversationCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-conversation-id' },
              error: null
            })
          })
        })
      }

      // Mock message insert
      const mockInsert = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessage,
              error: null
            })
          })
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationCheck) // First call for conversation check
        .mockReturnValueOnce(mockInsert) // Second call for message insert

      const result = await MessageService.createMessage(validCreateData)

      expect(result.data).toEqual(mockMessage)
      expect(result.error).toBeNull()
    })

    it('should handle invalid conversation', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      })

      const result = await MessageService.createMessage(validCreateData)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        code: 'INVALID_CONVERSATION',
        message: 'Conversation not found or access denied'
      })
    })
  })

  describe('getMessageCount', () => {
    it('should return message count for a conversation', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 5,
            error: null
          })
        })
      })

      const result = await MessageService.getMessageCount('test-conversation-id')

      expect(result.data).toBe(5)
      expect(result.error).toBeNull()
    })
  })

  describe('getLatestMessage', () => {
    it('should return the latest message in a conversation', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMessage,
                  error: null
                })
              })
            })
          })
        })
      })

      const result = await MessageService.getLatestMessage('test-conversation-id')

      expect(result.data).toEqual(mockMessage)
      expect(result.error).toBeNull()
    })

    it('should handle no messages found gracefully', async () => {
      const mockSupabaseClient = require('@/lib/supabase').supabaseClient
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows returned' }
                })
              })
            })
          })
        })
      })

      const result = await MessageService.getLatestMessage('test-conversation-id')

      expect(result.data).toBeNull()
      expect(result.error).toBeNull() // Should not treat this as an error
    })
  })
})

describe('MessageValidator', () => {
  describe('validateCreateData', () => {
    const validData = {
      conversation_id: 'test-conversation-id',
      role: 'user' as const,
      content: 'Test message content'
    }

    it('should validate correct data', () => {
      const result = MessageValidator.validateCreateData(validData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing conversation_id', () => {
      const invalidData = { ...validData, conversation_id: '' }
      const result = MessageValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Conversation ID is required and must be a string')
    })

    it('should reject invalid role', () => {
      const invalidData = { ...validData, role: 'invalid' as any }
      const result = MessageValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Role must be either "user" or "assistant"')
    })

    it('should reject empty content', () => {
      const invalidData = { ...validData, content: '   ' }
      const result = MessageValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content cannot be empty')
    })

    it('should reject overly long content', () => {
      const invalidData = { ...validData, content: 'A'.repeat(10001) }
      const result = MessageValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content must be 10,000 characters or less')
    })

    it('should validate metadata object', () => {
      const dataWithMetadata = { ...validData, metadata: { key: 'value' } }
      const result = MessageValidator.validateCreateData(dataWithMetadata)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid metadata', () => {
      const invalidData = { ...validData, metadata: [] as any }
      const result = MessageValidator.validateCreateData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Metadata must be a valid object')
    })
  })

  describe('sanitizeContent', () => {
    it('should remove null bytes', () => {
      const dirty = 'Hello\0World'
      const clean = MessageValidator.sanitizeContent(dirty)
      expect(clean).toBe('HelloWorld')
    })

    it('should normalize line endings', () => {
      const dirty = 'Hello\r\nWorld\rTest'
      const clean = MessageValidator.sanitizeContent(dirty)
      expect(clean).toBe('Hello\nWorld\nTest')
    })

    it('should trim content', () => {
      const dirty = '  Hello World  '
      const clean = MessageValidator.sanitizeContent(dirty)
      expect(clean).toBe('Hello World')
    })
  })
})