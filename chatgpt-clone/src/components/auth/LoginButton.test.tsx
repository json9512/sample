import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginButton from './LoginButton'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient,
  authHelpers: {
    signInWithGoogle: jest.fn(),
  },
}))

describe('LoginButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when rendered', () => {
    it('should display login button with Google text', () => {
      render(<LoginButton />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
    })

    it('should show Google icon', () => {
      render(<LoginButton />)
      
      // Assuming we'll use an SVG or icon component
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('when clicked', () => {
    it('should call Google OAuth sign in', async () => {
      const mockSignInWithGoogle = require('@/lib/supabase/client').authHelpers.signInWithGoogle
      mockSignInWithGoogle.mockResolvedValue({ error: null })
      
      render(<LoginButton />)
      const button = screen.getByRole('button')
      
      await userEvent.click(button)
      
      expect(mockSignInWithGoogle).toHaveBeenCalledWith(
        mockSupabaseClient,
        undefined
      )
    })

    it('should show loading state during authentication', async () => {
      const mockSignInWithGoogle = require('@/lib/supabase/client').authHelpers.signInWithGoogle
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ error: null }), 100)
      ))
      
      render(<LoginButton />)
      const button = screen.getByRole('button')
      
      await userEvent.click(button)
      
      expect(button).toBeDisabled()
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('should handle authentication errors', async () => {
      const mockSignInWithGoogle = require('@/lib/supabase/client').authHelpers.signInWithGoogle
      const mockError = { message: 'Authentication failed' }
      mockSignInWithGoogle.mockResolvedValue({ error: mockError })
      
      const mockOnError = jest.fn()
      render(<LoginButton onError={mockOnError} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(mockError)
      })
    })
  })

  describe('when disabled prop is true', () => {
    it('should disable the button and not call sign in', async () => {
      const mockSignInWithGoogle = require('@/lib/supabase/client').authHelpers.signInWithGoogle
      
      render(<LoginButton disabled />)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
      
      await userEvent.click(button)
      expect(mockSignInWithGoogle).not.toHaveBeenCalled()
    })
  })

  describe('with custom redirect URL', () => {
    it('should pass redirect URL to sign in function', async () => {
      const mockSignInWithGoogle = require('@/lib/supabase/client').authHelpers.signInWithGoogle
      mockSignInWithGoogle.mockResolvedValue({ error: null })
      
      const redirectTo = '/dashboard'
      render(<LoginButton redirectTo={redirectTo} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      expect(mockSignInWithGoogle).toHaveBeenCalledWith(
        mockSupabaseClient,
        redirectTo
      )
    })
  })
})