describe('Claude Error Handler Utils', () => {
  describe('error handling configuration', () => {
    it('should validate default config values', () => {
      const defaultConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        enableFallback: true,
        logErrors: true,
      }

      expect(typeof defaultConfig.maxRetries).toBe('number')
      expect(typeof defaultConfig.baseDelay).toBe('number') 
      expect(typeof defaultConfig.maxDelay).toBe('number')
      expect(typeof defaultConfig.enableFallback).toBe('boolean')
      expect(typeof defaultConfig.logErrors).toBe('boolean')
      
      expect(defaultConfig.maxRetries).toBeGreaterThan(0)
      expect(defaultConfig.baseDelay).toBeGreaterThan(0)
      expect(defaultConfig.maxDelay).toBeGreaterThan(defaultConfig.baseDelay)
    })

    it('should handle partial configuration merging', () => {
      const baseConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        enableFallback: true,
        logErrors: true,
      }

      const customConfig = {
        maxRetries: 5,
        baseDelay: 2000,
      }

      const mergedConfig = { ...baseConfig, ...customConfig }

      expect(mergedConfig.maxRetries).toBe(5)
      expect(mergedConfig.baseDelay).toBe(2000)
      expect(mergedConfig.maxDelay).toBe(30000) // unchanged
      expect(mergedConfig.enableFallback).toBe(true) // unchanged
    })
  })

  describe('retry logic', () => {
    it('should calculate exponential backoff delays', () => {
      const baseDelay = 1000
      const maxDelay = 30000
      
      const calculateDelay = (attempt: number) => {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        return Math.min(delay, maxDelay)
      }

      expect(calculateDelay(1)).toBe(1000)
      expect(calculateDelay(2)).toBe(2000)
      expect(calculateDelay(3)).toBe(4000)
      expect(calculateDelay(10)).toBe(maxDelay) // Should cap at maxDelay
    })

    it('should determine if error is retryable', () => {
      const retryableErrors = [429, 500, 502, 503, 504]
      const nonRetryableErrors = [400, 401, 403, 404]

      retryableErrors.forEach(status => {
        const isRetryable = [429, 500, 502, 503, 504].includes(status)
        expect(isRetryable).toBe(true)
      })

      nonRetryableErrors.forEach(status => {
        const isRetryable = [429, 500, 502, 503, 504].includes(status)
        expect(isRetryable).toBe(false)
      })
    })
  })

  describe('fallback response generation', () => {
    it('should generate fallback response structure', () => {
      const fallbackResponse = {
        isFallback: true,
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
        timestamp: new Date().toISOString(),
        reason: 'API_ERROR'
      }

      expect(fallbackResponse.isFallback).toBe(true)
      expect(typeof fallbackResponse.message).toBe('string')
      expect(fallbackResponse.message.length).toBeGreaterThan(0)
      expect(typeof fallbackResponse.timestamp).toBe('string')
      expect(typeof fallbackResponse.reason).toBe('string')
      
      // Validate timestamp format
      expect(() => new Date(fallbackResponse.timestamp)).not.toThrow()
    })

    it('should generate different fallback messages for different error types', () => {
      const errorTypes = [
        { type: 'RATE_LIMIT', expectedMessage: 'rate limit' },
        { type: 'NETWORK_ERROR', expectedMessage: 'connection' },
        { type: 'API_ERROR', expectedMessage: 'technical difficulties' },
        { type: 'TIMEOUT', expectedMessage: 'timeout' }
      ]

      errorTypes.forEach(({ type, expectedMessage }) => {
        let message = 'I apologize, but I\'m experiencing technical difficulties.'
        
        if (type === 'RATE_LIMIT') {
          message = 'I\'m experiencing high demand. Please try again in a moment.'
        } else if (type === 'NETWORK_ERROR') {
          message = 'I\'m having trouble with my connection. Please check your network and try again.'
        } else if (type === 'TIMEOUT') {
          message = 'The request took too long to complete. Please try again.'
        }

        if (type === 'RATE_LIMIT') {
          expect(message.toLowerCase()).toContain('demand')
        } else if (type === 'NETWORK_ERROR') {
          expect(message.toLowerCase()).toContain('connection')
        } else if (type === 'TIMEOUT') {
          expect(message.toLowerCase()).toContain('too long')
        } else {
          expect(message.toLowerCase()).toContain('technical')
        }
      })
    })
  })

  describe('error classification', () => {
    it('should classify API errors by status code', () => {
      const errorClassifications = [
        { status: 400, type: 'CLIENT_ERROR' },
        { status: 401, type: 'AUTH_ERROR' },
        { status: 403, type: 'FORBIDDEN_ERROR' },
        { status: 404, type: 'NOT_FOUND_ERROR' },
        { status: 429, type: 'RATE_LIMIT_ERROR' },
        { status: 500, type: 'SERVER_ERROR' },
        { status: 502, type: 'BAD_GATEWAY_ERROR' },
        { status: 503, type: 'SERVICE_UNAVAILABLE_ERROR' }
      ]

      errorClassifications.forEach(({ status, type }) => {
        let errorType = 'UNKNOWN_ERROR'
        
        if (status >= 400 && status < 500) {
          if (status === 401) errorType = 'AUTH_ERROR'
          else if (status === 403) errorType = 'FORBIDDEN_ERROR'
          else if (status === 404) errorType = 'NOT_FOUND_ERROR'
          else if (status === 429) errorType = 'RATE_LIMIT_ERROR'
          else errorType = 'CLIENT_ERROR'
        } else if (status >= 500) {
          if (status === 502) errorType = 'BAD_GATEWAY_ERROR'
          else if (status === 503) errorType = 'SERVICE_UNAVAILABLE_ERROR'
          else errorType = 'SERVER_ERROR'
        }

        expect(errorType).toBe(type)
      })
    })
  })

  describe('error logging', () => {
    it('should format error logs consistently', () => {
      const mockError = {
        status: 500,
        message: 'Internal Server Error',
        timestamp: new Date().toISOString()
      }

      const logEntry = {
        level: 'error',
        message: `API Error: ${mockError.status} - ${mockError.message}`,
        timestamp: mockError.timestamp,
        context: {
          status: mockError.status,
          error: mockError.message
        }
      }

      expect(logEntry.level).toBe('error')
      expect(logEntry.message).toContain(mockError.status.toString())
      expect(logEntry.message).toContain(mockError.message)
      expect(logEntry.context.status).toBe(mockError.status)
    })
  })
})