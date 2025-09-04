import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { claudeClient } from '@/lib/claude/client'

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json()

    if (!message || !sessionId) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Verify authentication using server-side client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Temporary bypass for testing - remove in production
    console.log('Bypassing auth for testing')
    const user = { id: 'test-user', email: 'test@example.com' }
    
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return new Response('Unauthorized', { status: 401 })
    // }

    // Temporary: skip database operations for testing
    console.log('Skipping database operations for testing')
    const conversationHistory = [{ role: 'user' as const, content: message }]

    // Create Server-Sent Events stream
    const encoder = new TextEncoder()
    let assistantMessage = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream response from Claude
          for await (const chunk of claudeClient.streamMessage(conversationHistory)) {
            if (!chunk.isComplete) {
              assistantMessage += chunk.content
              
              const data = JSON.stringify({ 
                content: chunk.content,
                isComplete: false 
              })
              
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } else {
              // Temporary: skip database save for testing
              console.log('Would save assistant message:', assistantMessage)

              const data = JSON.stringify({ 
                content: '',
                isComplete: true 
              })
              
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              controller.close()
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({ 
            error: 'Failed to generate response',
            isComplete: true 
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}