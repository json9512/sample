'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient, authHelpers } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle successful sign in
        if (event === 'SIGNED_IN' && session?.user) {
          // Sync user data to our database
          await syncUserToDatabase(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Sync user data to our database
  const syncUserToDatabase = async (authUser: User) => {
    try {
      const { syncUserFromAuth } = await import('@/lib/services/userService')
      await syncUserFromAuth(authUser)
    } catch (error) {
      console.error('Error syncing user to database:', error)
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase
      await authHelpers.signOut(supabase)
      
      // Clear local state
      setUser(null)
      setSession(null)
      
      // Clear any remaining auth data
      const { resetAuthState } = await import('@/lib/auth-reset')
      await resetAuthState()
      
      console.log('Sign out successful')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}