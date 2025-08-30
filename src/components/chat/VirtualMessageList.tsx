'use client'

import { useEffect, useRef, useCallback, memo } from 'react'
import { MessageCard } from './MessageCard'
import { StreamingMessage } from './StreamingMessage'
import { TypingIndicator } from './TypingIndicator'
import type { Message } from '@/types/chat'

interface VirtualMessageListProps {
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => Promise<void>
  streamingContent?: string
  isStreaming?: boolean
  error?: string | null
  onClearError?: () => void
  userAvatar?: string
  userName?: string
}

export const VirtualMessageList = memo(function VirtualMessageList({
  messages,
  isLoading,
  streamingContent,
  isStreaming = false,
  error,
  onClearError,
  userAvatar,
  userName
}: Omit<VirtualMessageListProps, 'hasMore' | 'onLoadMore'>) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Simple scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Auto-scroll when messages change (but NOT during streaming to prevent flicker)
  useEffect(() => {
    if (!isStreaming) {
      scrollToBottom()
    }
  }, [messages.length, isStreaming, scrollToBottom])
  
  // Auto-scroll only when streaming starts (not on every content update)
  useEffect(() => {
    if (isStreaming && !streamingContent) {
      scrollToBottom()
    }
  }, [isStreaming, streamingContent, scrollToBottom])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Start a new conversation
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Ask me anything! I&apos;m here to help with questions, creative writing, analysis, coding, and more.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto px-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-4 py-4">
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.created_at}
              avatar={message.role === 'user' ? userAvatar : undefined}
              name={message.role === 'user' ? userName : undefined}
            />
          ))}
          
          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="flex w-full gap-4 p-4 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-600 text-white">
                  <span>A</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    Assistant
                  </span>
                </div>
                
                <StreamingMessage 
                  content={streamingContent}
                  isComplete={!isStreaming}
                />
              </div>
            </div>
          )}
          
          {/* Typing indicator */}
          {isStreaming && !streamingContent && (
            <TypingIndicator />
          )}
          
          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </p>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
})