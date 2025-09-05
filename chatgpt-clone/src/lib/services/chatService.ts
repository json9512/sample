import { createSupabaseClient } from '@/lib/supabase/client'
import type { Message, ChatSession } from '@/types/chat'

export interface StreamingResponse {
  content: string
  isComplete: boolean
  error?: string
}

export class ChatService {
  private supabase = createSupabaseClient()

  async createSession(title: string): Promise<ChatSession | null> {
    console.log('ChatService.createSession called with title:', title)
    try {
      console.log('Getting user with timeout...')
      
      // Add timeout to auth call
      const getUserWithTimeout = () => {
        return Promise.race([
          this.supabase.auth.getUser(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 3000)
          )
        ])
      }

      let user = null
      try {
        const result = await getUserWithTimeout() as any
        user = result.data?.user
        console.log('Got user from auth:', user)
      } catch (authError) {
        console.log('Auth failed or timed out:', authError)
        // Continue without user
      }

      const userId = user?.id || crypto.randomUUID()
      console.log('Using user ID:', userId)
      
      console.log('Creating session via API route...')
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      })

      console.log('API response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const sessionData = await response.json()
      console.log('Session created via API:', sessionData)

      return sessionData ? {
        ...sessionData,
        created_at: new Date(sessionData.created_at),
        updated_at: new Date(sessionData.updated_at)
      } : null
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  async getSessions(): Promise<ChatSession[]> {
    try {
      console.log('Fetching sessions from database...')
      
      // Use API route to get sessions (which handles auth properly)
      const response = await fetch('/api/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('getSessions API response:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error in getSessions:', errorText)
        return []
      }

      const sessions = await response.json()
      console.log('Sessions loaded from API:', sessions)
      console.log('Sessions titles:', sessions.map((s: any) => `${s.id}: "${s.title}"`).join(', '))

      return sessions.map((session: any) => ({
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at)
      }))
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return []
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      return data ? {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      } : null
    } catch (error) {
      console.error('Error fetching session:', error)
      return null
    }
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      console.log('Fetching messages from database for session:', sessionId)
      
      // Use API route to get messages (which handles auth properly)
      const response = await fetch(`/api/messages/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('getMessages API response:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error in getMessages:', errorText)
        return []
      }

      const messages = await response.json()
      console.log('Messages loaded from API:', messages.length)

      return messages.map((message: any) => ({
        ...message,
        timestamp: new Date(message.created_at),
        user_id: message.user_id || 'anonymous'
      }))
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  async addMessage(sessionId: string, content: string, role: 'user' | 'assistant'): Promise<Message | null> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          content,
          role,
          session_id: sessionId
        })
        .select()
        .single()

      if (error) throw error

      // Update session's updated_at timestamp
      await this.supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)

      return data ? {
        ...data,
        timestamp: new Date(data.created_at),
        user_id: data.user_id || 'anonymous'
      } : null
    } catch (error) {
      console.error('Error adding message:', error)
      return null
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      console.log('Updating session title via API:', sessionId, title)
      
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, title })
      })

      console.log('updateSessionTitle API response:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error in updateSessionTitle:', errorText)
        return false
      }

      console.log('Session title updated successfully')
      return true
    } catch (error) {
      console.error('Error updating session title:', error)
      return false
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      console.log('Deleting session via API:', sessionId)
      
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      })

      console.log('deleteSession API response:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error in deleteSession:', errorText)
        return false
      }

      console.log('Session deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  async *streamMessage(sessionId: string, message: string): AsyncGenerator<StreamingResponse> {
    console.log('=== ChatService.streamMessage START ===')
    console.log('Parameters:', { sessionId, message })
    try {
      console.log('Making fetch request to /api/chat/stream')
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
        }),
      })

      console.log('Fetch completed, response status:', response.status)
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      console.log('Response OK, starting stream processing')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body reader available')
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as StreamingResponse
                yield data
                
                if (data.isComplete) {
                  return
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error streaming message:', error)
      yield {
        content: '',
        isComplete: true,
        error: 'Failed to stream message'
      }
    }
  }
}