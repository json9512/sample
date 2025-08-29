import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '@/components/chat/MessageInput'

// cn utility and lucide-react icons are already mocked globally in jest.setup.js

describe('MessageInput', () => {
  const defaultProps = {
    onSendMessage: jest.fn(),
    disabled: false,
    placeholder: 'Type your message...',
    isStreaming: false,
    onStopStreaming: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders input field with placeholder', () => {
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toBeEnabled()
  })

  it('displays send button when not streaming', () => {
    render(<MessageInput {...defaultProps} />)
    
    expect(screen.getByTestId('send-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument()
  })

  it('displays stop button when streaming', () => {
    render(<MessageInput {...defaultProps} isStreaming={true} />)
    
    expect(screen.getByTestId('square-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument()
  })

  it('calls onSendMessage when form is submitted', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    await user.type(textarea, 'Hello world!')
    await user.click(sendButton)
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello world!')
  })

  it('calls onSendMessage when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    
    await user.type(textarea, 'Hello world!')
    await user.keyboard('{Enter}')
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello world!')
  })

  it('creates new line when Shift+Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
    
    await user.type(textarea, 'Line 1')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(textarea, 'Line 2')
    
    expect(textarea.value).toBe('Line 1\nLine 2')
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('clears input after sending message', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    await user.type(textarea, 'Test message')
    await user.click(sendButton)
    
    await waitFor(() => {
      expect(textarea.value).toBe('')
    })
  })

  it('trims whitespace from message before sending', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    await user.type(textarea, '   Hello world!   ')
    await user.click(sendButton)
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello world!')
  })

  it('does not send empty or whitespace-only messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    // Try sending empty message
    await user.click(sendButton)
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    
    // Try sending whitespace-only message
    await user.type(textarea, '   ')
    await user.click(sendButton)
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('disables send button when input is empty', () => {
    render(<MessageInput {...defaultProps} />)
    
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when input has content', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    expect(sendButton).toBeDisabled()
    
    await user.type(textarea, 'Hello')
    
    await waitFor(() => {
      expect(sendButton).toBeEnabled()
    })
  })

  it('calls onStopStreaming when stop button is clicked', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} isStreaming={true} />)
    
    const stopButton = screen.getByRole('button', { name: /stop streaming/i })
    await user.click(stopButton)
    
    expect(defaultProps.onStopStreaming).toHaveBeenCalled()
  })

  it('disables input when disabled prop is true', () => {
    render(<MessageInput {...defaultProps} disabled={true} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    expect(textarea).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('prevents sending when disabled', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} disabled={true} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    
    // Try typing and pressing Enter
    await user.type(textarea, 'Hello')
    await user.keyboard('{Enter}')
    
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('prevents sending when streaming', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} isStreaming={true} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    
    await user.type(textarea, 'Hello')
    await user.keyboard('{Enter}')
    
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('shows keyboard shortcut hint', () => {
    render(<MessageInput {...defaultProps} />)
    
    expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument()
  })

  it('uses custom placeholder when provided', () => {
    render(<MessageInput {...defaultProps} placeholder="Custom placeholder..." />)
    
    expect(screen.getByPlaceholderText('Custom placeholder...')).toBeInTheDocument()
  })

  it('auto-resizes textarea height', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText('Type your message...')
    
    // Test that textarea exists and has proper attributes for auto-resize
    expect(textarea).toHaveClass('resize-none')
    expect(textarea).toHaveAttribute('rows')
    
    // Add multiple lines
    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2{Shift>}{Enter}{/Shift}Line 3')
    
    // Textarea should contain the multiline content
    expect(textarea.value).toBe('Line 1\nLine 2\nLine 3')
    expect(textarea.value.split('\n')).toHaveLength(3)
  })
})