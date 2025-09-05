import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createSupabaseServerClient() {
  // Use service role key for bypassing RLS
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Service role key not configured')
  }

  // Create server-side Supabase client with service role
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore cookie setting errors in server components
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  console.log('=== API ROUTE: /api/messages/[sessionId] GET called ===')
  console.log('Session ID:', params.sessionId)
  
  try {
    const supabase = await createSupabaseServerClient()

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication required for GET messages:', authError)
      return new Response('Authentication required', { status: 401 })
    }
    
    console.log('Fetching messages for session:', params.sessionId, 'user:', user.id)

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error fetching messages:', error)
      return new Response(`Database error: ${error.message}`, { status: 500 })
    }

    console.log('Messages fetched successfully:', data?.length || 0)
    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}