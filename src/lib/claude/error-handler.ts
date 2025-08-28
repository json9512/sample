// Comprehensive error handling and fallback mechanisms
// Provides graceful degradation and recovery strategies

import type { ApiError } from '@/types/claude'

export interface ErrorHandlingConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  enableFallback: boolean
  logErrors: boolean
}

export interface FallbackResponse {
  isFallback: true
  message: string
  timestamp: string
  reason: string
}

export class ErrorHandler {
  private config: ErrorHandlingConfig

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      enableFallback: true,
      logErrors: true,
      ...config
    }
  }

  /**
   * Handle API errors with retry logic
   */
  async handleApiError<T>(
    error: ApiError,
    retryFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T | FallbackResponse> {
    if (this.config.logErrors) {
      this.logError(error, attempt)
    }

    // Determine if error is retryable
    if (!this.isRetryableError(error) || attempt >= this.config.maxRetries) {
      return this.createFallbackResponse(error, attempt)
    }

    // Calculate delay with exponential backoff
    const delay = this.calculateDelay(attempt, error.retryAfter)
    
    if (this.config.logErrors) {
      console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`)
    }

    await this.delay(delay)
    
    try {
      return await retryFn()
    } catch (retryError) {
      const mappedError = this.mapError(retryError)
      return this.handleApiError(mappedError, retryFn, attempt + 1)
    }
  }

  /**
   * Create a fallback response when all retries fail
   */
  private createFallbackResponse(error: ApiError, finalAttempt: number): FallbackResponse {
    if (!this.config.enableFallback) {
      throw error
    }

    const fallbackMessage = this.getFallbackMessage(error)
    
    return {
      isFallback: true,
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      reason: `${error.type}: ${error.message} (after ${finalAttempt} attempts)`
    }
  }

  /**
   * Get appropriate fallback message based on error type
   */
  private getFallbackMessage(error: ApiError): string {
    const fallbackMessages: Record<ApiError['type'], string> = {
      'rate_limit_error': "I'm experiencing high demand right now. Please try again in a moment.",
      'overloaded_error': "The service is temporarily busy. Please try again shortly.",
      'network_error': "I'm having trouble connecting. Please check your connection and try again.",
      'timeout_error': "The request is taking longer than expected. Please try again.",
      'authentication_error': "There's an authentication issue. Please refresh the page and try again.",
      'permission_error': "I don't have permission to process this request right now.",
      'invalid_request_error': "There was an issue with your request. Please try rephrasing your message.",
      'request_too_large': "Your message is too long. Please try a shorter message.",
      'not_found_error': "I couldn't find the requested resource. Please try again.",
      'api_error': "I'm experiencing technical difficulties. Please try again in a moment."
    }

    return fallbackMessages[error.type] || fallbackMessages['api_error']
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: ApiError): boolean {
    const retryableErrors: ApiError['type'][] = [
      'rate_limit_error',
      'overloaded_error', 
      'network_error',
      'timeout_error',
      'api_error'
    ]

    return retryableErrors.includes(error.type)
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      return retryAfter * 1000
    }

    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 1000 // Add jitter to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, this.config.maxDelay)
  }

  /**
   * Map generic errors to ApiError format
   */
  private mapError(error: any): ApiError {
    if (error?.type && error?.message) {
      return error as ApiError
    }

    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET') {
      return { type: 'network_error', message: 'Network connection failed' }
    }

    if (error?.code === 'ETIMEDOUT') {
      return { type: 'timeout_error', message: 'Request timed out' }
    }

    return {
      type: 'api_error',
      message: error?.message || 'Unknown error occurred'
    }
  }

  /**
   * Log error with structured format
   */
  private logError(error: ApiError, attempt: number): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error_type: error.type,
      message: error.message,
      attempt,
      status_code: error.statusCode,
      request_id: error.requestId,
      retry_after: error.retryAfter
    }

    if (attempt === 1) {
      console.error('Claude API Error:', logData)
    } else {
      console.warn('Claude API Retry:', logData)
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Circuit breaker for preventing cascading failures
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold: number = 5,
    private timeoutMs: number = 60000,
    private recoveryTimeMs: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open - service unavailable')
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeoutMs)
        )
      ])

      if (this.state === 'half-open') {
        this.reset()
      }

      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
      console.warn(`Circuit breaker opened after ${this.failures} failures`)
    }
  }

  private reset(): void {
    this.failures = 0
    this.state = 'closed'
    console.log('Circuit breaker reset - service recovered')
  }

  getState(): { state: string; failures: number } {
    return {
      state: this.state,
      failures: this.failures
    }
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  enableFallback: true,
  logErrors: true
})

// Global circuit breaker for Claude API
export const claudeCircuitBreaker = new CircuitBreaker(5, 30000, 60000)

// Error boundary for React components
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export function createErrorBoundaryReducer() {
  return (state: ErrorBoundaryState, action: any): ErrorBoundaryState => {
    switch (action.type) {
      case 'ERROR_CAUGHT':
        return {
          hasError: true,
          error: action.error,
          errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`
        }
      case 'ERROR_RESET':
        return {
          hasError: false,
          error: null,
          errorId: null
        }
      default:
        return state
    }
  }
}

// Utility for handling streaming errors
export function handleStreamingError(error: any): {
  shouldRetry: boolean
  userMessage: string
  logMessage: string
} {
  const mappedError = globalErrorHandler['mapError'](error)
  
  return {
    shouldRetry: globalErrorHandler['isRetryableError'](mappedError),
    userMessage: globalErrorHandler['getFallbackMessage'](mappedError),
    logMessage: `Streaming error: ${mappedError.type} - ${mappedError.message}`
  }
}