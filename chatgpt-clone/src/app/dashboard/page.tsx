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
    const newSession = await chatService.createSession('New Chat')
    if (newSession) {
      setSessions(prev => [newSession, ...prev])
      setCurrentSession(newSession)
      setMessages([])
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentSession) {
      // Create a new session if none exists
      await handleNewSession()
      return
    }

    setIsLoading(true)

    try {
      // Add user message
      const userMessage = await chatService.addMessage(currentSession.id, content, 'user')
      if (userMessage) {
        setMessages(prev => [...prev, userMessage])
        
        // Update session title if it's still "New Chat"
        if (currentSession.title === 'New Chat') {
          const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '')
          await chatService.updateSessionTitle(currentSession.id, newTitle)
          setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null)
          setSessions(prev => prev.map(s => 
            s.id === currentSession.id ? { ...s, title: newTitle } : s
          ))
        }

        // TODO: In Phase 4, this will call Claude API
        // For now, just add a placeholder response
        setTimeout(async () => {
          const assistantMessage = await chatService.addMessage(
            currentSession.id, 
            'This is a placeholder response. Claude API integration will be added in Phase 4.',
            'assistant'
          )
          if (assistantMessage) {
            setMessages(prev => [...prev, assistantMessage])
          }
          setIsLoading(false)
        }, 1000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
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