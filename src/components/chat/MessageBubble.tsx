import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/lib/utils'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  children: ReactNode
  timestamp?: string
  status?: 'sending' | 'sent' | 'error'
}

export function MessageBubble({ 
  role, 
  children, 
  timestamp, 
  status 
}: MessageBubbleProps) {
  const isUser = role === 'user'
  
  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
        'min-w-[180px] min-h-[48px] relative',
        isUser 
          ? 'bg-blue-600 text-white rounded-br-md' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
      )}>
        <div className="relative z-10">
          {children}
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
          {timestamp && (
            <span className="text-xs">
              {formatMessageTime(timestamp)}
            </span>
          )}
          {status && isUser && (
            <div className="flex items-center space-x-1">
              {status === 'sending' && (
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              )}
              {status === 'sent' && (
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              )}
              {status === 'error' && (
                <div className="w-2 h-2 bg-red-400 rounded-full" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}