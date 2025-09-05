'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ChatUI } from '@/components/chat/ChatUI'
import { SessionList } from '@/components/sessions/SessionList'
import { ChatService } from '@/lib/services/chatService'
import type { Message, ChatSession } from '@/types/chat'

// Simple localStorage storage for testing (replace with database in production)
const SESSIONS_KEY = 'chatgpt-clone-sessions'
const MESSAGES_KEY = 'chatgpt-clone-messages'

function saveSessionsToStorage(sessions: ChatSession[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  }
}

function loadSessionsFromStorage(): ChatSession[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SESSIONS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.map((session: any) => ({
          ...session,
          created_at: new Date(session.created_at),
          updated_at: new Date(session.updated_at)
        }))
      } catch (error) {
        console.error('Error parsing stored sessions:', error)
      }
    }
  }
  return []
}

function saveSessionMessage(sessionId: string, message: Message) {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(MESSAGES_KEY) || '{}'
    const messages = JSON.parse(stored)
    
    if (!messages[sessionId]) {
      messages[sessionId] = []
    }
    messages[sessionId].push(message)
    
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
    console.log('Saved message to localStorage:', sessionId, message)
  }
}

function getSessionMessages(sessionId: string): Message[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(MESSAGES_KEY) || '{}'
    try {
      const messages = JSON.parse(stored)
      const sessionMsgs = messages[sessionId] || []
      return sessionMsgs.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (error) {
      console.error('Error parsing stored messages:', error)
    }
  }
  return []
}

// Helper function to generate session title from first message
function generateSessionTitle(message: string): string {
  // Clean and truncate the message
  const cleaned = message.trim().replace(/\s+/g, ' ')
  
  // If it's a question, use it as is (up to 50 chars)
  if (cleaned.endsWith('?')) {
    return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned
  }
  
  // If it starts with common patterns, extract the main topic
  const patterns = [
    /^(tell me about|what is|what are|how to|how do|explain|describe)\s+(.+)/i,
    /^(help me|assist me|can you)\s+(.+)/i,
    /^(create|make|build|write|generate)\s+(.+)/i
  ]
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match && match[2]) {
      const topic = match[2].trim()
      return topic.length > 40 ? topic.slice(0, 37) + '...' : topic
    }
  }
  
  // Default: use first 50 characters
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned
}

