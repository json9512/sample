export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          provider: string | null
          provider_id: string | null
          created_at: string
          updated_at: string
          last_login: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          provider?: string | null
          provider_id?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          provider?: string | null
          provider_id?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
          is_archived: boolean
          message_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          message_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          message_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
          updated_at: string
          token_count: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
          updated_at?: string
          token_count?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
          updated_at?: string
          token_count?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}