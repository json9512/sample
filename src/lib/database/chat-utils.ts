// Utility functions for chat interface to handle DatabaseResult patterns
import { ConversationService } from './conversations'
import { MessageService } from './messages'
import type { Conversation, Message } from '@/types/chat'
import type { CreateMessageData } from './messages'

// Simple helper to check if result is an error
function isDatabaseError(result: any): boolean {
  return result && result.error
}

// Wrapper functions that throw on error for easier use in React components

export async function getConversations(_userId: string): Promise<Conversation[]> {
  const result = await ConversationService.getUserConversations()
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to fetch conversations')
  }
  return result.data || []
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const result = await MessageService.getConversationMessages(conversationId)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to fetch messages')
  }
  return result.data || []
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const result = await ConversationService.createConversation({ title, user_id: userId })
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to create conversation')
  }
  return result.data!
}

export async function deleteConversation(id: string): Promise<void> {
  const result = await ConversationService.deleteConversation(id)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to delete conversation')
  }
}

export async function addMessage(data: CreateMessageData): Promise<Message> {
  const result = await MessageService.createMessage(data)
  if (isDatabaseError(result)) {
    throw new Error(result.error?.message || 'Failed to add message')
  }
  return result.data!
}