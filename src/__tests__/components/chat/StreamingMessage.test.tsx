import React from 'react'
import { render, screen } from '@testing-library/react'
import { StreamingMessage } from '@/components/chat/StreamingMessage'

// @/lib/utils is already mocked globally in jest.setup.js

describe('StreamingMessage', () => {
  it('renders component without crashing', () => {
    const { container } = render(<StreamingMessage content="Hello world" />)
    
    // Component should render successfully
    expect(container.querySelector('.relative')).toBeInTheDocument()
    expect(container.querySelector('.prose')).toBeInTheDocument()
  })

  it('displays streaming cursor when not complete', () => {
    render(<StreamingMessage content="Hello world" isComplete={false} />)
    
    const cursor = document.querySelector('.animate-pulse')
    expect(cursor).toBeInTheDocument()
  })

  it('hides streaming cursor when complete', () => {
    render(<StreamingMessage content="Hello world" isComplete={true} />)
    
    const cursor = document.querySelector('.animate-pulse')
    expect(cursor).not.toBeInTheDocument()
  })

  it('displays content text', () => {
    render(<StreamingMessage content="Test message content" />)
    
    expect(screen.getByText('Test message content')).toBeInTheDocument()
  })

  it('handles empty content gracefully', () => {
    render(<StreamingMessage content="" />)
    
    // Should render without crashing
    const container = document.querySelector('.relative')
    expect(container).toBeInTheDocument()
    
    // Should show cursor for empty content
    const cursor = document.querySelector('.animate-pulse')
    expect(cursor).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<StreamingMessage content="Test" className="custom-class" />)
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('uses default props when not provided', () => {
    render(<StreamingMessage content="Test" />)
    
    // Should show cursor by default (isComplete defaults to false)
    const cursor = document.querySelector('.animate-pulse')
    expect(cursor).toBeInTheDocument()
    
    // Should not have custom class (className defaults to empty)
    const container = document.querySelector('.relative')
    expect(container).not.toHaveClass('custom-class')
  })

  it('renders different content lengths correctly', () => {
    const shortContent = 'Hi'
    const longContent = 'This is a much longer message that should still render correctly in the streaming message component.'
    
    const { rerender } = render(<StreamingMessage content={shortContent} />)
    expect(screen.getByText(shortContent)).toBeInTheDocument()
    
    rerender(<StreamingMessage content={longContent} />)
    expect(screen.getByText(longContent)).toBeInTheDocument()
  })

  it('handles special characters in content', () => {
    const specialContent = 'Hello! @#$%^&*()_+{}|:"<>?[]\\;\',./'
    render(<StreamingMessage content={specialContent} />)
    
    expect(screen.getByText(specialContent)).toBeInTheDocument()
  })
})