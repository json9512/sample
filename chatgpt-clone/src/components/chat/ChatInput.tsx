'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'
import Button from '@/components/ui/Button'
import type { ChatInputProps } from '@/types/chat'

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = 'Type your message...' 
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t bg-white">
      <div className="flex-1">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={disabled || !message.trim()}
        variant="primary"
        size="md"
        className="self-end"
      >
        Send
      </Button>
    </form>
  )
}