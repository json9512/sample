// Simplified validation tests focusing on core functionality
// Tests input sanitization and validation logic

import { RequestValidator } from '@/lib/claude/validation'

describe('RequestValidator - Core Functions', () => {
  describe('sanitizeContent', () => {
    it('should remove null bytes', () => {
      const content = 'Hello\x00World'
      const sanitized = RequestValidator.sanitizeContent(content)
      expect(sanitized).toBe('HelloWorld')
    })

    it('should remove control characters', () => {
      const content = 'Hello\x01\x02\x03World'
      const sanitized = RequestValidator.sanitizeContent(content)
      expect(sanitized).toBe('HelloWorld')
    })

    it('should normalize line endings', () => {
      const content = 'Hello\r\nWorld\rTest'
      const sanitized = RequestValidator.sanitizeContent(content)
      expect(sanitized).toBe('Hello\nWorld\nTest')
    })

    it('should trim whitespace', () => {
      const content = '  Hello World  '
      const sanitized = RequestValidator.sanitizeContent(content)
      expect(sanitized).toBe('Hello World')
    })

    it('should enforce max length', () => {
      const content = 'A'.repeat(15000)
      const sanitized = RequestValidator.sanitizeContent(content)
      expect(sanitized.length).toBe(10000)
    })
  })

  describe('validateConversationHistory', () => {
    it('should validate correct message history', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ]

      const result = RequestValidator.validateConversationHistory(messages)

      expect(result.valid).toBe(true)
      expect(result.sanitized).toHaveLength(3)
    })

    it('should reject non-array input', () => {
      const result = RequestValidator.validateConversationHistory('not-array' as any)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Messages must be an array')
    })

    it('should reject too many messages', () => {
      const messages = Array.from({ length: 51 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`
      }))

      const result = RequestValidator.validateConversationHistory(messages)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Conversation history too long')
    })

    it('should sanitize message content', () => {
      const messages = [
        { role: 'user', content: '  Hello\x00World  ' },
        { role: 'assistant', content: '\r\nHi there!\r\n' }
      ]

      const result = RequestValidator.validateConversationHistory(messages)

      expect(result.valid).toBe(true)
      expect(result.sanitized![0].content).toBe('HelloWorld')
      expect(result.sanitized![1].content).toBe('Hi there!')
    })

    it('should filter out empty messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: '   ' }, // Empty after sanitization
        { role: 'user', content: 'Anyone there?' }
      ]

      const result = RequestValidator.validateConversationHistory(messages)

      expect(result.valid).toBe(true)
      expect(result.sanitized).toHaveLength(2)
    })

    it('should warn about non-alternating roles', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Are you there?' } // Consecutive user messages
      ]

      const result = RequestValidator.validateConversationHistory(messages)

      expect(result.valid).toBe(true)
      expect(result.warning).toBeDefined()
    })
  })

  describe('checkContentSafety', () => {
    it('should allow safe content', () => {
      const result = RequestValidator.checkContentSafety('Hello, how are you today?')
      expect(result.safe).toBe(true)
    })

    it('should flag potentially sensitive information', () => {
      const testCases = [
        'My API key is abc123',
        'Here is my secret token',
        'My credit card number is 1234',
        'My SSN is 123-45-6789',
        'How to hack this system'
      ]

      testCases.forEach(content => {
        const result = RequestValidator.checkContentSafety(content)
        expect(result.safe).toBe(false)
        expect(result.reason).toBeDefined()
      })
    })

    it('should be case insensitive', () => {
      const result = RequestValidator.checkContentSafety('MY API_KEY IS SECRET')
      expect(result.safe).toBe(false)
    })
  })
})