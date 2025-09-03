import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, session, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <div data-testid="user">
        {user ? user.email : 'No user'}
      </div>
      <div data-testid="session">
        {session ? 'Has session' : 'No session'}
      </div>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when mounted', () => {
    it('should show loading state initially', () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should fetch initial session', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token123'
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      })
    })

    it('should set up auth state change listener', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
    })
  })

  describe('when user is authenticated', () => {
    it('should display user information', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token123' }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('session')).toHaveTextContent('Has session')
      })
    })
  })

  describe('when user is not authenticated', () => {
    it('should show no user state', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('session')).toHaveTextContent('No session')
      })
    })
  })

  describe('when auth state changes', () => {
    it('should update user and session when signed in', async () => {
      const mockUnsubscribe = jest.fn()
      let authStateCallback: any

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })

      // Simulate sign in
      const mockUser = { id: '123', email: 'new@example.com' }
      const mockSession = { user: mockUser, access_token: 'newtoken' }

      act(() => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('new@example.com')
        expect(screen.getByTestId('session')).toHaveTextContent('Has session')
      })
    })

    it('should clear user and session when signed out', async () => {
      const mockUnsubscribe = jest.fn()
      let authStateCallback: any

      // Start with authenticated user
      const initialUser = { id: '123', email: 'test@example.com' }
      const initialSession = { user: initialUser, access_token: 'token' }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: initialSession },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Simulate sign out
      act(() => {
        authStateCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('session')).toHaveTextContent('No session')
      })
    })
  })

  describe('signOut function', () => {
    it('should be available in context', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sign-out')).toBeInTheDocument()
      })
    })
  })

  describe('cleanup', () => {
    it('should unsubscribe from auth changes on unmount', async () => {
      const mockUnsubscribe = jest.fn()
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})