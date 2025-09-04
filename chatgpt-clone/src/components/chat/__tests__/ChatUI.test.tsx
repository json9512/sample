import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatUI } from '../ChatUI'
import type { Message, ChatSession } from '@/types/chat'

const mockSession: ChatSession = {
  id: 'session-1',
  title: 'Test Chat Session',
  user_id: 'user-1',
  created_at: new Date('2024-01-01T10:00:00Z'),
  updated_at: new Date('2024-01-01T10:30:00Z')
}

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello, how can I help you today?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    session_id: 'session-1',
    user_id: 'user-1'
  },
  {
    id: '2',
    content: 'I need help with my React app',
    role: 'user',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    session_id: 'session-1',
    user_id: 'user-1'
  }
]

const defaultProps = {
  session: mockSession,
  messages: mockMessages,
  onSendMessage: jest.fn(),
  isLoading: false
}

describe('ChatUI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it('renders messages correctly', () => {
    render(<ChatUI {...defaultProps} />)
    
    expect(screen.getByText('Hello, how can I help you today?')).toBeInTheDocument()
    expect(screen.getByText('I need help with my React app')).toBeInTheDocument()
  })

  it('renders session title when session exists', () => {
    render(<ChatUI {...defaultProps} />)
    
    expect(screen.getByText('Test Chat Session')).toBeInTheDocument()
  })

  it('renders default title when no session', () => {
    render(<ChatUI {...defaultProps} session={null} />)
    
    expect(screen.getByText('New Chat')).toBeInTheDocument()
  })

  it('renders chat input component', () => {
    render(<ChatUI {...defaultProps} />)
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('calls onSendMessage when message is sent', async () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatUI {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'New test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('New test message')
    })
  })

  it('displays loading state', () => {
    render(<ChatUI {...defaultProps} isLoading={true} />)
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('scrolls to bottom when new messages are added', () => {
    const scrollIntoViewMock = jest.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    const { rerender } = render(<ChatUI {...defaultProps} />)
    
    const newMessage: Message = {
      id: '3',
      content: 'New message',
      role: 'assistant',
      timestamp: new Date(),
      session_id: 'session-1',
      user_id: 'user-1'
    }
    
    rerender(<ChatUI {...defaultProps} messages={[...mockMessages, newMessage]} />)
    
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })

  it('handles empty messages array', () => {
    render(<ChatUI {...defaultProps} messages={[]} />)
    
    expect(screen.getByText('Test Chat Session')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('displays proper message ordering (oldest to newest)', () => {
    render(<ChatUI {...defaultProps} />)
    
    const messages = screen.getAllByText(/Claude|You/)
    expect(messages[0]).toHaveTextContent('Claude')
    expect(messages[1]).toHaveTextContent('You')
  })
})