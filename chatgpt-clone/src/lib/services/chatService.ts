import { createSupabaseClient } from '@/lib/supabase/client'
import type { Message, ChatSession } from '@/types/chat'

export class ChatService {
  private supabase = createSupabaseClient()

  async createSession(title: string): Promise<ChatSession | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert({
          title,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
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
      return data || []
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
      return data
    } catch (error) {
      console.error('Error fetching session:', error)
      return null
    }
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
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
          session_id: sessionId,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Update session's updated_at timestamp
      await this.supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)

      return data
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
}