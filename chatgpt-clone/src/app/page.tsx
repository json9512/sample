'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Loading from '@/components/ui/Loading'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading size="lg" text="Redirecting..." centered />
    </div>
  )
}