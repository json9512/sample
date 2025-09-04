'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Signed in as {user?.email}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.user_metadata?.avatar_url && (
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                />
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  console.log('Profile Sign Out clicked')
                  window.location.href = '/auth/logout'
                }}
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-blue-900">
                ChatGPT Clone
              </h3>
              <p className="mt-2 text-blue-700">
                Ready to start chatting with Claude AI!
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/dashboard'}
                  size="md"
                >
                  Start Chatting
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">
              User Profile Information
            </h3>
            <div className="mt-4 bg-gray-50 rounded-md p-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
                    {user?.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Provider</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {user?.app_metadata?.provider || 'Google'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user?.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString() 
                      : 'N/A'
                    }
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}