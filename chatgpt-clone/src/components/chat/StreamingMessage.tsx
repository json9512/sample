'use client'

import { useEffect, useState } from 'react'

interface StreamingMessageProps {
  content: string
  isComplete?: boolean
}

export function StreamingMessage({ content, isComplete = false }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    setDisplayedContent(content)
  }, [content])

  // Blinking cursor effect
  useEffect(() => {
    if (isComplete) {
      setShowCursor(false)
      return
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isComplete])

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="text-gray-900 whitespace-pre-wrap">
            {displayedContent}
            {!isComplete && (
              <span
                className={`inline-block w-2 h-5 bg-gray-400 ml-1 ${
                  showCursor ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transition: 'opacity 0.1s ease-in-out' }}
              />
            )}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {isComplete ? 'Claude' : 'Claude is typing...'}
        </div>
      </div>
    </div>
  )
}