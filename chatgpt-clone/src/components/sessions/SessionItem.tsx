'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatSession } from '@/types/chat'

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onEditTitle: (newTitle: string) => void
}

export function SessionItem({ 
  session, 
  isActive, 
  onSelect, 
  onDelete, 
  onEditTitle 
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== session.title) {
      onEditTitle(editTitle.trim())
    } else {
      setEditTitle(session.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditTitle(session.title)
      setIsEditing(false)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="relative">
      <div
        onClick={onSelect}
        className={`w-full text-left p-3 rounded-lg transition-colors group relative cursor-pointer ${
          isActive
            ? 'bg-blue-50 text-blue-900 border border-blue-200'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none p-0 text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="font-medium text-sm truncate pr-8">
                {session.title}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(session.updated_at)}
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-0 top-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
              setShowMenu(false)
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
          >
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this conversation?')) {
                onDelete()
              }
              setShowMenu(false)
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}