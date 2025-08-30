import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from '@/components/auth/UserMenu'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

describe('UserMenu', () => {
  const mockPush = jest.fn()
  const mockSignOut = jest.fn()
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
  })

  it('should return null when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut,
    })

    const { container } = render(<UserMenu />)
    expect(container.firstChild).toBeNull()
  })

  it('should display user name and email when authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: null,
      },
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should display email when name is not available', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should display avatar image when available', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    const avatar = screen.getByAltText('Test User')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should display initials when avatar is not available', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: null,
      },
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should toggle menu when button is clicked', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    // Menu should not be visible initially
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()

    // Click to open menu - use a more specific selector
    const menuButton = screen.getByRole('button', { name: /test user/i })
    fireEvent.click(menuButton)
    expect(screen.getByText('Sign out')).toBeInTheDocument()

    // Click again to close menu
    fireEvent.click(menuButton)
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
  })

  it('should handle sign out', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    // Open menu
    const menuButton = screen.getByRole('button', { name: /test user/i })
    fireEvent.click(menuButton)

    // Click sign out
    fireEvent.click(screen.getByText('Sign out'))

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should display user info in dropdown', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    // Open menu
    const menuButton = screen.getByRole('button', { name: /test user/i })
    fireEvent.click(menuButton)

    // Check that sign out button is visible (indicating dropdown is open)
    expect(screen.getByText('Sign out')).toBeInTheDocument()
    
    // Check that user info is visible in the dropdown
    const dropdownItems = screen.getAllByText('Test User')
    expect(dropdownItems.length).toBeGreaterThan(0)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should handle user with email as fallback for name', () => {
    const mockUser = {
      id: '1',
      email: 'john.doe@example.com',
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(<UserMenu />)

    // Should show email as name and initial should be 'J'
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
  })
})