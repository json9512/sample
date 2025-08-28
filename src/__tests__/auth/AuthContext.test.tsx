import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { mockSupabaseClient } from '../../__mocks__/supabase'

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div data-testid="loading">Loading...</div>
  if (user) {
    return (
      <div>
        <div data-testid="user-email">{user.email}</div>
        <button onClick={signOut} data-testid="sign-out">
          Sign Out
        </button>
      </div>
    )
  }
  return <div data-testid="not-authenticated">Not authenticated</div>
}

describe('AuthContext', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to default state
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => ({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    }))
  })

  it('provides loading state initially', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument()
    })
  })

  it('provides user when authenticated', async () => {
    // Mock successful session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('shows not authenticated when no user', async () => {
    // Default mock already returns null session
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument()
    })
  })

  it('handles sign out', async () => {
    // Start with authenticated user
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toBeInTheDocument()
    })

    const signOutButton = screen.getByTestId('sign-out')
    await act(async () => {
      signOutButton.click()
    })

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
  })

  it('handles auth state changes', async () => {
    let authCallback: any

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initial state - not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument()
    })

    // Simulate sign in
    await act(async () => {
      authCallback('SIGNED_IN', { user: mockUser })
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    // Simulate sign out
    await act(async () => {
      authCallback('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument()
    })
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})