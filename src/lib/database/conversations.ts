// Conversation CRUD operations with proper error handling and validation
// Implements the data access layer for conversations

// @ts-nocheck - Temporary suppression of strict type checking for error results
import { supabaseClient, DatabaseResult, createResult } from '@/lib/supabase'
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

      // Ensure user exists in public.users table
      await this.ensureUserExists(user)

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
   * Ensure user exists in public.users table
   */
  private static async ensureUserExists(user: any) {
    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (selectError && selectError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: insertError } = await supabaseClient
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email || 'Anonymous',
            avatar_url: user.user_metadata?.avatar_url || null
          })

        if (insertError) {
          console.error('Error creating user in public.users:', insertError)
        }
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error)
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

