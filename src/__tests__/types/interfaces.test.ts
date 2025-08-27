import { describe, it, expect } from '@jest/globals'
import type {
  User,
  Conversation,
  Message,
  StreamingRequest,
  StreamingChunk,
  AuthState,
  ApiResponse
} from '@/types'

describe('Type Interface Contracts', () => {
  it('User interface should match specification', () => {
    const user: User = {
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2024-01-01T00:00:00Z'
    }

    expect(user.id).toBe('test-id')
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
    expect(user.avatar_url).toBe('https://example.com/avatar.jpg')
    expect(user.created_at).toBe('2024-01-01T00:00:00Z')
  })

  it('Conversation interface should match specification', () => {
    const conversation: Conversation = {
      id: 'conv-id',
      user_id: 'user-id',
      title: 'Test Conversation',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    expect(conversation.id).toBe('conv-id')
    expect(conversation.user_id).toBe('user-id')
    expect(conversation.title).toBe('Test Conversation')
  })

  it('Message interface should match specification', () => {
    const userMessage: Message = {
      id: 'msg-id',
      conversation_id: 'conv-id',
      role: 'user',
      content: 'Hello world',
      created_at: '2024-01-01T00:00:00Z'
    }

    const assistantMessage: Message = {
      id: 'msg-id-2',
      conversation_id: 'conv-id',
      role: 'assistant',
      content: 'Hi there!',
      created_at: '2024-01-01T00:00:00Z',
      metadata: { model: 'claude-3', tokens: 50 }
    }

    expect(userMessage.role).toBe('user')
    expect(assistantMessage.role).toBe('assistant')
    expect(assistantMessage.metadata?.model).toBe('claude-3')
  })

  it('StreamingRequest interface should match specification', () => {
    const request: StreamingRequest = {
      message: 'Hello',
      conversation_id: 'conv-id'
    }

    expect(request.message).toBe('Hello')
    expect(request.conversation_id).toBe('conv-id')
  })

  it('StreamingChunk interface should match specification', () => {
    const tokenChunk: StreamingChunk = {
      type: 'token',
      content: 'Hello',
      message_id: 'msg-id'
    }

    const completeChunk: StreamingChunk = {
      type: 'complete',
      content: 'Full message',
      message_id: 'msg-id'
    }

    const errorChunk: StreamingChunk = {
      type: 'error',
      content: 'Error occurred'
    }

    expect(tokenChunk.type).toBe('token')
    expect(completeChunk.type).toBe('complete')
    expect(errorChunk.type).toBe('error')
  })

  it('AuthState interface should work correctly', () => {
    const authenticatedState: AuthState = {
      user: {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z'
      },
      loading: false
    }

    const unauthenticatedState: AuthState = {
      user: null,
      loading: false
    }

    expect(authenticatedState.user).not.toBeNull()
    expect(unauthenticatedState.user).toBeNull()
    expect(authenticatedState.loading).toBe(false)
  })

  it('ApiResponse interface should handle success and error states', () => {
    const successResponse: ApiResponse<User> = {
      data: {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z'
      }
    }

    const errorResponse: ApiResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        statusCode: 400
      }
    }

    expect(successResponse.data).toBeDefined()
    expect(successResponse.error).toBeUndefined()
    expect(errorResponse.data).toBeUndefined()
    expect(errorResponse.error).toBeDefined()
  })
})