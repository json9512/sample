import { ChatService } from '../chatService'
import type { Message, ChatSession } from '@/types/chat'

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
}

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}))

describe('ChatService', () => {
  let chatService: ChatService
  
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockSession: ChatSession = {
    id: 'session-123',
    title: 'Test Session',
    user_id: 'user-123',
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-01T10:30:00Z')
  }

  const mockMessage: Message = {
    id: 'message-123',
    content: 'Hello, world!',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    session_id: 'session-123',
    user_id: 'user-123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    chatService = new ChatService()
    
    // Setup default mock chain
    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    })
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle
    })
    
    mockInsert.mockReturnValue({
      select: mockSelect
    })
    
    mockUpdate.mockReturnValue({
      eq: mockEq
    })
    
    mockDelete.mockReturnValue({
      eq: mockEq
    })
    
    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder
    })
    
    mockOrder.mockReturnValue({
      single: mockSingle
    })
    
    mockSingle.mockResolvedValue({
      data: mockSession,
      error: null
    })
    
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockSession,
        error: null
      })

      const result = await chatService.createSession('Test Session')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockInsert).toHaveBeenCalledWith({
        title: 'Test Session',
        user_id: 'user-123'
      })
      expect(result).toEqual(mockSession)
    })

    it('should return null when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      })

      const result = await chatService.createSession('Test Session')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      })

      const result = await chatService.createSession('Test Session')

      expect(result).toBeNull()
    })
  })

  describe('getSessions', () => {
    it('should fetch user sessions successfully', async () => {
      const mockSessions = [mockSession]
      mockOrder.mockReturnValueOnce(mockSessions)
      mockEq.mockReturnValueOnce({ 
        order: () => mockSessions 
      })

      const result = await chatService.getSessions()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false })
    })

    it('should return empty array when user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      })

      const result = await chatService.getSessions()

      expect(result).toEqual([])
    })
  })

  describe('getMessages', () => {
    it('should fetch messages for a session successfully', async () => {
      const mockMessages = [mockMessage]
      mockOrder.mockReturnValueOnce(mockMessages)
      mockEq.mockReturnValueOnce({
        order: () => mockMessages
      })

      const result = await chatService.getMessages('session-123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('session_id', 'session-123')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('should handle errors gracefully', async () => {
      mockEq.mockReturnValueOnce({
        order: () => {
          throw new Error('Database error')
        }
      })

      const result = await chatService.getMessages('session-123')

      expect(result).toEqual([])
    })
  })

  describe('addMessage', () => {
    it('should add a message successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockMessage,
        error: null
      })

      const result = await chatService.addMessage('session-123', 'Hello, world!', 'user')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
      expect(mockInsert).toHaveBeenCalledWith({
        content: 'Hello, world!',
        role: 'user',
        session_id: 'session-123',
        user_id: 'user-123'
      })
      expect(result).toEqual(mockMessage)
    })

    it('should update session timestamp after adding message', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockMessage,
        error: null
      })

      await chatService.addMessage('session-123', 'Hello, world!', 'user')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String)
        })
      )
      expect(mockEq).toHaveBeenCalledWith('id', 'session-123')
    })

    it('should return null when user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      })

      const result = await chatService.addMessage('session-123', 'Hello, world!', 'user')

      expect(result).toBeNull()
    })
  })

  describe('updateSessionTitle', () => {
    it('should update session title successfully', async () => {
      mockEq.mockResolvedValueOnce({ error: null })

      const result = await chatService.updateSessionTitle('session-123', 'New Title')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'New Title' })
      expect(mockEq).toHaveBeenCalledWith('id', 'session-123')
      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      mockEq.mockResolvedValueOnce({ error: new Error('Update failed') })

      const result = await chatService.updateSessionTitle('session-123', 'New Title')

      expect(result).toBe(false)
    })
  })

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockEq.mockResolvedValueOnce({ error: null })

      const result = await chatService.deleteSession('session-123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'session-123')
      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      mockEq.mockResolvedValueOnce({ error: new Error('Delete failed') })

      const result = await chatService.deleteSession('session-123')

      expect(result).toBe(false)
    })
  })
})