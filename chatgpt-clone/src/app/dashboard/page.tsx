'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ChatUI } from '@/components/chat/ChatUI'
import { ChatService } from '@/lib/services/chatService'
import type { Message, ChatSession } from '@/types/chat'

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

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id)
    }
  }, [currentSession])

  const loadSessions = async () => {
    const sessionsData = await chatService.getSessions()
    setSessions(sessionsData)
    
    // Auto-select the most recent session if available
    if (sessionsData.length > 0 && !currentSession) {
      setCurrentSession(sessionsData[0])
    }
  }

  const loadMessages = async (sessionId: string) => {
    const messagesData = await chatService.getMessages(sessionId)
    setMessages(messagesData)
  }

  const handleNewSession = async () => {
    console.log('Creating new session...')
    const newSession = await chatService.createSession('New Chat')
    console.log('New session result:', newSession)
    if (newSession) {
      setSessions(prev => [newSession, ...prev])
      setCurrentSession(newSession)
      setMessages([])
      console.log('New session set as current session')
    } else {
      console.error('Failed to create new session')
    }
  }

  const handleSendMessage = async (content: string) => {
    console.log('handleSendMessage called with:', content)
    
    let sessionToUse = currentSession
    
    if (!sessionToUse) {
      console.log('No current session, using temporary session for testing')
      // Temporary fix: create a fake session for testing
      const tempSession: ChatSession = {
        id: 'temp-session-' + Date.now(),
        title: 'Test Chat',
        user_id: 'test-user',
        created_at: new Date(),
        updated_at: new Date()
      }
      setCurrentSession(tempSession)
      sessionToUse = tempSession
      console.log('Created temporary session with id:', sessionToUse.id)
    }

    setIsLoading(true)
    setStreamingMessage('')

    try {
      // Add user message to UI immediately
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
        session_id: sessionToUse.id,
        user_id: 'temp'
      }
      setMessages(prev => [...prev, tempUserMessage])
      
      // Update session title if it's still "New Chat" or "Test Chat"
      if (sessionToUse.title === 'New Chat' || sessionToUse.title === 'Test Chat') {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        // Skip title update for testing - would normally update database
        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null)
        setSessions(prev => prev.map(s => 
          s.id === sessionToUse.id ? { ...s, title: newTitle } : s
        ))
      }

      // Create placeholder assistant message for streaming
      const tempAssistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        session_id: sessionToUse.id,
        user_id: 'temp',
        isStreaming: true
      }
      setMessages(prev => [...prev.slice(0, -1), tempUserMessage, tempAssistantMessage])

      // Stream Claude API response
      console.log('Starting to stream message to session:', sessionToUse.id)
      let fullResponse = ''
      try {
        for await (const chunk of chatService.streamMessage(sessionToUse.id, content)) {
          if (chunk.error) {
            console.error('Streaming error:', chunk.error)
            setStreamingMessage('Error: Failed to get response from Claude')
            break
          }
          
          if (!chunk.isComplete) {
            fullResponse += chunk.content
            setStreamingMessage(fullResponse)
          } else {
            // Streaming complete - save final message
            console.log('Streaming completed, final response:', fullResponse)
            
            // Create final assistant message
            const finalAssistantMessage: Message = {
              id: `final-assistant-${Date.now()}`,
              content: fullResponse,
              role: 'assistant',
              timestamp: new Date(),
              session_id: sessionToUse.id,
              user_id: 'temp'
            }
            
            // Update messages: remove temp assistant message and add final one
            setMessages(prev => {
              const withoutTempAssistant = prev.slice(0, -1) // Remove temp assistant message
              return [...withoutTempAssistant, finalAssistantMessage]
            })
            
            setStreamingMessage('')
            setIsLoading(false)
            console.log('Final message saved to UI')
            break
          }
        }
      } catch (streamError) {
        console.error('Error during streaming:', streamError)
        setStreamingMessage('Error: Failed to get response from Claude')
        setIsLoading(false)
        // Remove temporary assistant message on error
        setMessages(prev => prev.slice(0, -1))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
      setStreamingMessage('')
      // Remove temporary messages on error
      setMessages(prev => prev.slice(0, -2))
    }
  }

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSession(session)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleNewSession}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              <p className="text-sm">No chat sessions yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionSelect(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-blue-100 text-blue-900 border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => router.push('/profile')}
            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => {
              console.log('Sign Out clicked')
              window.location.href = '/auth/logout'
            }}
            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

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