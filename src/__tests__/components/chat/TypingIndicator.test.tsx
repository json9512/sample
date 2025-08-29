import React from 'react'
import { render, screen } from '@testing-library/react'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

describe('TypingIndicator', () => {
  it('renders with default assistant name', () => {
    render(<TypingIndicator />)
    
    expect(screen.getByText('Assistant is typing')).toBeInTheDocument()
  })

  it('renders with custom name', () => {
    render(<TypingIndicator name="Claude" />)
    
    expect(screen.getByText('Claude is typing')).toBeInTheDocument()
    expect(screen.queryByText('Assistant is typing')).not.toBeInTheDocument()
  })

  it('displays avatar with "A" initial', () => {
    render(<TypingIndicator />)
    
    const avatar = screen.getByText('A')
    expect(avatar).toBeInTheDocument()
    
    // Check avatar styling
    const avatarContainer = avatar.closest('div')
    expect(avatarContainer).toHaveClass('bg-green-600')
    expect(avatarContainer).toHaveClass('rounded-full')
  })

  it('displays animated dots', () => {
    render(<TypingIndicator />)
    
    // Should have 3 animated dots
    const animatedDots = document.querySelectorAll('.animate-bounce')
    expect(animatedDots).toHaveLength(3)
    
    // Check that dots have different animation delays
    expect(animatedDots[0]).toHaveStyle({ animationDelay: '0ms' })
    expect(animatedDots[1]).toHaveStyle({ animationDelay: '150ms' })
    expect(animatedDots[2]).toHaveStyle({ animationDelay: '300ms' })
  })

  it('has correct structure and styling', () => {
    render(<TypingIndicator />)
    
    // Main container
    const container = screen.getByText('Assistant is typing').closest('div')?.parentElement
    expect(container).toHaveClass('flex', 'items-center', 'gap-4', 'p-4')
    
    // Avatar container
    const avatar = screen.getByText('A')
    const avatarContainer = avatar.closest('div')
    expect(avatarContainer).toHaveClass('w-8', 'h-8', 'bg-green-600', 'rounded-full')
    
    // Text styling
    const typingText = screen.getByText('Assistant is typing')
    expect(typingText).toHaveClass('text-sm', 'text-gray-600')
  })

  it('renders dots with correct styling', () => {
    render(<TypingIndicator />)
    
    const dots = document.querySelectorAll('.animate-bounce')
    
    dots.forEach(dot => {
      expect(dot).toHaveClass('w-1.5', 'h-1.5', 'bg-gray-400', 'rounded-full')
    })
  })

  it('displays proper gap between elements', () => {
    render(<TypingIndicator />)
    
    // Dots container should have proper gap
    const dotsContainer = document.querySelector('.flex.gap-1')
    expect(dotsContainer).toBeInTheDocument()
    
    // Main content should have gap
    const contentContainer = document.querySelector('.flex.items-center.gap-2')
    expect(contentContainer).toBeInTheDocument()
  })

  it('handles empty name gracefully', () => {
    render(<TypingIndicator name="" />)
    
    expect(screen.getByText('is typing')).toBeInTheDocument()
  })

  it('handles special characters in name', () => {
    const specialName = 'AI-Bot_2024'
    render(<TypingIndicator name={specialName} />)
    
    expect(screen.getByText(`${specialName} is typing`)).toBeInTheDocument()
  })

  it('maintains accessibility for screen readers', () => {
    render(<TypingIndicator />)
    
    // The typing indicator should be readable by screen readers
    const typingText = screen.getByText('Assistant is typing')
    expect(typingText).toBeInTheDocument()
    
    // Avatar should have proper text content
    const avatar = screen.getByText('A')
    expect(avatar).toBeInTheDocument()
  })
})