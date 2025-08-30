import { renderHook, act, waitFor } from '@testing-library/react'
import { usePaginatedMessages } from '@/hooks/usePaginatedMessages'
import type { Message } from '@/types/chat'

// Mock the database utilities
jest.mock('@/lib/database/chat-utils', () => ({
  getConversationMessagesPaginated: jest.fn(),
  getMessageCount: jest.fn(),
}))

describe('usePaginatedMessages', () => {
  const mockGetConversationMessagesPaginated = require('@/lib/database/chat-utils').getConversationMessagesPaginated
  const mockGetMessageCount = require('@/lib/database/chat-utils').getMessageCount

  const mockMessages: Message[] = [
    {
      id: '1',
      conversation_id: 'conv1',
      role: 'user',
      content: 'Hello',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      conversation_id: 'conv1', 
      role: 'assistant',
      content: 'Hi there!',
      created_at: '2024-01-01T00:01:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetConversationMessagesPaginated.mockResolvedValue(mockMessages)
    mockGetMessageCount.mockResolvedValue(10)
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(true) // Initially loading
    expect(result.current.hasMore).toBe(false)
    expect(result.current.total).toBe(0)
  })

  it('loads messages when conversationId changes', async () => {
    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    await waitFor(() => {
      expect(mockGetConversationMessagesPaginated).toHaveBeenCalledWith('conv1', {
        limit: 100,
        offset: 0,
        orderBy: 'created_at',
        ascending: true
      })
      expect(mockGetMessageCount).toHaveBeenCalledWith('conv1')
    })

    await waitFor(() => {
      expect(result.current.messages).toEqual(mockMessages)
      expect(result.current.total).toBe(10)
    })
  })

  it('does not load when conversationId is null', () => {
    renderHook(() => 
      usePaginatedMessages({ conversationId: null })
    )

    expect(mockGetConversationMessagesPaginated).not.toHaveBeenCalled()
    expect(mockGetMessageCount).not.toHaveBeenCalled()
  })

  it('uses custom page size and initial load', async () => {
    renderHook(() => 
      usePaginatedMessages({ 
        conversationId: 'conv1',
        pageSize: 25,
        initialLoad: 50
      })
    )

    await waitFor(() => {
      expect(mockGetConversationMessagesPaginated).toHaveBeenCalledWith('conv1', {
        limit: 50,
        offset: 0,
        orderBy: 'created_at',
        ascending: true
      })
    })
  })

  it('sets loading state correctly', async () => {
    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('calculates hasMore correctly', async () => {
    mockGetMessageCount.mockResolvedValue(200) // More than initial load
    
    const { result } = renderHook(() => 
      usePaginatedMessages({ 
        conversationId: 'conv1',
        initialLoad: 100
      })
    )

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true)
    })
  })

  it('loads more messages when loadMore is called', async () => {
    const { result } = renderHook(() => 
      usePaginatedMessages({ 
        conversationId: 'conv1',
        pageSize: 2
      })
    )

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    // Mock additional messages for loadMore
    const moreMessages: Message[] = [
      {
        id: '3',
        conversation_id: 'conv1',
        role: 'user', 
        content: 'Another message',
        created_at: '2024-01-01T00:02:00Z',
      },
    ]
    mockGetConversationMessagesPaginated.mockResolvedValueOnce(moreMessages)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(mockGetConversationMessagesPaginated).toHaveBeenCalledWith('conv1', {
      limit: 2,
      offset: 2,
      orderBy: 'created_at',
      ascending: true
    })
  })

  it('reloads messages when reload is called', async () => {
    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should call with offset 0 again
    expect(mockGetConversationMessagesPaginated).toHaveBeenLastCalledWith('conv1', {
      limit: 100,
      offset: 0,
      orderBy: 'created_at',
      ascending: true
    })
  })

  it('adds message when addMessage is called', async () => {
    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    const newMessage: Message = {
      id: '3',
      conversation_id: 'conv1',
      role: 'user',
      content: 'New message',
      created_at: '2024-01-01T00:02:00Z',
    }

    act(() => {
      result.current.addMessage(newMessage)
    })

    expect(result.current.messages).toHaveLength(3)
    expect(result.current.messages[2]).toEqual(newMessage)
  })

  it('handles errors gracefully', async () => {
    mockGetConversationMessagesPaginated.mockRejectedValue(new Error('Database error'))

    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.messages).toEqual([])
    })
  })

  it('resets messages when conversation changes', async () => {
    const { result, rerender } = renderHook((conversationId: string) => 
      usePaginatedMessages({ conversationId })
    )

    // Initial conversation
    rerender('conv1')
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    // Change conversation
    const newMessages: Message[] = [
      { id: '10', conversation_id: 'conv2', role: 'user', content: 'New conv', created_at: '2024-01-01T00:00:00Z' }
    ]
    mockGetConversationMessagesPaginated.mockResolvedValueOnce(newMessages)

    rerender('conv2')

    await waitFor(() => {
      expect(result.current.messages).toEqual(newMessages)
    })
  })

  it('handles empty message response', async () => {
    mockGetConversationMessagesPaginated.mockResolvedValue([])
    mockGetMessageCount.mockResolvedValue(0)

    const { result } = renderHook(() => 
      usePaginatedMessages({ conversationId: 'conv1' })
    )

    await waitFor(() => {
      expect(result.current.messages).toEqual([])
      expect(result.current.total).toBe(0)
      expect(result.current.hasMore).toBe(false)
    })
  })
})