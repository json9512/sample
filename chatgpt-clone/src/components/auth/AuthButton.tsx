'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface AuthButtonProps {
  onAuthChange?: (user: any) => void
}

export function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createSupabaseClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Auth error:', error)
      } else {
        console.log('Auth success:', data)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        setUser(null)
        onAuthChange?.(null)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Check auth state on component mount
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      onAuthChange?.(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      onAuthChange?.(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  })

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-700">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={loading}
      variant="primary"
      size="sm"
    >
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  )
}