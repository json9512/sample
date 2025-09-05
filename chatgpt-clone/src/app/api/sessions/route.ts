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

export async function GET(request: NextRequest) {
  console.log('=== API ROUTE: /api/sessions GET called ===')
  
  try {
    const supabase = await createSupabaseServerClient()

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication required for GET sessions:', authError)
      return new Response('Authentication required', { status: 401 })
    }
    
    console.log('Fetching sessions for user:', user.id, user.email)

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error fetching sessions:', error)
      return new Response(`Database error: ${error.message}`, { status: 500 })
    }

    console.log('Sessions fetched successfully:', data?.length || 0)
    console.log('Session data:', JSON.stringify(data, null, 2))
    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  console.log('=== API ROUTE: /api/sessions PATCH called ===')
  
  try {
    const { sessionId, title } = await request.json()
    console.log('Updating session:', sessionId, 'with title:', title)

    const supabase = await createSupabaseServerClient()

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication required for PATCH session:', authError)
      return new Response('Authentication required', { status: 401 })
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating session:', error)
      return new Response(`Database error: ${error.message}`, { status: 500 })
    }

    console.log('Session updated successfully:', data)
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('=== API ROUTE: /api/sessions DELETE called ===')
  
  try {
    const { sessionId } = await request.json()
    console.log('Deleting session:', sessionId)

    const supabase = await createSupabaseServerClient()

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication required for DELETE session:', authError)
      return new Response('Authentication required', { status: 401 })
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error deleting session:', error)
      return new Response(`Database error: ${error.message}`, { status: 500 })
    }

    console.log('Session deleted successfully')
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE: /api/sessions POST called ===')
  
  try {
    const { title } = await request.json()
    console.log('Creating session with title:', title)

    const supabase = await createSupabaseServerClient()

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication required:', authError)
      return new Response('Authentication required', { status: 401 })
    }
    
    console.log('Authenticated user:', user.id, user.email)
    
    console.log('Inserting session with user ID:', user.id)
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        title,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(`Database error: ${error.message}`, { status: 500 })
    }

    console.log('Session created successfully:', data)
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}