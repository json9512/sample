import { createSupabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // User not found is acceptable
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data
}

/**
 * Create or update user profile
 */
export async function createUserProfile(user: UserInsert): Promise<UserProfile> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: UserUpdate
): Promise<UserProfile> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Sync user data from Supabase Auth to our users table
 */
export async function syncUserFromAuth(authUser: User): Promise<UserProfile> {
  const userProfile: UserInsert = {
    id: authUser.id,
    email: authUser.email!,
    name: authUser.user_metadata?.full_name || 
          authUser.user_metadata?.name || 
          authUser.email!.split('@')[0],
    avatar_url: authUser.user_metadata?.avatar_url || null,
    provider: authUser.app_metadata?.provider || 'google',
    provider_id: authUser.user_metadata?.provider_id || null,
    last_login: new Date().toISOString(),
    is_active: true,
  }

  return await createUserProfile(userProfile)
}

/**
 * Update user's last login time
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase
    .from('users')
    .update({ 
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating last login:', error)
    // Don't throw error for login time update failures
  }
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string): Promise<UserProfile> {
  return await updateUserProfile(userId, { 
    is_active: false 
  })
}

/**
 * Check if user exists in our database
 */
export async function userExists(userId: string): Promise<boolean> {
  const user = await getUserProfile(userId)
  return user !== null
}