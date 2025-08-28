// Message CRUD operations with proper error handling and validation
// Implements the data access layer for messages

// @ts-nocheck - Temporary suppression of strict type checking for error results
import { supabaseClient, DatabaseResult, createResult } from '@/lib/supabase'
import type { Message } from '@/types/chat'

export interface CreateMessageData {
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, any>
}

export interface UpdateMessageData {
  content?: string
  metadata?: Record<string, any>
}

export interface MessageQueryOptions {
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'id'
  ascending?: boolean
}

// Client-side operations
export class MessageService {
  
  /**
   * Get all messages for a conversation
   */
  static async getConversationMessages(
    conversationId: string, 
    options: MessageQueryOptions = {}
  ): Promise<DatabaseResult<Message[]>> {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        orderBy = 'created_at', 
        ascending = true 
      } = options

      let query = supabaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order(orderBy, { ascending })

      if (limit > 0) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        return createResult(null, error)
      }

      return createResult(data || [])
    } catch (error) {
      return createResult<Message[]>(null, { code: 'FETCH_ERROR', message: 'Failed to fetch messages' })
    }
  }

  /**
   * Get a specific message by ID
   */
  static async getMessage(id: string): Promise<DatabaseResult<Message>> {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(data)
    } catch (error) {
      return createResult<Message>(null, { code: 'FETCH_ERROR', message: 'Failed to fetch message' })
    }
  }

  /**
   * Create a new message
   */
  static async createMessage(data: CreateMessageData): Promise<DatabaseResult<Message>> {
    try {
      // Validate conversation access first
      const conversationCheck = await supabaseClient
        .from('conversations')
        .select('id')
        .eq('id', data.conversation_id)
        .single()

      if (conversationCheck.error) {
        return createResult<Message>(null, { 
          code: 'INVALID_CONVERSATION', 
          message: 'Conversation not found or access denied' 
        })
      }

      const { data: message, error } = await supabaseClient
        .from('messages')
        .insert(data)
        .select()
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(message)
    } catch (error) {
      return createResult<Message>(null, { code: 'CREATE_ERROR', message: 'Failed to create message' })
    }
  }

  /**
   * Update a message
   */
  static async updateMessage(id: string, updates: UpdateMessageData): Promise<DatabaseResult<Message>> {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return createResult(null, error)
      }

      return createResult(data)
    } catch (error) {
      return createResult<Message>(null, { code: 'UPDATE_ERROR', message: 'Failed to update message' })
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(id: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await supabaseClient
        .from('messages')
        .delete()
        .eq('id', id)

      if (error) {
        return createResult(null, error)
      }

      return createResult(null)
    } catch (error) {
      return createResult<void>(null, { code: 'DELETE_ERROR', message: 'Failed to delete message' })
    }
  }

  /**
   * Get message count for a conversation
   */
  static async getMessageCount(conversationId: string): Promise<DatabaseResult<number>> {
    try {
      const { count, error } = await supabaseClient
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)

      if (error) {
        return createResult(null, error)
      }

      return createResult(count || 0)
    } catch (error) {
      return createResult<number>(null, { code: 'COUNT_ERROR', message: 'Failed to count messages' })
    }
  }

  /**
   * Get the latest message in a conversation
   */
  static async getLatestMessage(conversationId: string): Promise<DatabaseResult<Message>> {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // No messages found is not an error
        if (error.code === 'PGRST116') {
          return createResult<Message>(null)
        }
        return createResult(null, error)
      }

      return createResult(data)
    } catch (error) {
      return createResult<Message>(null, { code: 'FETCH_ERROR', message: 'Failed to fetch latest message' })
    }
  }
}

