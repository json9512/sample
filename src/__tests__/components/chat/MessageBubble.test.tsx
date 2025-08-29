import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '@/components/chat/MessageBubble'

// Mock formatMessageTime for consistent test results
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  cn: jest.fn((...classes: any[]) => classes.filter(Boolean).join(' ')),
  formatMessageTime: jest.fn(() => '1/1/2024'),
}))

describe('MessageBubble', () => {
  const defaultProps = {
    role: 'user' as const,
    children: 'Test message content'
  }

  it('renders user message with correct styling', () => {
    render(<MessageBubble {...defaultProps} />)
    
    const messageContent = screen.getByText('Test message content')
    expect(messageContent).toBeInTheDocument()
    
    // Check if user styles are applied (blue background)
    const messageContainer = messageContent.closest('div')?.parentElement
    expect(messageContainer).toHaveClass('bg-blue-600')
  })

  it('renders assistant message with correct styling', () => {
    render(
      <MessageBubble role="assistant">
        Assistant response
      </MessageBubble>
    )
    
    const messageContent = screen.getByText('Assistant response')
    expect(messageContent).toBeInTheDocument()
    
    // Check if assistant styles are applied (gray background)
    const messageContainer = messageContent.closest('div')?.parentElement
    expect(messageContainer).toHaveClass('bg-gray-100')
  })

  it('displays timestamp when provided', () => {
    const timestamp = '2024-01-01T12:00:00Z'
    render(
      <MessageBubble {...defaultProps} timestamp={timestamp}>
        Message with timestamp
      </MessageBubble>
    )
    
    // Check that mocked time format is displayed
    expect(screen.getByText('1/1/2024')).toBeInTheDocument()
  })

  it('displays sending status indicator for user messages', () => {
    render(
      <MessageBubble {...defaultProps} status="sending">
        Sending message
      </MessageBubble>
    )
    
    // Check for sending indicator (pulsing dot)
    const sendingIndicator = document.querySelector('.animate-pulse')
    expect(sendingIndicator).toBeInTheDocument()
  })

  it('displays sent status indicator for user messages', () => {
    render(
      <MessageBubble {...defaultProps} status="sent">
        Sent message
      </MessageBubble>
    )
    
    // Check for sent indicator (green dot)
    const sentIndicator = document.querySelector('.bg-green-400')
    expect(sentIndicator).toBeInTheDocument()
  })

  it('displays error status indicator for user messages', () => {
    render(
      <MessageBubble {...defaultProps} status="error">
        Failed message
      </MessageBubble>
    )
    
    // Check for error indicator (red dot)
    const errorIndicator = document.querySelector('.bg-red-400')
    expect(errorIndicator).toBeInTheDocument()
  })

  it('does not display status indicators for assistant messages', () => {
    render(
      <MessageBubble role="assistant" status="sent">
        Assistant message
      </MessageBubble>
    )
    
    // Status indicators should only show for user messages
    const statusIndicators = document.querySelectorAll('.bg-green-400, .bg-red-400, .animate-pulse')
    expect(statusIndicators).toHaveLength(0)
  })

  it('handles complex content with JSX elements', () => {
    render(
      <MessageBubble {...defaultProps}>
        <div>
          <p>Complex message</p>
          <span>with multiple elements</span>
        </div>
      </MessageBubble>
    )
    
    expect(screen.getByText('Complex message')).toBeInTheDocument()
    expect(screen.getByText('with multiple elements')).toBeInTheDocument()
  })

  it('applies correct layout classes for user vs assistant', () => {
    const { rerender } = render(<MessageBubble {...defaultProps}>User message</MessageBubble>)
    
    // User message should be right-aligned
    let container = screen.getByText('User message').closest('.flex')
    expect(container).toHaveClass('justify-end')
    
    // Assistant message should be left-aligned
    rerender(<MessageBubble role="assistant">Assistant message</MessageBubble>)
    container = screen.getByText('Assistant message').closest('.flex')
    expect(container).toHaveClass('justify-start')
  })
})