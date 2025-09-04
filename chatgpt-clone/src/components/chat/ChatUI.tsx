'use client'

import { useEffect, useRef } from 'react'
import { ChatInput } from './ChatInput'
import { MessageItem } from './MessageItem'
import type { ChatUIProps } from '@/types/chat'

export function ChatUI({ session, messages, onSendMessage, isLoading, streamingMessage }: ChatUIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {session?.title || 'New Chat'}
        </h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500">
                  Send a message to begin chatting with Claude AI
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isLastAssistantMessage = 
                  index === messages.length - 1 && 
                  message.role === 'assistant' && 
                  isLoading
                
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isLast={index === messages.length - 1}
                    isStreaming={isLastAssistantMessage}
                    streamingContent={isLastAssistantMessage ? streamingMessage : undefined}
                  />
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={onSendMessage}
            disabled={isLoading}
            placeholder={isLoading ? 'Claude is typing...' : 'Type your message...'}
          />
        </div>
      </div>
    </div>
  )
}