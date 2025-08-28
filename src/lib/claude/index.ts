// Claude API integration exports
// Centralized exports for all Claude API functionality

// Core client and types
export { ClaudeApiClient } from './client'
export type { ApiError, StreamingOptions, StreamEventHandlers } from './client'

// Rate limiting
export { TokenBucket, rateLimiter } from './rate-limiter'

// Validation
export { RequestValidator } from './validation'
export type { ValidationResult } from './validation'

// Error handling
export { 
  ErrorHandler, 
  CircuitBreaker, 
  globalErrorHandler, 
  claudeCircuitBreaker,
  createErrorBoundaryReducer,
  handleStreamingError
} from './error-handler'
export type { 
  ErrorHandlingConfig, 
  FallbackResponse, 
  ErrorBoundaryState 
} from './error-handler'

// Logging
export { 
  logger, 
  logApiCall, 
  createRequestLogger 
} from './logger'
export type { 
  LogLevel, 
  LogEntry, 
  LoggerConfig 
} from './logger'

// Re-export types from types/claude.ts
export type {
  ClaudeModel,
  StreamingRequest,
  StreamingChunk,
  ApiResponse,
  ChatMessage,
  ConversationContext,
  RateLimitInfo,
  UsageMetrics,
  MessageStreamEvent,
  ClaudeClientConfig,
  StreamingSession,
  ValidatedStreamingRequest,
  StreamingApiResponse
} from '@/types/claude'