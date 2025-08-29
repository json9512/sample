// Database layer exports
// Centralized exports for all database functionality

// Core functionality
export { supabaseClient, isDatabaseError, createResult } from '../supabase'
export type { Database, DatabaseError, DatabaseResult } from '../supabase'

// Conversations
export { ConversationService } from './conversations'
export type { CreateConversationData, UpdateConversationData } from './conversations'

// Messages
export { MessageService } from './messages'
export type { CreateMessageData, UpdateMessageData, MessageQueryOptions } from './messages'

// Real-time subscriptions
export { 
  SubscriptionManager, 
  subscriptionManager, 
  useMessageSubscription, 
  useConversationSubscription 
} from './subscriptions'
export type { 
  MessageSubscriptionEvent,
  ConversationSubscriptionEvent,
  MessageSubscriptionPayload,
  ConversationSubscriptionPayload,
  MessageSubscriptionCallback,
  ConversationSubscriptionCallback
} from './subscriptions'

// Validation
export { 
  ConversationValidator, 
  MessageValidator, 
  ValidationError,
  isValidUUID,
  validateId,
  validatePagination
} from './validation'
export type { ValidationResult, PaginationOptions } from './validation'

// Migrations and utilities
export { runMigrations, seedTestData } from './migrations'