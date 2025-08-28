// Real-time subscription management for messages and conversations
// Handles Supabase real-time subscriptions with proper cleanup

import { supabaseClient } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Message, Conversation } from '@/types/chat'

// Subscription event types
export type MessageSubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE'
export type ConversationSubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface MessageSubscriptionPayload {
  eventType: MessageSubscriptionEvent
  new: Message | null
  old: Message | null
}

export interface ConversationSubscriptionPayload {
  eventType: ConversationSubscriptionEvent
  new: Conversation | null
  old: Conversation | null
}

// Message subscription callbacks
export type MessageSubscriptionCallback = (payload: MessageSubscriptionPayload) => void
export type ConversationSubscriptionCallback = (payload: ConversationSubscriptionPayload) => void

// Subscription manager class
export class SubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private messageCallbacks: Map<string, MessageSubscriptionCallback[]> = new Map()
  private conversationCallbacks: Map<string, ConversationSubscriptionCallback[]> = new Map()

  /**
   * Subscribe to messages in a specific conversation
   */
  subscribeToConversationMessages(
    conversationId: string, 
    callback: MessageSubscriptionCallback
  ): () => void {
    const channelName = `messages:${conversationId}`
    
    // Add callback to the list
    const callbacks = this.messageCallbacks.get(channelName) || []
    callbacks.push(callback)
    this.messageCallbacks.set(channelName, callbacks)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = supabaseClient
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload: RealtimePostgresChangesPayload<Message>) => {
            const messagePayload: MessageSubscriptionPayload = {
              eventType: payload.eventType as MessageSubscriptionEvent,
              new: payload.new as Message | null,
              old: payload.old as Message | null
            }

            // Call all registered callbacks
            const currentCallbacks = this.messageCallbacks.get(channelName) || []
            currentCallbacks.forEach(cb => {
              try {
                cb(messagePayload)
              } catch (error) {
                console.error('Error in message subscription callback:', error)
              }
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to messages for conversation ${conversationId}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to messages for conversation ${conversationId}`)
          }
        })

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      const currentCallbacks = this.messageCallbacks.get(channelName) || []
      const updatedCallbacks = currentCallbacks.filter(cb => cb !== callback)
      
      if (updatedCallbacks.length === 0) {
        // No more callbacks, remove channel
        const channel = this.channels.get(channelName)
        if (channel) {
          supabaseClient.removeChannel(channel)
          this.channels.delete(channelName)
        }
        this.messageCallbacks.delete(channelName)
      } else {
        this.messageCallbacks.set(channelName, updatedCallbacks)
      }
    }
  }

  /**
   * Subscribe to all conversations for the current user
   */
  subscribeToUserConversations(callback: ConversationSubscriptionCallback): () => void {
    const channelName = 'user-conversations'
    
    // Add callback to the list
    const callbacks = this.conversationCallbacks.get(channelName) || []
    callbacks.push(callback)
    this.conversationCallbacks.set(channelName, callbacks)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = supabaseClient
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          (payload: RealtimePostgresChangesPayload<Conversation>) => {
            const conversationPayload: ConversationSubscriptionPayload = {
              eventType: payload.eventType as ConversationSubscriptionEvent,
              new: payload.new as Conversation | null,
              old: payload.old as Conversation | null
            }

            // Call all registered callbacks
            const currentCallbacks = this.conversationCallbacks.get(channelName) || []
            currentCallbacks.forEach(cb => {
              try {
                cb(conversationPayload)
              } catch (error) {
                console.error('Error in conversation subscription callback:', error)
              }
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to user conversations')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to user conversations')
          }
        })

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      const currentCallbacks = this.conversationCallbacks.get(channelName) || []
      const updatedCallbacks = currentCallbacks.filter(cb => cb !== callback)
      
      if (updatedCallbacks.length === 0) {
        // No more callbacks, remove channel
        const channel = this.channels.get(channelName)
        if (channel) {
          supabaseClient.removeChannel(channel)
          this.channels.delete(channelName)
        }
        this.conversationCallbacks.delete(channelName)
      } else {
        this.conversationCallbacks.set(channelName, updatedCallbacks)
      }
    }
  }

  /**
   * Unsubscribe from all channels and clean up
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabaseClient.removeChannel(channel)
    })
    
    this.channels.clear()
    this.messageCallbacks.clear()
    this.conversationCallbacks.clear()
    
    console.log('All subscriptions cleaned up')
  }

  /**
   * Get connection status
   */
  getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName)
    return channel ? channel.state : null
  }

  /**
   * Get all active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

// Global subscription manager instance
export const subscriptionManager = new SubscriptionManager()

// Hook for cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptionManager.unsubscribeAll()
  })
}

// React Hook for message subscriptions
export function useMessageSubscription(
  conversationId: string | null,
  callback: MessageSubscriptionCallback
): () => void {
  if (typeof window === 'undefined' || !conversationId) return () => {}

  const unsubscribe = subscriptionManager.subscribeToConversationMessages(
    conversationId,
    callback
  )

  // Clean up on unmount (this would be handled by React useEffect)
  return unsubscribe
}

// React Hook for conversation subscriptions  
export function useConversationSubscription(
  callback: ConversationSubscriptionCallback
): () => void {
  if (typeof window === 'undefined') return () => {}

  const unsubscribe = subscriptionManager.subscribeToUserConversations(callback)

  // Clean up on unmount (this would be handled by React useEffect)
  return unsubscribe
}