'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { usePaginatedMessages } from '@/hooks/usePaginatedMessages'
import { VirtualMessageList } from './VirtualMessageList'
import { MessageInput } from './MessageInput'
import { ConversationSidebar } from './ConversationSidebar'
import { generateConversationTitle } from '@/lib/utils'
import type { Conversation, Message } from '@/types/chat'
import { 
  getConversations, 
  createConversation, 
  deleteConversation,
  addMessage
} from '@/lib/database/chat-utils'

export function ChatInterface() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isNewConversationMode, setIsNewConversationMode] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Use paginated messages hook
  const { 
    messages, 
    isLoading: isLoadingMessages, 
    addMessage: addMessageToState 
  } = usePaginatedMessages({ 
    conversationId: activeConversationId,
    pageSize: 50,
    initialLoad: 100
  })

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
          setIsNewConversationMode(false) // Exit new conversation mode after creating conversation
          setConversations(prev => [newConversation, ...prev])
        }

        const assistantMessage = await addMessage({
          conversation_id: currentConversationId,
          role: 'assistant',
          content
        })

        // Add message to state without reloading
        addMessageToState(assistantMessage)
      } catch (error) {
        console.error('Failed to save assistant message:', error)
      }
    },
    onError: (errorMessage: string) => {
      console.error('Streaming error:', errorMessage)
    }
  })

  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true)
        const userConversations = await getConversations(user.id)
        setConversations(userConversations)
        
        // Only auto-select first conversation on initial load, not when user explicitly starts new conversation
        if (userConversations.length > 0 && !activeConversationId && !isNewConversationMode) {
          setActiveConversationId(userConversations[0].id)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally excluding activeConversationId and isNewConversationMode to prevent auto-selecting 
  // first conversation when user explicitly starts new conversation

  const handleNewConversation = () => {
    setActiveConversationId(null)
    setIsNewConversationMode(true)
    clearError()
  }

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId !== activeConversationId) {
      setActiveConversationId(conversationId)
      setIsNewConversationMode(false) // Exit new conversation mode when selecting existing conversation
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
        setIsNewConversationMode(false) // Exit new conversation mode after creating conversation
        setConversations(prev => [newConversation, ...prev])
      }

      const userMessage = await addMessage({
        conversation_id: conversationId,
        role: 'user',
        content
      })

      // Add user message to state without reloading
      addMessageToState(userMessage)

      // Use current messages plus the new user message for context
      const allMessages = [...messages, userMessage]
      await sendMessage(content, conversationId || undefined, allMessages.map((msg: Message) => ({
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
    <div className="flex h-full bg-white dark:bg-gray-900">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={isLoadingConversations}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <VirtualMessageList
          messages={messages}
          isLoading={isLoadingMessages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          error={error}
          onClearError={clearError}
          userAvatar={user?.user_metadata?.avatar_url}
          userName={user?.user_metadata?.name}
        />
        
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