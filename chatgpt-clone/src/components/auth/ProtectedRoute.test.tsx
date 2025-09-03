import { render, screen } from '@testing-library/react'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from './AuthProvider'

// Mock the useAuth hook
jest.mock('./AuthProvider', () => ({
  useAuth: jest.fn(),
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('ProtectedRoute Component', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when user is loading', () => {
    it('should show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: true,
        signOut: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('when user is not authenticated', () => {
    it('should redirect to login page', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signOut: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('when user is authenticated', () => {
    it('should render protected content', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { user: mockUser, access_token: 'token' } as any,
        loading: false,
        signOut: jest.fn(),
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('with custom redirect URL', () => {
    it('should redirect to custom URL when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signOut: jest.fn(),
      })

      render(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(mockPush).toHaveBeenCalledWith('/custom-login')
    })
  })

  describe('loading customization', () => {
    it('should render custom loading component when provided', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: true,
        signOut: jest.fn(),
      })

      const customLoading = <div data-testid="custom-loading">Custom Loading...</div>

      render(
        <ProtectedRoute loadingComponent={customLoading}>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })
})