import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/lib/utils'

interface MessageCardProps {
  role: 'user' | 'assistant'
  children: ReactNode
  timestamp?: string
  avatar?: string
  name?: string
}

export function MessageCard({ 
  role, 
  children, 
  timestamp, 
  avatar, 
  name 
}: MessageCardProps) {
  const isUser = role === 'user'
  
  return (
    <div className={cn(
      'flex w-full gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/20',
      isUser && 'bg-gray-50/30 dark:bg-gray-900/10'
    )}>
      <div className="flex-shrink-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-green-600 text-white'
        )}>
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{isUser ? 'Y' : 'A'}</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {name || (isUser ? 'You' : 'Assistant')}
          </span>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTime(timestamp)}
            </span>
          )}
        </div>
        
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </div>
  )
}