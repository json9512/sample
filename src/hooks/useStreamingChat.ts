// React hook for streaming chat with Claude API
// Provides client-side stream consumption and state management

import { useCallback, useState, useRef, useEffect } from 'react'
import type { StreamingChunk, ApiError, StreamingRequest } from '@/types/claude'

interface UseStreamingChatOptions {
  onMessageComplete?: (message: string, messageId?: string, conversationId?: string) => void
  onError?: (error: string, type?: string) => void
  onRateLimit?: (retryAfter?: string) => void
  onUsage?: (usage: { input_tokens: number; output_tokens: number }) => void
  maxRetries?: number
}

interface StreamingState {
  isStreaming: boolean
  streamingContent: string
  error: string | null
  isRateLimited: boolean
  retryAfter: string | null
  sessionId: string | null
}

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamingContent: '',
    error: null,
    isRateLimited: false,
    retryAfter: null,
    sessionId: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = options.maxRetries || 3
  const pendingContentRef = useRef('')
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Throttled update function to reduce re-renders during streaming
  const throttledUpdate = useCallback((content: string, immediate = false) => {
    pendingContentRef.current = content
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    if (immediate) {
      setState(prev => ({ ...prev, streamingContent: content }))
    } else {
      updateTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, streamingContent: pendingContentRef.current }))
      }, 50) // Update every 50ms max
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      streamingContent: '',
      error: null,
      isRateLimited: false,
      retryAfter: null
    }))
  }, [])

  const sendMessage = useCallback(async (
    message: string,
    conversationId?: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    customOptions?: Partial<StreamingRequest>
  ) => {
    if (state.isStreaming) {
      console.warn('Cannot send message while streaming is active')
      return
    }

    // Reset state for new request
    resetState()
    setState(prev => ({ ...prev, isStreaming: true }))
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    const requestBody: StreamingRequest = {
      message,
      conversation_id: conversationId,
      messages,
      ...customOptions
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retryAfterDate = response.headers.get('X-RateLimit-Reset')
        
        setState(prev => ({
          ...prev,
          isStreaming: false,
          isRateLimited: true,
          retryAfter: retryAfterDate || (retryAfter ? new Date(Date.now() + parseInt(retryAfter) * 1000).toISOString() : null)
        }))
        
        options.onRateLimit?.(retryAfterDate || undefined)
        return
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`
        
        setState(prev => ({ 
          ...prev, 
          isStreaming: false, 
          error: errorMessage 
        }))
        
        options.onError?.(errorMessage, errorData.error?.type)
        return
      }

      // Get session ID from headers
      const sessionId = response.headers.get('X-Session-Id')
      setState(prev => ({ ...prev, sessionId }))

      // Process streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let currentConversationId = conversationId

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingChunk = JSON.parse(line.slice(6))
              
              // Update conversation ID if provided
              if (data.conversation_id && !currentConversationId) {
                currentConversationId = data.conversation_id
              }
              
              switch (data.type) {
                case 'start':
                  // Stream started
                  break
                  
                case 'token':
                  fullContent += data.content
                  throttledUpdate(fullContent)
                  break
                  
                case 'complete':
                  // Clear any pending throttled updates and set final content
                  if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current)
                  }
                  setState(prev => ({ 
                    ...prev, 
                    streamingContent: data.content || fullContent,
                    isStreaming: false 
                  }))
                  
                  options.onMessageComplete?.(
                    data.content || fullContent, 
                    data.message_id, 
                    currentConversationId
                  )
                  
                  if (data.metadata?.usage) {
                    options.onUsage?.(data.metadata.usage)
                  }
                  break
                  
                case 'error':
                  setState(prev => ({ 
                    ...prev, 
                    isStreaming: false, 
                    error: data.content 
                  }))
                  
                  options.onError?.(data.content, 'stream_error')
                  return
                  
                case 'usage':
                  if (data.metadata?.usage) {
                    options.onUsage?.(data.metadata.usage)
                  }
                  break
                  
                default:
                  console.warn('Unknown streaming chunk type:', data.type)
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', line, parseError)
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
        setState(prev => ({ 
          ...prev, 
          isStreaming: false,
          streamingContent: '' 
        }))
      } else {
        console.error('Streaming error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Retry logic for network errors
        if (retryCountRef.current < maxRetries && 
            (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          retryCountRef.current++
          console.log(`Retrying request (${retryCountRef.current}/${maxRetries})`)
          
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000)
          setTimeout(() => {
            sendMessage(message, conversationId, messages, customOptions)
          }, delay)
          return
        }
        
        setState(prev => ({ 
          ...prev, 
          isStreaming: false, 
          error: errorMessage 
        }))
        
        options.onError?.(errorMessage, 'network_error')
      }
    } finally {
      abortControllerRef.current = null
      retryCountRef.current = 0
    }
  }, [state.isStreaming, options, maxRetries, resetState, throttledUpdate])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (state.sessionId) {
      // Attempt to cancel the session on the server
      fetch(`/api/chat?sessionId=${state.sessionId}`, {
        method: 'DELETE'
      }).catch(error => {
        console.warn('Failed to cancel server session:', error)
      })
    }
  }, [state.sessionId])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const clearRateLimit = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isRateLimited: false, 
      retryAfter: null 
    }))
  }, [])

  return {
    // Actions
    sendMessage,
    stopStreaming,
    clearError,
    clearRateLimit,
    
    // State
    isStreaming: state.isStreaming,
    streamingContent: state.streamingContent,
    error: state.error,
    isRateLimited: state.isRateLimited,
    retryAfter: state.retryAfter,
    sessionId: state.sessionId,
    
    // Utilities
    canSendMessage: !state.isStreaming && !state.isRateLimited,
    hasActiveStream: !!state.sessionId && state.isStreaming
  }
}

// Interface for managing multiple conversations
export interface MultiStreamingChatManager {
  createConversationStream: (conversationId: string) => ReturnType<typeof useStreamingChat>
  removeConversationStream: (conversationId: string) => void
  stopAllStreams: () => void
  activeConversations: string[]
  hasActiveStreams: boolean
}

// Hook for managing multiple concurrent conversations
export function useMultiStreamingChat(options: UseStreamingChatOptions = {}): MultiStreamingChatManager {
  const [conversationStreams, setConversationStreams] = useState<Map<string, any>>(new Map())
  
  const createConversationStream = useCallback((conversationId: string) => {
    if (conversationStreams.has(conversationId)) {
      return conversationStreams.get(conversationId)
    }
    
    // Note: This would typically be used in a higher-order component
    // where each conversation stream is managed separately
    const streamMethods = {
      sendMessage: async () => {},
      stopStreaming: () => {},
      isStreaming: false,
      streamingContent: '',
      error: null,
      canSendMessage: true
    }
    
    setConversationStreams(prev => new Map(prev.set(conversationId, streamMethods)))
    return streamMethods
  }, [conversationStreams])
  
  const removeConversationStream = useCallback((conversationId: string) => {
    setConversationStreams(prev => {
      const newMap = new Map(prev)
      newMap.delete(conversationId)
      return newMap
    })
  }, [])
  
  const stopAllStreams = useCallback(() => {
    conversationStreams.forEach(stream => {
      if (stream.stopStreaming) {
        stream.stopStreaming()
      }
    })
  }, [conversationStreams])
  
  return {
    createConversationStream,
    removeConversationStream,
    stopAllStreams,
    activeConversations: Array.from(conversationStreams.keys()),
    hasActiveStreams: Array.from(conversationStreams.values()).some(stream => stream.isStreaming)
  }
}