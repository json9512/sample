// Core interface definitions following CLAUDE.md specifications

// User & Authentication
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

// Chat Management
export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata?: Record<string, any>
}

// Streaming API
export interface StreamingRequest {
  message: string
  conversation_id?: string
}

export interface StreamingChunk {
  type: 'token' | 'complete' | 'error'
  content: string
  message_id?: string
}