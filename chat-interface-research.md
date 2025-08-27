# ChatGPT-Like Interface Implementation Patterns

## 1. Streaming Text Implementation

### Character-by-Character Rendering with Performance Optimization

Based on 2025 best practices, here's a React hook for streaming text with optimized performance:

```typescript
// hooks/useStreamingText.ts
import { useState, useEffect, useCallback } from 'react'

interface StreamingTextOptions {
  delay?: number
  onComplete?: () => void
  bufferSize?: number
}

export function useStreamingText(text: string, options: StreamingTextOptions = {}) {
  const { delay = 20, onComplete, bufferSize = 5 } = options
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex >= text.length) {
      setIsComplete(true)
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      // Batch character updates for better performance
      const nextIndex = Math.min(currentIndex + bufferSize, text.length)
      setDisplayedText(text.slice(0, nextIndex))
      setCurrentIndex(nextIndex)
    }, delay)

    return () => clearTimeout(timer)
  }, [text, currentIndex, delay, bufferSize, onComplete])

  const reset = useCallback(() => {
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [])

  return { displayedText, isComplete, reset }
}
```

### Streaming Message Component with Error Handling

```typescript
// components/StreamingMessage.tsx
import { useState } from 'react'
import { useStreamingText } from '@/hooks/useStreamingText'

interface StreamingMessageProps {
  content: string
  onStreamComplete?: () => void
  className?: string
}

export function StreamingMessage({ 
  content, 
  onStreamComplete, 
  className = '' 
}: StreamingMessageProps) {
  const [error, setError] = useState<string | null>(null)
  const { displayedText, isComplete } = useStreamingText(content, {
    delay: 25,
    onComplete: onStreamComplete,
    bufferSize: 3
  })

  return (
    <div className={`relative ${className}`}>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {displayedText}
        {!isComplete && (
          <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
        )}
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
```

### Advanced Streaming with Server-Sent Events

```typescript
// lib/streaming.ts
export async function* streamChatCompletion(
  message: string,
  conversationId?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No reader available')
    }

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              yield parsed.content
            }
          } catch (e) {
            console.warn('Failed to parse streaming chunk:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error)
    throw error
  }
}
```

## 2. Chat Interface Layout Patterns

### Message Bubble Design (2025 Standards)

Based on research showing optimal dimensions and color patterns:

```typescript
// components/MessageBubble.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
        {/* Message tail */}
        <div className={cn(
          'absolute top-4 w-0 h-0',
          isUser 
            ? 'right-[-6px] border-l-[6px] border-l-blue-600 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
            : 'left-[-6px] border-r-[6px] border-r-gray-100 dark:border-r-gray-800 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
        )} />
        
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
          {timestamp && (
            <span className="text-xs">
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
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
```

### Modern Card-Based Layout (AI Assistant Pattern)

Following 2025 trends toward card interfaces for better rich content support:

```typescript
// components/MessageCard.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-green-600 text-white'
        )}>
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full rounded-full" />
          ) : (
            <span>{isUser ? 'You' : 'AI'}</span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {name || (isUser ? 'You' : 'Assistant')}
          </span>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
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
```

### Conversation Sidebar with Modern Navigation

```typescript
// components/ConversationSidebar.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MessageSquare, Plus, Search, Trash2 } from 'lucide-react'

interface Conversation {
  id: string
  title: string
  updated_at: string
  message_count: number
}

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-l-4 transition-colors',
              activeConversationId === conversation.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
                : 'border-l-transparent'
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {conversation.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {conversation.message_count} messages • {new Date(conversation.updated_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteConversation(conversation.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Responsive Message Input Field

```typescript
// components/MessageInput.tsx
import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  onStopStreaming?: () => void
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  isStreaming = false,
  onStopStreaming
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
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
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
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
                'min-h-[48px] max-h-[200px]'
              )}
            />
          </div>
          
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="flex-shrink-0 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-colors"
              aria-label="Stop streaming"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
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
}
```

## 3. Real-time UX Patterns

### Typing Indicator Component

```typescript
// components/TypingIndicator.tsx
export function TypingIndicator({ name = "Assistant" }: { name?: string }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
        AI
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {name} is typing
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
```

### Loading States with Skeleton UI

```typescript
// components/MessageSkeleton.tsx
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%] animate-pulse">
        <div className={`rounded-2xl p-4 ${
          isUser 
            ? 'bg-gray-200 dark:bg-gray-700 rounded-br-md' 
            : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
        }`}>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Error State Handling

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## 4. Accessibility Implementation (WCAG 2025 Compliant)

