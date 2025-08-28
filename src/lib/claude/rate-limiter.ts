// Rate limiting implementation using token bucket algorithm
// Provides per-user rate limiting and request throttling

export class TokenBucket {
  private tokens: number
  private lastRefill: number

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    const tokensToAdd = timePassed * this.refillRate
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  async waitForToken(tokensNeeded: number = 1): Promise<void> {
    this.refill()

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded
      return
    }

    const waitTime = (tokensNeeded - this.tokens) / this.refillRate * 1000
    await new Promise(resolve => setTimeout(resolve, Math.max(waitTime, 0)))
    
    // Refill again after waiting
    this.refill()
    this.tokens = Math.max(0, this.tokens - tokensNeeded)
  }

  canConsume(tokensNeeded: number = 1): boolean {
    this.refill()
    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded
      return true
    }
    return false
  }

  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }

  getTimeUntilRefill(tokensNeeded: number = 1): number {
    this.refill()
    if (this.tokens >= tokensNeeded) return 0
    
    return (tokensNeeded - this.tokens) / this.refillRate * 1000
  }
}

// Per-user rate limiting
class RateLimiterManager {
  private userLimiters = new Map<string, TokenBucket>()
  private globalLimiter: TokenBucket
  
  // Cleanup old limiters every hour
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Global rate limit: 100 requests per minute
    this.globalLimiter = new TokenBucket(100, 100/60)
    
    // Cleanup unused user limiters every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const entries = Array.from(this.userLimiters.entries())
    for (const [userId, limiter] of entries) {
      // Remove limiters that haven't been used in the last hour
      if ((limiter as any).lastRefill < oneHourAgo) {
        this.userLimiters.delete(userId)
      }
    }
  }

  getUserLimiter(userId: string): TokenBucket {
    if (!this.userLimiters.has(userId)) {
      // Per user: 30 requests per minute (0.5 requests per second)
      this.userLimiters.set(userId, new TokenBucket(30, 0.5))
    }
    return this.userLimiters.get(userId)!
  }

  async checkRateLimit(userId: string): Promise<{
    allowed: boolean
    waitTime?: number
    retryAfter?: string
  }> {
    try {
      // Check global rate limit first
      if (!this.globalLimiter.canConsume()) {
        const waitTime = this.globalLimiter.getTimeUntilRefill()
        return {
          allowed: false,
          waitTime,
          retryAfter: new Date(Date.now() + waitTime).toISOString()
        }
      }

      // Check user-specific rate limit
      const userLimiter = this.getUserLimiter(userId)
      if (!userLimiter.canConsume()) {
        const waitTime = userLimiter.getTimeUntilRefill()
        return {
          allowed: false,
          waitTime,
          retryAfter: new Date(Date.now() + waitTime).toISOString()
        }
      }

      // Both checks passed, consume tokens
      await this.globalLimiter.waitForToken()
      await userLimiter.waitForToken()

      return { allowed: true }
    } catch (error) {
      console.error('Rate limiting error:', error)
      return { allowed: false }
    }
  }

  getRateLimitStatus(userId: string): {
    userTokens: number
    globalTokens: number
    userRefillRate: number
    globalRefillRate: number
  } {
    const userLimiter = this.getUserLimiter(userId)
    
    return {
      userTokens: userLimiter.getAvailableTokens(),
      globalTokens: this.globalLimiter.getAvailableTokens(),
      userRefillRate: 0.5, // tokens per second
      globalRefillRate: 100/60, // tokens per second
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiterManager()

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => rateLimiter.destroy())
  process.on('SIGTERM', () => rateLimiter.destroy())
}