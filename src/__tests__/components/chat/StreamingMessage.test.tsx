import React from 'react'
import { render } from '@testing-library/react'
import { StreamingMessage } from '@/components/chat/StreamingMessage'

// @/lib/utils is already mocked globally in jest.setup.js

describe('StreamingMessage', () => {
  it('renders component without crashing', () => {
    const { container } = render(<StreamingMessage content="Hello world" />)
    
    // Component should render successfully
    expect(container.querySelector('.relative')).toBeInTheDocument()
    expect(container.querySelector('.prose')).toBeInTheDocument()
  })

  it('displays streaming cursor initially', () => {
    render(<StreamingMessage content="Hello world" />)
    
    const cursor = document.querySelector('.animate-pulse')
    expect(cursor).toBeInTheDocument()
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

  it('renders with onStreamComplete callback', () => {
    const onComplete = jest.fn()
    const { container } = render(<StreamingMessage content="Test" onStreamComplete={onComplete} />)
    
    // Component renders successfully
    expect(container.querySelector('.relative')).toBeInTheDocument()
  })
})