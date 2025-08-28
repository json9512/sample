'use client'

import { useAuth } from '@/contexts/AuthContext'
import UserMenu from '@/components/auth/UserMenu'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ChatErrorBoundary } from '@/components/chat/ErrorBoundary'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">ChatGPT Clone</h1>
          <UserMenu />
        </div>
      </header>
      
      <div className="flex-1 min-h-0">
        <ChatErrorBoundary>
          <ChatInterface />
        </ChatErrorBoundary>
      </div>
    </main>
  )
}