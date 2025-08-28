// Unit tests for rate limiting functionality
// Tests token bucket algorithm and per-user rate limiting

import { TokenBucket, rateLimiter } from '@/lib/claude/rate-limiter'

describe('TokenBucket', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('should initialize with correct token count', () => {
    const bucket = new TokenBucket(10, 1)
    expect(bucket.getAvailableTokens()).toBe(10)
  })

  it('should allow token consumption when tokens available', () => {
    const bucket = new TokenBucket(10, 1)
    expect(bucket.canConsume(5)).toBe(true)
    expect(bucket.getAvailableTokens()).toBe(5) // Should have 5 tokens left after consuming 5
  })

  it('should reject consumption when insufficient tokens', () => {
    const bucket = new TokenBucket(5, 1)
    expect(bucket.canConsume(10)).toBe(false)
    expect(bucket.getAvailableTokens()).toBe(5) // Should remain unchanged
  })

  it('should refill tokens over time', () => {
    // Mock Date.now to control time
    const mockNow = jest.spyOn(Date, 'now')
    mockNow.mockReturnValue(0)
    
    const bucket = new TokenBucket(10, 2) // 2 tokens per second
    
    // Consume all tokens
    expect(bucket.canConsume(10)).toBe(true)
    expect(bucket.getAvailableTokens()).toBe(0)
    
    // Advance time by 0.5 seconds
    mockNow.mockReturnValue(500)
    
    // Should have refilled 1 token (2 tokens/sec * 0.5 sec)
    expect(bucket.getAvailableTokens()).toBe(1)
    
    mockNow.mockRestore()
  })

  it('should not exceed maximum tokens when refilling', () => {
    const mockNow = jest.spyOn(Date, 'now')
    mockNow.mockReturnValue(0)
    
    const bucket = new TokenBucket(10, 5) // 5 tokens per second, max 10
    
    // Advance time by 5 seconds (would refill 25 tokens)
    mockNow.mockReturnValue(5000)
    
    // Should cap at maximum tokens
    expect(bucket.getAvailableTokens()).toBe(10)
    
    mockNow.mockRestore()
  })

  it('should wait for tokens when none available', async () => {
    const bucket = new TokenBucket(1, 10) // 10 tokens per second (faster for testing)
    
    // Consume the only token
    bucket.canConsume(1)
    
    const startTime = Date.now()
    await bucket.waitForToken()
    const endTime = Date.now()
    
    // Should have waited approximately 100ms (1 token / 10 tokens per second = 0.1s)
    expect(endTime - startTime).toBeGreaterThanOrEqual(90) // Allow for some variation
  })

  it('should calculate time until refill correctly', () => {
    const mockNow = jest.spyOn(Date, 'now')
    mockNow.mockReturnValue(0)
    
    const bucket = new TokenBucket(10, 2) // 2 tokens per second
    
    // Consume all tokens
    bucket.canConsume(10)
    
    // Need 1 token, refill rate is 2/second = 500ms per token
    expect(bucket.getTimeUntilRefill(1)).toBe(500)
    expect(bucket.getTimeUntilRefill(2)).toBe(1000)
    
    mockNow.mockRestore()
  })
})

describe('RateLimiterManager', () => {
  beforeEach(() => {
    // Reset the rate limiter state
    rateLimiter['userLimiters'].clear()
    rateLimiter['globalLimiter'] = rateLimiter['globalLimiter'] || new TokenBucket(100, 100/60)
  })

  describe('User Rate Limiting', () => {
    it('should create separate limiters for different users', () => {
      const limiter1 = rateLimiter.getUserLimiter('user1')
      const limiter2 = rateLimiter.getUserLimiter('user2')
      
      expect(limiter1).not.toBe(limiter2)
      expect(rateLimiter['userLimiters'].size).toBe(2)
    })

    it('should reuse existing limiters for same user', () => {
      const limiter1 = rateLimiter.getUserLimiter('user1')
      const limiter2 = rateLimiter.getUserLimiter('user1')
      
      expect(limiter1).toBe(limiter2)
      expect(rateLimiter['userLimiters'].size).toBe(1)
    })

    it('should allow requests within rate limits', async () => {
      const result = await rateLimiter.checkRateLimit('user1')
      
      expect(result.allowed).toBe(true)
      expect(result.waitTime).toBeUndefined()
      expect(result.retryAfter).toBeUndefined()
    })

    it('should reject requests exceeding user rate limit', async () => {
      const userId = 'user1'
      const userLimiter = rateLimiter.getUserLimiter(userId)
      
      // Consume all user tokens
      for (let i = 0; i < 30; i++) {
        userLimiter.canConsume(1)
      }
      
      const result = await rateLimiter.checkRateLimit(userId)
      
      expect(result.allowed).toBe(false)
      expect(result.waitTime).toBeGreaterThan(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should reject requests exceeding global rate limit', async () => {
      const globalLimiter = rateLimiter['globalLimiter']
      
      // Consume all global tokens
      for (let i = 0; i < 100; i++) {
        globalLimiter.canConsume(1)
      }
      
      const result = await rateLimiter.checkRateLimit('user1')
      
      expect(result.allowed).toBe(false)
      expect(result.waitTime).toBeGreaterThan(0)
    })
  })

  describe('Rate Limit Status', () => {
    it('should return correct rate limit status', () => {
      const status = rateLimiter.getRateLimitStatus('user1')
      
      expect(status).toHaveProperty('userTokens')
      expect(status).toHaveProperty('globalTokens')
      expect(status).toHaveProperty('userRefillRate')
      expect(status).toHaveProperty('globalRefillRate')
      expect(status.userRefillRate).toBe(0.5)
      expect(status.globalRefillRate).toBe(100/60)
    })

    it('should reflect token consumption in status', async () => {
      const userId = 'test-user-for-consumption'
      
      // Get a fresh user limiter
      const userLimiter = rateLimiter.getUserLimiter(userId)
      expect(userLimiter.getAvailableTokens()).toBe(30)
      
      // Directly consume tokens from the limiter
      userLimiter.canConsume(5)
      
      const status = rateLimiter.getRateLimitStatus(userId)
      
      // Should show consumed tokens
      expect(status.userTokens).toBe(25) // 30 - 5 = 25
    })
  })

  describe('Cleanup', () => {
    it('should clean up old user limiters', () => {
      // Add some user limiters
      rateLimiter.getUserLimiter('user1')
      rateLimiter.getUserLimiter('user2')
      
      expect(rateLimiter['userLimiters'].size).toBe(2)
      
      // Mock old last refill time
      const oldTime = Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      rateLimiter['userLimiters'].forEach(limiter => {
        (limiter as any).lastRefill = oldTime
      })
      
      // Trigger cleanup
      rateLimiter['cleanup']()
      
      expect(rateLimiter['userLimiters'].size).toBe(0)
    })

    it('should not clean up recently used limiters', () => {
      rateLimiter.getUserLimiter('user1')
      rateLimiter.getUserLimiter('user2')
      
      // Cleanup should not remove recently used limiters
      rateLimiter['cleanup']()
      
      expect(rateLimiter['userLimiters'].size).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock an error in token consumption
      const userLimiter = rateLimiter.getUserLimiter('user1')
      jest.spyOn(userLimiter, 'canConsume').mockImplementation(() => {
        throw new Error('Token error')
      })
      
      const result = await rateLimiter.checkRateLimit('user1')
      
      expect(result.allowed).toBe(false)
    })
  })
})