### Chat Log with ARIA Live Region

```typescript
// components/AccessibleChatLog.tsx
import { useEffect, useRef } from 'react'

interface AccessibleChatLogProps {
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  isStreaming?: boolean
}

export function AccessibleChatLog({ messages, isStreaming }: AccessibleChatLogProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const announceRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages])

  // Announce new messages to screen readers
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && announceRef.current) {
      // Brief delay to ensure message is rendered
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = `Assistant: ${lastMessage.content}`
        }
      }, 100)
    }
  }, [messages])

  return (
    <div className="flex-1 overflow-hidden">
      {/* Screen reader announcements */}
      <div
        ref={announceRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="false"
        role="status"
      />
      
      {/* Main chat log */}
      <div
        ref={logRef}
        className="h-full overflow-y-auto px-4 pb-4 focus:outline-none"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
        aria-atomic="false"
        tabIndex={0}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              aria-label={`${message.role === 'user' ? 'Your' : 'Assistant'} message at ${new Date(message.timestamp).toLocaleTimeString()}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
                role="article"
                aria-labelledby={`message-${message.id}-label`}
              >
                <div
                  id={`message-${message.id}-label`}
                  className="sr-only"
                >
                  {message.role === 'user' ? 'You said:' : 'Assistant replied:'}
                </div>
                <div className="prose prose-sm max-w-none">
                  {message.content}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isStreaming && (
            <div className="flex justify-start" role="status" aria-label="Assistant is typing">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="sr-only">Assistant is typing</span>
                  <div className="flex gap-1" aria-hidden="true">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### Keyboard Navigation Hook

```typescript
// hooks/useKeyboardNavigation.ts
import { useEffect } from 'react'

interface KeyboardNavigationOptions {
  onNewConversation?: () => void
  onFocusInput?: () => void
  onToggleSidebar?: () => void
  disabled?: boolean
}

export function useKeyboardNavigation({
  onNewConversation,
  onFocusInput,
  onToggleSidebar,
  disabled = false
}: KeyboardNavigationOptions) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N for new conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        onNewConversation?.()
      }
      
      // Cmd/Ctrl + L to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        onFocusInput?.()
      }
      
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        onToggleSidebar?.()
      }
      
      // Escape to clear focus
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        activeElement?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onNewConversation, onFocusInput, onToggleSidebar, disabled])
}
```

## 5. Performance Considerations & Optimization

### Virtual Scrolling for Large Conversations

```typescript
// hooks/useVirtualScrolling.ts
import { useState, useEffect, useMemo } from 'react'

interface VirtualScrollingOptions {
  itemHeight: number
  containerHeight: number
  items: any[]
  overscan?: number
}

export function useVirtualScrolling({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: VirtualScrollingOptions) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    
    return {
      start: Math.max(0, start - overscan),
      end
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])
  
  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }
  }
}
```

### Message Caching Strategy

```typescript
// lib/messageCache.ts
interface CachedMessage {
  id: string
  content: string
  timestamp: number
}

class MessageCache {
  private cache = new Map<string, CachedMessage>()
  private maxSize = 1000
  
  set(id: string, content: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries (LRU)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(id, {
      id,
      content,
      timestamp: Date.now()
    })
  }
  
  get(id: string): CachedMessage | undefined {
    const cached = this.cache.get(id)
    if (cached) {
      // Update timestamp for LRU
      cached.timestamp = Date.now()
      this.cache.set(id, cached)
    }
    return cached
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  has(id: string): boolean {
    return this.cache.has(id)
  }
}

export const messageCache = new MessageCache()
```

## 6. Recommended Libraries and Utilities

### Essential Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.3",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.344.0",
    "react-intersection-observer": "^9.8.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/node": "^20.11.19",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

### Utility Functions

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageTime(timestamp: string | Date): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString()
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
```

This comprehensive implementation guide provides production-ready patterns for building a ChatGPT-like interface with Next.js 14, TypeScript, and Tailwind CSS, incorporating 2025 best practices for performance, accessibility, and user experience.