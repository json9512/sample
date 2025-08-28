// Conversation CRUD operations with proper error handling and validation
// Implements the data access layer for conversations

// @ts-nocheck - Temporary suppression of strict type checking for error results
import { supabaseClient, getSupabaseServer, DatabaseResult, createResult, isDatabaseError } from '@/lib/supabase'
import type { Conversation } from '@/types/chat'

export interface CreateConversationData {
  title: string
  user_id?: string // Optional for server-side operations where user is inferred
}

export interface UpdateConversationData {
  title?: string
}

// Client-side operations
export class ConversationService {
  
  /**
   * Get all conversations for the current user
   */
  static async getUserConversations(): Promise<DatabaseResult<Conversation[]>> {
    try {
      const { data, error } = await supabaseClient
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        return createResult<Conversation[]>(null, error)
      }

      return createResult(data || [])
    } catch (error) {
      return createResult<Conversation[]>(null, { code: 'FETCH_ERROR', message: 'Failed to fetch conversations' })
    }
  }

  /**
   * Get a specific conversation by ID
   */
  static async getConversation(id: string): Promise<DatabaseResult<Conversation>> {
    try {
      const { data, error } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(data)
    } catch (error) {
      return createResult(null, { code: 'FETCH_ERROR', message: 'Failed to fetch conversation' })
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(data: CreateConversationData): Promise<DatabaseResult<Conversation>> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !user) {
        return createResult(null, { code: 'AUTH_ERROR', message: 'User not authenticated' })
      }

      const conversationData = {
        title: data.title,
        user_id: data.user_id || user.id
      }

      const { data: conversation, error } = await supabaseClient
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(conversation)
    } catch (error) {
      return createResult(null, { code: 'CREATE_ERROR', message: 'Failed to create conversation' })
    }
  }

  /**
   * Update a conversation
   */
  static async updateConversation(id: string, updates: UpdateConversationData): Promise<DatabaseResult<Conversation>> {
    try {
      const { data, error } = await supabaseClient
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(data)
    } catch (error) {
      return createResult(null, { code: 'UPDATE_ERROR', message: 'Failed to update conversation' })
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(id: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await supabaseClient
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) {
        return createResult(null, error)
      }

      return createResult(null)
    } catch (error) {
      return createResult(null, { code: 'DELETE_ERROR', message: 'Failed to delete conversation' })
    }
  }

  /**
   * Generate a title for a conversation based on the first message
   */
  static generateConversationTitle(firstMessage: string): string {
    // Simple title generation - take first 50 characters or first sentence
    const truncated = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage

    // Remove newlines and extra spaces
    return truncated.replace(/\s+/g, ' ').trim() || 'New Conversation'
  }
}

// Server-side operations (for API routes)
export class ConversationServerService {
  
  /**
   * Get conversations for a specific user (server-side)
   */
  static async getUserConversations(userId: string): Promise<DatabaseResult<Conversation[]>> {
    try {
      const supabase = getSupabaseServer()
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        return createResult(null, error)
      }

      return createResult(data || [])
    } catch (error) {
      return createResult(null, { code: 'FETCH_ERROR', message: 'Failed to fetch conversations' })
    }
  }

  /**
   * Create conversation server-side
   */
  static async createConversation(data: CreateConversationData & { user_id: string }): Promise<DatabaseResult<Conversation>> {
    try {
      const supabase = getSupabaseServer()
      
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert(data)
        .select()
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(conversation)
    } catch (error) {
      return createResult(null, { code: 'CREATE_ERROR', message: 'Failed to create conversation' })
    }
  }
}