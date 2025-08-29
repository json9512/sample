import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessageCard } from '@/components/chat/MessageCard'

// Mock formatMessageTime for consistent test results
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  cn: jest.fn((...classes: any[]) => classes.filter(Boolean).join(' ')),
  formatMessageTime: jest.fn(() => '1/1/2024'),
}))

describe('MessageCard', () => {
  const defaultProps = {
    role: 'user' as const,
    children: 'Test message content'
  }

  it('renders user message card with default name', () => {
    render(<MessageCard {...defaultProps} />)
    
    expect(screen.getByText('Test message content')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('renders assistant message card with default name', () => {
    render(
      <MessageCard role="assistant">
        Assistant response
      </MessageCard>
    )
    
    expect(screen.getByText('Assistant response')).toBeInTheDocument()
    expect(screen.getByText('Assistant')).toBeInTheDocument()
  })

  it('displays custom names when provided', () => {
    render(
      <MessageCard {...defaultProps} name="John Doe">
        Message from John
      </MessageCard>
    )
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })

  it('displays timestamp when provided', () => {
    const timestamp = '2024-01-01T12:00:00Z'
    render(
      <MessageCard {...defaultProps} timestamp={timestamp}>
        Message with timestamp
      </MessageCard>
    )
    
    // Check that mocked time format is displayed
    expect(screen.getByText('1/1/2024')).toBeInTheDocument()
  })

  it('displays avatar image when provided', () => {
    const avatarUrl = 'https://example.com/avatar.jpg'
    render(
      <MessageCard {...defaultProps} avatar={avatarUrl}>
        Message with avatar
      </MessageCard>
    )
    
    const avatarImg = screen.getByRole('img')
    expect(avatarImg).toBeInTheDocument()
    expect(avatarImg).toHaveAttribute('src', avatarUrl)
  })

  it('shows default avatar initials when no avatar provided', () => {
    render(<MessageCard {...defaultProps}>User message</MessageCard>)
    
    // Should show "Y" for "You"
    expect(screen.getByText('Y')).toBeInTheDocument()
  })

  it('shows assistant avatar initial', () => {
    render(
      <MessageCard role="assistant">
        Assistant message
      </MessageCard>
    )
    
    // Should show "A" for "Assistant"
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('applies correct background color for user messages', () => {
    const { container } = render(<MessageCard {...defaultProps}>User message</MessageCard>)
    
    // User messages should have background highlighting - check the main container
    const cardContainer = container.querySelector('.bg-gray-50\\/30')
    expect(cardContainer).toBeInTheDocument()
  })

  it('applies correct background color for assistant messages', () => {
    render(
      <MessageCard role="assistant">
        Assistant message
      </MessageCard>
    )
    
    // Assistant messages should not have background highlighting by default
    const cardContainer = screen.getByText('Assistant message').closest('div')
    expect(cardContainer).not.toHaveClass('bg-gray-50/30')
  })

  it('renders complex JSX content correctly', () => {
    render(
      <MessageCard {...defaultProps}>
        <div>
          <h3>Title</h3>
          <p>Paragraph content</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </div>
      </MessageCard>
    )
    
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph content')).toBeInTheDocument()
    expect(screen.getByText('List item 1')).toBeInTheDocument()
    expect(screen.getByText('List item 2')).toBeInTheDocument()
  })

  it('applies hover effects on card', () => {
    const { container } = render(<MessageCard {...defaultProps}>Hoverable card</MessageCard>)
    
    // Check for hover class in container
    const cardContainer = container.querySelector('.hover\\:bg-gray-50\\/50')
    expect(cardContainer).toBeInTheDocument()
  })

  it('displays correct avatar background colors', () => {
    const { rerender } = render(<MessageCard {...defaultProps}>User message</MessageCard>)
    
    // User avatar should have blue background
    let avatarContainer = screen.getByText('Y').closest('div')
    expect(avatarContainer).toHaveClass('bg-blue-600')
    
    // Assistant avatar should have green background
    rerender(<MessageCard role="assistant">Assistant message</MessageCard>)
    avatarContainer = screen.getByText('A').closest('div')
    expect(avatarContainer).toHaveClass('bg-green-600')
  })
})