'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import Loading from '@/components/ui/Loading'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  loadingComponent?: ReactNode
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [loading, user, redirectTo, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {loadingComponent || <Loading size="lg" text="Loading..." centered />}
      </div>
    )
  }

  // Don't render anything if user is not authenticated
  // (router.push will handle the redirect)
  if (!user) {
    return null
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}