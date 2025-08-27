// Authentication related types
import type { User } from './chat'

export interface AuthState {
  user: User | null
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthError {
  code: string
  message: string
}

// Re-export User from chat types for consistency
export type { User } from './chat'