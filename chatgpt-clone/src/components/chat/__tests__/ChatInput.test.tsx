import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInput } from '../ChatInput'
import type { ChatInputProps } from '@/types/chat'

const defaultProps: ChatInputProps = {
  onSendMessage: jest.fn(),
  disabled: false,
  placeholder: 'Type your message...'
}

describe('ChatInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders input field with placeholder', () => {
    render(<ChatInput {...defaultProps} />)
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('renders send button', () => {
    render(<ChatInput {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('calls onSendMessage when form is submitted with text', async () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatInput {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const button = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Hello, world!' } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, world!')
    })
  })

  it('clears input after sending message', async () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatInput {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement
    const button = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Hello, world!' } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('does not call onSendMessage with empty message', () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatInput {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const button = screen.getByRole('button', { name: /send/i })
    fireEvent.click(button)
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })

  it('disables input and button when disabled prop is true', () => {
    render(<ChatInput {...defaultProps} disabled={true} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const button = screen.getByRole('button', { name: /send/i })
    
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('handles Enter key submission', async () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatInput {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    fireEvent.change(input, { target: { value: 'Hello via Enter!' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello via Enter!')
    })
  })

  it('does not submit on Enter + Shift (for multiline)', () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatInput {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    fireEvent.change(input, { target: { value: 'Multiline message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })
})