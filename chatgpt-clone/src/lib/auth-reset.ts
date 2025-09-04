import { createSupabaseClient } from '@/lib/supabase/client'

export async function resetAuthState() {
  try {
    const supabase = createSupabaseClient()
    
    // Clear all auth-related localStorage items
    const authKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')
    )
    
    authKeys.forEach(key => localStorage.removeItem(key))
    
    // Sign out to clear server session
    await supabase.auth.signOut()
    
    console.log('Auth state reset successfully')
    return true
  } catch (error) {
    console.error('Error resetting auth state:', error)
    return false
  }
}

export function clearAuthCookies() {
  // Clear auth-related cookies by setting them to expire
  const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token']
  
  authCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })
}