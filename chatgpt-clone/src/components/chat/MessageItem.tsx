import { useState, useEffect } from 'react'
import type { MessageItemProps } from '@/types/chat'

export function MessageItem({ message, isLast, isStreaming, streamingContent }: MessageItemProps) {
  const [showCursor, setShowCursor] = useState(false)
  const isUser = message.role === 'user'
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  const displayContent = isStreaming && streamingContent ? streamingContent : message.content

  // Blinking cursor effect for streaming messages
  useEffect(() => {
    if (!isStreaming) {
      setShowCursor(false)
      return
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  return (
    <div 
      data-testid="message-container"
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          isUser ? 'bg-blue-600' : 'bg-gray-700'
        }`}>
          {isUser ? 'Y' : 'C'}
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">
              {isUser ? 'You' : 'Claude'}
            </span>
            <span className="text-xs text-gray-500">
              {isStreaming ? 'typing...' : timestamp}
            </span>
          </div>
          
          <div className={`px-4 py-2 rounded-2xl max-w-full ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}>
            <div className="text-sm whitespace-pre-wrap break-words">
              {displayContent}
              {isStreaming && !isUser && (
                <span
                  className={`inline-block w-2 h-4 bg-gray-500 ml-1 ${
                    showCursor ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transition: 'opacity 0.1s ease-in-out' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}