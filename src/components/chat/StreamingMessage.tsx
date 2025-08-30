import { memo } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownContent } from './MarkdownContent'

interface StreamingMessageProps {
  content: string
  isComplete?: boolean
  className?: string
}

export const StreamingMessage = memo(function StreamingMessage({ 
  content, 
  isComplete = false,
  className = ''
}: StreamingMessageProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <MarkdownContent content={content} />
        {!isComplete && (
          <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to reduce re-renders during streaming
  // Only re-render if content length changes significantly or completion status changes
  if (prevProps.isComplete !== nextProps.isComplete) return false
  if (Math.abs(prevProps.content.length - nextProps.content.length) > 10) return false
  return true
})