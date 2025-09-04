'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { createSupabaseClient, authHelpers } from '@/lib/supabase/client'

interface LoginButtonProps {
  redirectTo?: string
  disabled?: boolean
  onError?: (error: any) => void
  onSuccess?: () => void
}

const LoginButton = ({ 
  redirectTo, 
  disabled, 
  onError, 
  onSuccess 
}: LoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createSupabaseClient()

  const handleGoogleSignIn = async () => {
    console.log('Google sign in button clicked')
    
    if (disabled) {
      console.log('Button is disabled, returning')
      return
    }

    setIsLoading(true)
    console.log('Starting Google sign in process')
    
    try {
      const { error } = await authHelpers.signInWithGoogle(supabase, redirectTo)
      
      if (error) {
        console.error('Google sign in error:', error)
        onError?.(error)
      } else {
        console.log('Google sign in successful')
        onSuccess?.()
      }
    } catch (error) {
      console.error('Google sign in exception:', error)
      onError?.(error)
    } finally {
      setIsLoading(false)
      console.log('Google sign in process completed')
    }
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      loading={isLoading}
      variant="primary"
      size="lg"
      className="w-full flex items-center justify-center gap-3"
    >
      {!isLoading && (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  )
}

export default LoginButton