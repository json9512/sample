// Utility functions for chat interface to handle DatabaseResult patterns
import { ConversationService } from './conversations'
import { MessageService } from './messages'
import { CacheManager, dedupRequest } from '@/lib/cache'
import type { Conversation, Message } from '@/types/chat'
import type { CreateMessageData } from './messages'

// Simple helper to check if result is an error
function isDatabaseError(result: any): boolean {
  return result && result.error
}

// Wrapper functions that throw on error for easier use in React components

export async function getConversations(userId: string): Promise<Conversation[]> {
  // Check cache first
  const cached = CacheManager.getCachedConversations(userId)
  if (cached) {
    return cached
  }

  // Deduplicate requests
  return dedupRequest(`conversations:${userId}`, async () => {
    const result = await ConversationService.getUserConversations()
    if (isDatabaseError(result)) {
      throw new Error(result.error?.message || 'Failed to fetch conversations')
    }
    
    const conversations = result.data || []
    CacheManager.setCachedConversations(userId, conversations)
    return conversations
  })
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const result = await MessageService.getConversationMessages(conversationId)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to fetch messages')
  }
  return result.data || []
}

export async function getConversationMessagesPaginated(
  conversationId: string, 
  options?: { limit?: number; offset?: number; orderBy?: 'created_at' | 'id'; ascending?: boolean }
): Promise<Message[]> {
  const { limit, offset } = options || {}
  
  // Check cache first
  const cached = CacheManager.getCachedMessages(conversationId, limit, offset)
  if (cached) {
    return cached
  }

  // Deduplicate requests
  return dedupRequest(`messages:${conversationId}:${limit}:${offset}`, async () => {
    const result = await MessageService.getConversationMessages(conversationId, options)
    if (isDatabaseError(result)) {
      throw new Error(result.error?.message || 'Failed to fetch messages')
    }
    
    const messages = result.data || []
    CacheManager.setCachedMessages(conversationId, messages, limit, offset)
    return messages
  })
}

export async function getMessageCount(conversationId: string): Promise<number> {
  const result = await MessageService.getMessageCount(conversationId)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to count messages')
  }
  return result.data || 0
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const result = await ConversationService.createConversation({ title, user_id: userId })
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to create conversation')
  }
  
  // Invalidate conversations cache
  CacheManager.invalidateConversationsCache(userId)
  return result.data!
}

export async function deleteConversation(id: string): Promise<void> {
  const result = await ConversationService.deleteConversation(id)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to delete conversation')
  }
  
  // Invalidate related caches
  CacheManager.invalidateMessagesCache(id)
  // Note: We can't easily invalidate conversations cache without userId
}

export async function addMessage(data: CreateMessageData): Promise<Message> {
  const result = await MessageService.createMessage(data)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to add message')
  }
  
  // Invalidate messages cache for this conversation
  CacheManager.invalidateMessagesCache(data.conversation_id)
  return result.data!
}