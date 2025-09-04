import { render, screen } from '@testing-library/react'
import { MessageItem } from '../MessageItem'
import type { Message } from '@/types/chat'

const mockUserMessage: Message = {
  id: '1',
  content: 'Hello, how are you?',
  role: 'user',
  timestamp: new Date('2024-01-01T10:00:00Z'),
  session_id: 'session-1',
  user_id: 'user-1'
}

const mockAssistantMessage: Message = {
  id: '2',
  content: 'I am doing well, thank you for asking!',
  role: 'assistant',
  timestamp: new Date('2024-01-01T10:01:00Z'),
  session_id: 'session-1',
  user_id: 'user-1'
}

describe('MessageItem', () => {
  it('renders user message correctly', () => {
    render(<MessageItem message={mockUserMessage} isLast={false} />)
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    render(<MessageItem message={mockAssistantMessage} isLast={false} />)
    
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument()
    expect(screen.getByText('Claude')).toBeInTheDocument()
  })

  it('displays timestamp for user messages', () => {
    render(<MessageItem message={mockUserMessage} isLast={false} />)
    
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('displays timestamp for assistant messages', () => {
    render(<MessageItem message={mockAssistantMessage} isLast={false} />)
    
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('applies correct styling for user messages', () => {
    render(<MessageItem message={mockUserMessage} isLast={false} />)
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('[data-testid="message-container"]')
    expect(messageContainer).toHaveClass('justify-end')
  })

  it('applies correct styling for assistant messages', () => {
    render(<MessageItem message={mockAssistantMessage} isLast={false} />)
    
    const messageContainer = screen.getByText('I am doing well, thank you for asking!').closest('[data-testid="message-container"]')
    expect(messageContainer).toHaveClass('justify-start')
  })

  it('handles empty message content', () => {
    const emptyMessage: Message = {
      ...mockUserMessage,
      content: ''
    }
    
    render(<MessageItem message={emptyMessage} isLast={false} />)
    
    expect(screen.getByTestId('message-container')).toBeInTheDocument()
  })

  it('formats long messages properly', () => {
    const longMessage: Message = {
      ...mockAssistantMessage,
      content: 'This is a very long message that should wrap properly and maintain good readability even when it spans multiple lines in the chat interface.'
    }
    
    render(<MessageItem message={longMessage} isLast={false} />)
    
    expect(screen.getByText(/This is a very long message/)).toBeInTheDocument()
  })
})