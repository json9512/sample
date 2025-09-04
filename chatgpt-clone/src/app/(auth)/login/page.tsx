'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoginButton from '@/components/auth/LoginButton'
import EmailLoginButton from '@/components/auth/EmailLoginButton'
import { clientEnv } from '@/lib/env'
import { resetAuthState } from '@/lib/auth-reset'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const details = searchParams.get('details')
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('google')
  
  useEffect(() => {
    // Reset auth state if there was an auth error
    if (error === 'auth_failed') {
      resetAuthState()
    }
  }, [error])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-blue-600">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to {clientEnv.APP_NAME}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start chatting with Claude AI
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">
                {error === 'auth_failed' 
                  ? 'Authentication failed. Please try again.' 
                  : 'An error occurred during login. Please try again.'}
                {details && (
                  <div className="mt-2 text-xs text-red-600">
                    Details: {decodeURIComponent(details)}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Auth Method Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'email' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email Login
            </button>
            <button
              onClick={() => setAuthMethod('google')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'google' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Google Login
            </button>
          </div>
          
          <div>
            {authMethod === 'email' ? (
              <EmailLoginButton />
            ) : (
              <LoginButton 
                redirectTo="/dashboard"
                onError={(error) => {
                  console.error('Login error:', error)
                  alert('Google login failed. Try email login instead.')
                }}
              />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}