function DashboardPage() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [chatService] = useState(() => new ChatService())
  const router = useRouter()

  useEffect(() => {
    loadSessions()
  }, [])

  // Remove automatic message loading on session change
  // Messages will only be loaded explicitly when needed

  const loadSessions = async () => {
    try {
      console.log('Loading sessions from database...')
      const sessionsData = await chatService.getSessions()
      console.log('Loaded sessions from database:', sessionsData)
      setSessions(sessionsData)
      
      // Don't auto-select sessions to avoid message loading conflicts
    } catch (error) {
      console.error('Failed to load sessions from database:', error)
      setSessions([])
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      console.log('Loading messages for session:', sessionId)
      const messagesData = await chatService.getMessages(sessionId)
      console.log('Setting messages to:', messagesData.length, 'messages')
      setMessages(messagesData)
      console.log('Loaded messages from database:', messagesData.length)
    } catch (error) {
      console.error('Failed to load messages from database:', error)
      console.log('Setting messages to empty array due to error')
      setMessages([])
    }
  }

  const handleNewSession = async () => {
    console.log('=== HANDLE NEW SESSION CALLED ===')
    console.log('Creating new session...')
    
    try {
      // Create session in database
      const newSession = await chatService.createSession('New Chat')
      if (newSession) {
        const updatedSessions = [newSession, ...sessions]
        setSessions(updatedSessions)
        saveSessionsToStorage(updatedSessions)
        
        setCurrentSession(newSession)
        setMessages([])
        console.log('New session created in database with id:', newSession.id)
      } else {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      console.error('Failed to create session in database, using localStorage:', error)
      // Fallback to localStorage only
      const newSession: ChatSession = {
        id: 'local-session-' + Date.now(),
        title: 'New Chat',
        user_id: 'local-user',
        created_at: new Date(),
        updated_at: new Date()
      }
      
      const updatedSessions = [newSession, ...sessions]
      setSessions(updatedSessions)
      saveSessionsToStorage(updatedSessions)
      
      setCurrentSession(newSession)
      setMessages([])
      console.log('New session created locally with id:', newSession.id)
    }
  }

  const handleSendMessage = async (content: string) => {
    console.log('=== SEND MESSAGE START ===')
    console.log('handleSendMessage called with:', content)
    console.log('Current session:', currentSession)
    console.log('isLoading:', isLoading)
    
    let sessionToUse = currentSession
    
    if (!sessionToUse) {
      console.log('No current session, creating new session')
      
      try {
        // Create session in database
        console.log('Calling chatService.createSession...')
        const newSession = await chatService.createSession('New Chat')
        console.log('createSession returned:', newSession)
        if (newSession) {
          sessionToUse = newSession
          console.log('New session created in database with id:', newSession.id)
          
          // Reload sessions from database to update the sidebar
          await loadSessions()
          
          // Set current session without loading messages
          setCurrentSession(newSession)
        } else {
          throw new Error('Failed to create session')
        }
      } catch (error) {
        console.error('Failed to create session:', error)
        // Return early if session creation fails
        setIsLoading(false)
        return
      }
    }

    setIsLoading(true)
    setStreamingMessage('')

    try {
      // Add user message to UI immediately
      const userMessageId = `user-${Date.now()}`
      const assistantMessageId = `assistant-${Date.now()}`
      
      const userMessage: Message = {
        id: userMessageId,
        content,
        role: 'user',
        timestamp: new Date(),
        session_id: sessionToUse.id,
        user_id: 'temp'
      }
      
      // Create placeholder assistant message for streaming
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        session_id: sessionToUse.id,
        user_id: 'temp',
        isStreaming: true
      }
      
      // Add both messages at once to avoid flickering
      console.log('Adding messages to UI - current message count:', messages.length)
      setMessages(prev => {
        const newMessages = [...prev, userMessage, assistantMessage]
        console.log('New message count after adding:', newMessages.length)
        return newMessages
      })
      
      // Auto-generate session title based on first message
      if (sessionToUse.title === 'New Chat') {
        const newTitle = generateSessionTitle(content)
        console.log('Auto-generating session title:', newTitle)
        
        try {
          console.log('Attempting to update session title to:', newTitle)
          const success = await chatService.updateSessionTitle(sessionToUse.id, newTitle)
          console.log('Session title update result:', success)
          
          if (success) {
            setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null)
            // Reload sessions to update sidebar
            console.log('Reloading sessions after title update...')
            await loadSessions()
            console.log('Sessions reloaded after title update')
          } else {
            console.error('Session title update failed')
          }
        } catch (error) {
          console.error('Failed to update session title:', error)
        }
      }

      // Stream Claude API response  
      console.log('=== STARTING STREAM ===')
      console.log('About to call streamMessage with session:', sessionToUse.id)
      let fullResponse = ''
      try {
        console.log('Calling chatService.streamMessage...')
        for await (const chunk of chatService.streamMessage(sessionToUse.id, content)) {
          console.log('Received streaming chunk:', chunk)
          if (chunk.error) {
            console.error('Streaming error:', chunk.error)
            setStreamingMessage('Error: Failed to get response from Claude')
            break
          }
          
          if (!chunk.isComplete) {
            fullResponse += chunk.content
            setStreamingMessage(fullResponse)
          } else {
            // Streaming complete - update the assistant message in place
            console.log('Streaming completed, final response:', fullResponse)
            
            setMessages(prev => {
              return prev.map(msg => {
                if (msg.id === assistantMessageId && msg.isStreaming) {
                  return {
                    ...msg,
                    content: fullResponse,
                    isStreaming: false
                  }
                }
                return msg
              })
            })
            
            setStreamingMessage('')
            setIsLoading(false)
            console.log('Final message updated in UI')
            break
          }
        }
      } catch (streamError) {
        console.error('Error during streaming:', streamError)
        
        // Update assistant message to show error
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === assistantMessageId && msg.isStreaming) {
              return {
                ...msg,
                content: 'Error: Failed to get response from Claude',
                isStreaming: false
              }
            }
            return msg
          })
        })
        
        setStreamingMessage('')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  const handleSessionSelect = (sessionId: string) => {
    console.log('Selecting session:', sessionId)
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSession(session)
      // Load messages from database only when explicitly selecting a session
      console.log('Explicitly loading messages for selected session')
      loadMessages(sessionId)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    console.log('Deleting session:', sessionId)
    
    try {
      const success = await chatService.deleteSession(sessionId)
      if (success) {
        // If deleting current session, clear it
        if (currentSession?.id === sessionId) {
          setCurrentSession(null)
          setMessages([])
        }
        
        // Reload sessions from database to update the sidebar
        await loadSessions()
        console.log('Session deleted and list refreshed')
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleEditSessionTitle = async (sessionId: string, newTitle: string) => {
    console.log('Editing session title:', sessionId, newTitle)
    
    try {
      const success = await chatService.updateSessionTitle(sessionId, newTitle)
      if (success) {
        // Update current session if it's the one being edited
        if (currentSession?.id === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null)
        }
        
        // Reload sessions from database to update the sidebar
        await loadSessions()
        console.log('Session title updated and list refreshed')
      }
    } catch (error) {
      console.error('Failed to update session title:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <SessionList
        sessions={sessions}
        currentSessionId={currentSession?.id}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onEditSessionTitle={handleEditSessionTitle}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatUI
          session={currentSession}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          streamingMessage={streamingMessage}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}