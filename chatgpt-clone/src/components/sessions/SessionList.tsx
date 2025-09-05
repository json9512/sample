'use client'

import { useState } from 'react'
import { ChatSession } from '@/types/chat'
import { SessionItem } from './SessionItem'

interface SessionListProps {
  sessions: ChatSession[]
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => void
  onEditSessionTitle: (sessionId: string, newTitle: string) => void
}

export function SessionList({ 
  sessions, 
  currentSessionId, 
  onSessionSelect, 
  onNewSession, 
  onDeleteSession,
  onEditSessionTitle
}: SessionListProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewSession}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            <div className="flex flex-col items-center justify-center h-32">
              <svg
                className="w-8 h-8 text-gray-400 mb-2"
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
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new chat to begin</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                onSelect={() => onSessionSelect(session.id)}
                onDelete={() => onDeleteSession(session.id)}
                onEditTitle={(newTitle) => onEditSessionTitle(session.id, newTitle)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}