// Unit tests for Claude API client
// Tests error handling, retry logic, and streaming functionality

import { ClaudeApiClient } from '@/lib/claude/client'
import type { ApiError } from '@/lib/claude/client'

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      messages: {
        stream: jest.fn(),
        create: jest.fn()
      }
    }))
  }
})

describe('ClaudeApiClient', () => {
  let client: ClaudeApiClient
  let mockAnthropic: any

  beforeEach(() => {
    // Set up environment variable
    process.env.ANTHROPIC_API_KEY = 'test-api-key-with-sufficient-length'
    
    const Anthropic = require('@anthropic-ai/sdk').default
    mockAnthropic = {
      messages: {
        stream: jest.fn(),
        create: jest.fn()
      }
    }
    Anthropic.mockReturnValue(mockAnthropic)
    
    client = new ClaudeApiClient()
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  describe('Configuration', () => {
    it('should require ANTHROPIC_API_KEY environment variable', () => {
      delete process.env.ANTHROPIC_API_KEY
      expect(() => new ClaudeApiClient()).toThrow('ANTHROPIC_API_KEY environment variable is required')
    })

    it('should validate API key format', () => {
      process.env.ANTHROPIC_API_KEY = 'short'
      expect(() => new ClaudeApiClient()).toThrow('Invalid ANTHROPIC_API_KEY format')
    })
  })

  describe('streamMessage', () => {
    const testMessages = [
      { role: 'user' as const, content: 'Hello, Claude!' }
    ]

    it('should successfully create a stream', async () => {
      const mockStream = {
        on: jest.fn().mockReturnThis()
      }
      mockAnthropic.messages.stream.mockResolvedValue(mockStream)

      const handlers = {
        onStart: jest.fn(),
        onToken: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      }

      const result = await client.streamMessage(testMessages, {}, handlers)

      expect(mockAnthropic.messages.stream).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: testMessages
      })
      expect(handlers.onStart).toHaveBeenCalled()
      expect(result).toBe(mockStream)
    })

    it('should use custom streaming options', async () => {
      const mockStream = { on: jest.fn().mockReturnThis() }
      mockAnthropic.messages.stream.mockResolvedValue(mockStream)

      const options = {
        model: 'claude-3-opus-20240229' as const,
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant'
      }

      await client.streamMessage(testMessages, options, {})

      expect(mockAnthropic.messages.stream).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        system: 'You are a helpful assistant',
        messages: testMessages
      })
    })

    it('should handle API errors with retry logic', async () => {
      const apiError = {
        status: 429,
        message: 'Rate limit exceeded',
        headers: { 'retry-after': '2' }
      }

      mockAnthropic.messages.stream
        .mockRejectedValueOnce(apiError)
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce({ on: jest.fn().mockReturnThis() })

      const handlers = {
        onError: jest.fn()
      }

      // Mock the delay function to avoid actual waiting in tests
      jest.spyOn(client as any, 'delay').mockResolvedValue(undefined)

      const result = await client.streamMessage(testMessages, {}, handlers)

      expect(mockAnthropic.messages.stream).toHaveBeenCalledTimes(3)
      expect(result).toBeDefined()
    })

    it('should fail after max retries', async () => {
      const apiError = {
        status: 429,
        message: 'Rate limit exceeded'
      }

      mockAnthropic.messages.stream.mockRejectedValue(apiError)
      jest.spyOn(client as any, 'delay').mockResolvedValue(undefined)

      const handlers = {
        onError: jest.fn()
      }

      await expect(client.streamMessage(testMessages, {}, handlers)).rejects.toMatchObject({
        type: 'rate_limit_error',
        message: 'Rate limit exceeded'
      })

      expect(mockAnthropic.messages.stream).toHaveBeenCalledTimes(3) // Initial + 2 retries
      expect(handlers.onError).toHaveBeenCalled()
    })

    it('should not retry non-retryable errors', async () => {
      const apiError = {
        status: 401,
        message: 'Authentication failed'
      }

      mockAnthropic.messages.stream.mockRejectedValue(apiError)

      const handlers = {
        onError: jest.fn()
      }

      await expect(client.streamMessage(testMessages, {}, handlers)).rejects.toMatchObject({
        type: 'authentication_error',
        message: 'Authentication failed'
      })

      expect(mockAnthropic.messages.stream).toHaveBeenCalledTimes(1) // No retries
      expect(handlers.onError).toHaveBeenCalled()
    })

    it('should handle stream events correctly', async () => {
      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'text') {
            // Simulate receiving text chunks
            setTimeout(() => callback('Hello'), 10)
            setTimeout(() => callback(' world'), 20)
          } else if (event === 'message') {
            // Simulate message completion
            setTimeout(() => callback({ id: 'msg_123' }), 30)
          }
          return mockStream
        })
      }

      mockAnthropic.messages.stream.mockResolvedValue(mockStream)

      const handlers = {
        onToken: jest.fn(),
        onComplete: jest.fn()
      }

      await client.streamMessage(testMessages, {}, handlers)

      // Wait for async events
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(handlers.onToken).toHaveBeenCalledWith('Hello')
      expect(handlers.onToken).toHaveBeenCalledWith(' world')
      expect(handlers.onComplete).toHaveBeenCalledWith('Hello world', 'msg_123')
    })
  })

  describe('createMessage', () => {
    const testMessages = [
      { role: 'user' as const, content: 'Hello, Claude!' }
    ]

    it('should successfully create a message', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: [{ text: 'Hello! How can I help you today?' }],
        model: 'claude-3-5-sonnet-20241022',
        usage: { input_tokens: 10, output_tokens: 20 }
      }

      mockAnthropic.messages.create.mockResolvedValue(mockResponse)

      const result = await client.createMessage(testMessages)

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: testMessages
      })
      expect(result).toBe(mockResponse)
    })

    it('should retry on retryable errors', async () => {
      const apiError = { status: 500, message: 'Internal server error' }

      mockAnthropic.messages.create
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce({ id: 'msg_123' })

      jest.spyOn(client as any, 'delay').mockResolvedValue(undefined)

      const result = await client.createMessage(testMessages)

      expect(mockAnthropic.messages.create).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ id: 'msg_123' })
    })
  })

  describe('Error Mapping', () => {
    it('should correctly map HTTP status codes to error types', () => {
      const testCases = [
        { status: 400, expectedType: 'invalid_request_error' },
        { status: 401, expectedType: 'authentication_error' },
        { status: 403, expectedType: 'permission_error' },
        { status: 404, expectedType: 'not_found_error' },
        { status: 413, expectedType: 'request_too_large' },
        { status: 429, expectedType: 'rate_limit_error' },
        { status: 500, expectedType: 'api_error' },
        { status: 529, expectedType: 'overloaded_error' }
      ]

      testCases.forEach(({ status, expectedType }) => {
        const error = { status, message: 'Test error' }
        const mappedError = (client as any).mapError(error)
        
        expect(mappedError.type).toBe(expectedType)
        expect(mappedError.statusCode).toBe(status)
      })
    })

    it('should handle network errors', () => {
      const networkError = { code: 'ENOTFOUND', message: 'Network error' }
      const mappedError = (client as any).mapError(networkError)
      
      expect(mappedError.type).toBe('network_error')
      expect(mappedError.message).toBe('Network connection failed')
    })

    it('should handle timeout errors', () => {
      const timeoutError = { code: 'ETIMEDOUT', message: 'Timeout' }
      const mappedError = (client as any).mapError(timeoutError)
      
      expect(mappedError.type).toBe('timeout_error')
      expect(mappedError.message).toBe('Request timed out')
    })
  })

  describe('Retry Logic', () => {
    it('should determine retryable errors correctly', () => {
      const retryableTypes = [
        'rate_limit_error',
        'overloaded_error',
        'api_error',
        'network_error',
        'timeout_error'
      ]

      const nonRetryableTypes = [
        'invalid_request_error',
        'authentication_error',
        'permission_error',
        'not_found_error',
        'request_too_large'
      ]

      retryableTypes.forEach(type => {
        const shouldRetry = (client as any).shouldRetry({ type } as ApiError, 1)
        expect(shouldRetry).toBe(true)
      })

      nonRetryableTypes.forEach(type => {
        const shouldRetry = (client as any).shouldRetry({ type } as ApiError, 1)
        expect(shouldRetry).toBe(false)
      })
    })

    it('should not retry after max attempts', () => {
      const shouldRetry = (client as any).shouldRetry({ type: 'rate_limit_error' } as ApiError, 3)
      expect(shouldRetry).toBe(false)
    })

    it('should calculate backoff delay correctly', () => {
      // Test exponential backoff
      const delay1 = (client as any).calculateBackoffDelay(1)
      const delay2 = (client as any).calculateBackoffDelay(2)
      
      expect(delay2).toBeGreaterThan(delay1)
      expect(delay1).toBeGreaterThanOrEqual(1000) // Base delay
      expect(delay2).toBeLessThanOrEqual(30000) // Max delay
    })

    it('should respect retry-after header', () => {
      const delay = (client as any).calculateBackoffDelay(1, 5) // 5 seconds retry-after
      expect(delay).toBe(5000)
    })
  })
})