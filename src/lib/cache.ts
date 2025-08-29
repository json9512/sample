import { LRUCache } from 'lru-cache'

// Types for cached data
interface CachedConversations {
  conversations: any[]
  timestamp: number
}

interface CachedMessages {
  messages: any[]
  timestamp: number
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100

// In-memory caches
const conversationsCache = new LRUCache<string, CachedConversations>({
  max: MAX_CACHE_SIZE,
  ttl: CACHE_TTL,
})

const messagesCache = new LRUCache<string, CachedMessages>({
  max: MAX_CACHE_SIZE,
  ttl: CACHE_TTL,
})

// Response caching utilities
export class CacheManager {
  static getCacheKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(':')}`
  }

  // Conversation caching
  static getCachedConversations(userId: string): any[] | null {
    const key = this.getCacheKey('conversations', userId)
    const cached = conversationsCache.get(key)
    return cached?.conversations || null
  }

  static setCachedConversations(userId: string, conversations: any[]): void {
    const key = this.getCacheKey('conversations', userId)
    conversationsCache.set(key, {
      conversations,
      timestamp: Date.now(),
    })
  }

  static invalidateConversationsCache(userId: string): void {
    const key = this.getCacheKey('conversations', userId)
    conversationsCache.delete(key)
  }

  // Message caching
  static getCachedMessages(conversationId: string, limit?: number, offset?: number): any[] | null {
    const key = this.getCacheKey('messages', conversationId, limit || 'all', offset || 0)
    const cached = messagesCache.get(key)
    return cached?.messages || null
  }

  static setCachedMessages(
    conversationId: string,
    messages: any[],
    limit?: number,
    offset?: number
  ): void {
    const key = this.getCacheKey('messages', conversationId, limit || 'all', offset || 0)
    messagesCache.set(key, {
      messages,
      timestamp: Date.now(),
    })
  }

  static invalidateMessagesCache(conversationId: string): void {
    // Clear all cached message variations for this conversation
    const pattern = `messages:${conversationId}:`
    const keysToDelete: string[] = []
    messagesCache.forEach((_value, key) => {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => messagesCache.delete(key))
  }

  static clearAllCaches(): void {
    conversationsCache.clear()
    messagesCache.clear()
  }

  // Cache statistics for debugging
  static getCacheStats() {
    return {
      conversations: {
        size: conversationsCache.size,
        calculatedSize: conversationsCache.calculatedSize,
      },
      messages: {
        size: messagesCache.size,
        calculatedSize: messagesCache.calculatedSize,
      },
    }
  }
}

// Browser storage utilities for persistence
export class StorageManager {
  static setItem(key: string, value: any): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify({
          data: value,
          timestamp: Date.now(),
        }))
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  static getItem(key: string, maxAge: number = CACHE_TTL): any | null {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          const age = Date.now() - parsed.timestamp
          if (age < maxAge) {
            return parsed.data
          }
          // Remove expired data
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
    }
    return null
  }

  static removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }

  static clear(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
}

// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

export function dedupRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  const promise = requestFn()
    .finally(() => {
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, promise)
  return promise
}