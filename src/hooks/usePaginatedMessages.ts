import { useState, useEffect, useCallback, useRef } from 'react'
import { getConversationMessagesPaginated, getMessageCount } from '@/lib/database/chat-utils'
import type { Message } from '@/types/chat'

export interface UsePaginatedMessagesOptions {
  conversationId: string | null
  pageSize?: number
  initialLoad?: number
}

export interface UsePaginatedMessagesReturn {
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  reload: () => Promise<void>
  addMessage: (message: Message) => void
  total: number
}

const DEFAULT_PAGE_SIZE = 50
const DEFAULT_INITIAL_LOAD = 100

export function usePaginatedMessages({
  conversationId,
  pageSize = DEFAULT_PAGE_SIZE,
  initialLoad = DEFAULT_INITIAL_LOAD
}: UsePaginatedMessagesOptions): UsePaginatedMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  
  // Use refs to avoid dependency loops
  const totalRef = useRef(0)
  const offsetRef = useRef(0)
  const hasMoreRef = useRef(false)
  const isLoadingRef = useRef(false)
  
  // Sync refs with state
  totalRef.current = total
  offsetRef.current = offset
  hasMoreRef.current = hasMore
  isLoadingRef.current = isLoading

  const loadMessages = useCallback(async (newOffset: number, append: boolean = false) => {
    if (!conversationId || isLoadingRef.current) return

    setIsLoading(true)
    try {
      const [messageData, totalCount] = await Promise.all([
        getConversationMessagesPaginated(conversationId, {
          limit: newOffset === 0 ? initialLoad : pageSize,
          offset: newOffset,
          orderBy: 'created_at',
          ascending: true
        }),
        newOffset === 0 ? getMessageCount(conversationId) : Promise.resolve(totalRef.current)
      ])

      if (append) {
        setMessages(prev => [...prev, ...messageData])
      } else {
        setMessages(messageData)
        setTotal(totalCount)
      }

      const newHasMore = (newOffset + messageData.length) < totalCount
      setHasMore(newHasMore)
      setOffset(newOffset + messageData.length)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, pageSize, initialLoad])

  const loadMore = useCallback(async () => {
    if (hasMoreRef.current && !isLoadingRef.current) {
      await loadMessages(offsetRef.current, true)
    }
  }, [loadMessages])

  const reload = useCallback(async () => {
    setOffset(0)
    setMessages([])
    await loadMessages(0, false)
  }, [loadMessages])

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
    setTotal(prev => prev + 1)
  }, [])

  // Stable effect that doesn't depend on changing functions
  useEffect(() => {
    if (conversationId) {
      // Reset state
      setOffset(0)
      setMessages([])
      setTotal(0)
      setHasMore(false)
      
      // Load initial messages
      loadMessages(0, false)
    } else {
      setMessages([])
      setTotal(0)
      setHasMore(false)
      setOffset(0)
    }
  }, [conversationId, loadMessages])

  return {
    messages,
    isLoading,
    hasMore,
    loadMore,
    reload,
    addMessage,
    total
  }
}