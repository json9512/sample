'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { MessageCard } from './MessageCard'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { StreamingMessage } from './StreamingMessage'
import { ConversationSidebar } from './ConversationSidebar'
import { generateConversationTitle } from '@/lib/utils'
import type { Conversation, Message } from '@/types/chat'
import { 
  getConversations, 
  getConversationMessages, 
  createConversation, 
  deleteConversation,
  addMessage
} from '@/lib/database/chat-utils'

export function ChatInterface() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    sendMessage,
    stopStreaming,
    isStreaming,
    streamingContent,
    error,
    clearError
  } = useStreamingChat({
    onMessageComplete: async (content: string, _messageId?: string, conversationId?: string) => {
      if (!user) return

      try {
        let currentConversationId = conversationId || activeConversationId

        if (!currentConversationId) {
          const title = generateConversationTitle(messages[messages.length - 1]?.content || 'New conversation')
          const newConversation = await createConversation(user.id, title)
          currentConversationId = newConversation.id
          setActiveConversationId(currentConversationId)
          setConversations(prev => [newConversation, ...prev])
        }

        const assistantMessage = await addMessage({
          conversation_id: currentConversationId,
          role: 'assistant',
          content
        })

        setMessages(prev => [...prev, assistantMessage])
        scrollToBottom()
      } catch (error) {
        console.error('Failed to save assistant message:', error)
      }
    },
    onError: (errorMessage: string) => {
      console.error('Streaming error:', errorMessage)
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true)
        const userConversations = await getConversations(user.id)
        setConversations(userConversations)
        
        if (userConversations.length > 0 && !activeConversationId) {
          setActiveConversationId(userConversations[0].id)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [user, activeConversationId])

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true)
        const conversationMessages = await getConversationMessages(activeConversationId)
        setMessages(conversationMessages)
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [activeConversationId])

  const handleNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    clearError()
  }

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId !== activeConversationId) {
      setActiveConversationId(conversationId)
      clearError()
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      if (conversationId === activeConversationId) {
        const remaining = conversations.filter(conv => conv.id !== conversationId)
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id)
        } else {
          setActiveConversationId(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim()) return

    try {
      let conversationId = activeConversationId

      if (!conversationId) {
        const title = generateConversationTitle(content)
        const newConversation = await createConversation(user.id, title)
        conversationId = newConversation.id
        setActiveConversationId(conversationId)
        setConversations(prev => [newConversation, ...prev])
      }

      const userMessage = await addMessage({
        conversation_id: conversationId,
        role: 'user',
        content
      })

      setMessages(prev => [...prev, userMessage])

      const conversationMessages = await getConversationMessages(conversationId)
      await sendMessage(content, conversationId || undefined, conversationMessages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })))
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Keyboard navigation
  useKeyboardNavigation({
    onNewConversation: handleNewConversation,
    onFocusInput: () => inputRef.current?.focus(),
    disabled: isLoadingConversations || isStreaming
  })

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={isLoadingConversations}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="max-w-4xl mx-auto space-y-4 py-4">
            {isLoadingMessages ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : messages.length === 0 ? (
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
            ) : (
              messages.map((message) => (
                <MessageCard
                  key={message.id}
                  role={message.role}
                  timestamp={message.created_at}
                  avatar={message.role === 'user' ? user.user_metadata?.avatar_url : undefined}
                  name={message.role === 'user' ? user.user_metadata?.name : undefined}
                >
                  {message.content}
                </MessageCard>
              ))
            )}
            
            {isStreaming && streamingContent && (
              <MessageCard role="assistant">
                <StreamingMessage content={streamingContent} />
              </MessageCard>
            )}
            
            {isStreaming && !streamingContent && (
              <TypingIndicator />
            )}
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <MessageInput
          ref={inputRef}
          onSendMessage={handleSendMessage}
          disabled={isLoadingMessages}
          isStreaming={isStreaming}
          onStopStreaming={stopStreaming}
        />
      </div>
    </div>
  )
}