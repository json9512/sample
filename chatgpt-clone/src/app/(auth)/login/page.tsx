'use client'

import LoginButton from '@/components/auth/LoginButton'
import { clientEnv } from '@/lib/env'

export default function LoginPage() {
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
          <div>
            <LoginButton 
              redirectTo="/dashboard"
              onError={(error) => {
                console.error('Login error:', error)
                alert('Login failed. Please try again.')
              }}
            />
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