'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Loading from '@/components/ui/Loading'

export default function LogoutPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    let isMounted = true

    const handleLogout = async () => {
      try {
        console.log('Starting logout process...')
        
        const supabase = createSupabaseClient()
        
        // Sign out from Supabase
        await supabase.auth.signOut()
        
        // Clear storage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.log('Storage clear error (normal in some browsers):', e)
        }
        
        console.log('Logout complete')
        
        if (isMounted) {
          setIsProcessing(false)
          // Direct navigation to login
          window.location.replace('/login')
        }
        
      } catch (error) {
        console.error('Logout error:', error)
        if (isMounted) {
          setIsProcessing(false)
          // Force redirect even on error
          window.location.replace('/login')
        }
      }
    }

    // Start logout immediately
    handleLogout()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [router])

  // Fallback redirect after 3 seconds
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log('Fallback redirect triggered')
      window.location.replace('/login')
    }, 3000)

    return () => clearTimeout(fallbackTimer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-gray-600">
          {isProcessing ? 'Signing you out...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}