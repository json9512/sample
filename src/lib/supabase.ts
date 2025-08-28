// Enhanced Supabase client with typed database interface
// Provides type-safe database operations

import { createClient } from '@/utils/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'
import type { User, Conversation, Message } from '@/types/chat'

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
    }
  }
}

// Client-side Supabase client
export const supabaseClient = createClient()

// Server-side Supabase client factory
export const getSupabaseServer = () => createServerClient()

// Error handling utility
export interface DatabaseError {
  code: string
  message: string
  details?: any
}

export function isDatabaseError(error: any): error is DatabaseError {
  return error && typeof error.code === 'string' && typeof error.message === 'string'
}

// Result wrapper for database operations
export type DatabaseResult<T> = {
  data: T | null
  error: DatabaseError | null
}

export function createResult<T>(data: T | null, error: any = null): DatabaseResult<T> {
  return {
    data,
    error: isDatabaseError(error) ? error : null
  }
}

// Helper functions for creating typed results
export function createErrorResult<T>(error: DatabaseError): DatabaseResult<T> {
  return createResult<T>(null, error)
}

export function createSuccessResult<T>(data: T): DatabaseResult<T> {
  return createResult<T>(data)
}