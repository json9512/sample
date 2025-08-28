import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import LoginButton from '@/components/auth/LoginButton'
import { mockSupabaseClient } from '../../__mocks__/supabase'

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock to default behavior
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://oauth-url.com' },
      error: null,
    })
  })

  it('renders login button with Google branding', () => {
    render(<LoginButton />)
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('flex', 'items-center', 'gap-2')
  })

  it('calls signInWithOAuth when clicked', async () => {
    render(<LoginButton />)
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    })
  })

  it('handles authentication errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock error response
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'OAuth error' },
    })

    render(<LoginButton />)
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error logging in:', 'OAuth error')
    })
    
    consoleSpy.mockRestore()
  })

  it('has proper accessibility attributes', () => {
    render(<LoginButton />)
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    expect(button).toHaveAttribute('class')
    expect(button).not.toHaveAttribute('disabled')
  })

  it('has focus styles for keyboard navigation', () => {
    render(<LoginButton />)
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
  })

  it('contains Google icon SVG', () => {
    render(<LoginButton />)
    
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-5', 'h-5')
  })

  it('handles click events without errors', async () => {
    render(<LoginButton />)
    
    const button = screen.getByRole('button', { name: /continue with google/i })
    
    // Should not throw errors
    expect(() => {
      fireEvent.click(button)
    }).not.toThrow()

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalled()
    })
  })
})