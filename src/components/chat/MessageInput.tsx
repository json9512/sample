import { useState, useRef, useEffect, forwardRef } from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  onStopStreaming?: () => void
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  isStreaming = false,
  onStopStreaming
}, ref) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Combine external ref with internal ref
  const combinedRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(combinedRef.current)
      } else {
        (ref as any).current = combinedRef.current
      }
    }
  }, [ref])
  
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isStreaming) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          <div className="flex w-full relative">
            <textarea
              ref={(el) => {
                (textareaRef as any).current = el
                ;(combinedRef as any).current = el
                if (ref) {
                  if (typeof ref === 'function') {
                    ref(el)
                  } else {
                    (ref as any).current = el
                  }
                }
              }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700',
                'bg-gray-50 dark:bg-gray-800 px-4 py-3 pr-12',
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'placeholder-gray-500 dark:placeholder-gray-400',
                'text-gray-900 dark:text-gray-100',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'min-h-[48px] max-h-[200px]',
                'scrollbar-hide overflow-y-auto'
              )}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            />
          </div>
          
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="flex-shrink-0 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-colors mt-0"
              aria-label="Stop streaming"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors mt-0',
                message.trim() && !disabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  )
})