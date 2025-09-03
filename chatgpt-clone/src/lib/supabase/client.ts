import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { clientEnv } from '@/lib/env'

// Client-side Supabase client (singleton)
export let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      clientEnv.SUPABASE_URL,
      clientEnv.SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
}

// Server-side Supabase client
export function createServerSupabaseClient(cookieStore: any) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name: string, options: any) => {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Typed database client for better TypeScript support
export type SupabaseClient = ReturnType<typeof createSupabaseClient>

// Auth utility functions
export const authHelpers = {
  signInWithGoogle: async (client: SupabaseClient, redirectTo?: string) => {
    return await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      },
    })
  },

  signOut: async (client: SupabaseClient) => {
    return await client.auth.signOut()
  },

  getCurrentSession: async (client: SupabaseClient) => {
    return await client.auth.getSession()
  },

  getCurrentUser: async (client: SupabaseClient) => {
    const { data: { user } } = await client.auth.getUser()
    return user
  },
}