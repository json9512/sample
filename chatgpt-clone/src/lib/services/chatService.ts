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
      console.log('Getting current session...')
      // Try getting session instead of user
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      console.log('Session:', session, 'Error:', sessionError)
      
      if (sessionError || !session?.user) {
        throw new Error('User not authenticated - no valid session')
      }
      
      const user = session.user
      console.log('Current user from session:', user.id)

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert({
          title,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Database error creating session:', error)
        throw error
      }
      console.log('Session created successfully:', data)
      return data ? {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      } : null
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  async getSessions(): Promise<ChatSession[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return (data || []).map(session => ({
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
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []).map(message => ({
        ...message,
        timestamp: new Date(message.created_at),
        user_id: user.id
      }))
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  async addMessage(sessionId: string, content: string, role: 'user' | 'assistant'): Promise<Message | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

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
        user_id: user.id
      } : null
    } catch (error) {
      console.error('Error adding message:', error)
      return null
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId)

      return !error
    } catch (error) {
      console.error('Error updating session title:', error)
      return false
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)

      return !error
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  async *streamMessage(sessionId: string, message: string): AsyncGenerator<StreamingResponse> {
    console.log('ChatService.streamMessage called:', { sessionId, message })
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

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