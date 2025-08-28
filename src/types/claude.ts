// Claude API TypeScript definitions
// Comprehensive type definitions for streaming and API responses

export type ClaudeModel = 
  | 'claude-3-5-sonnet-20241022' 
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'

export interface StreamingRequest {
  message: string
  conversation_id?: string
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: ClaudeModel
  maxTokens?: number
  temperature?: number
  topP?: number
  systemPrompt?: string
  stopSequences?: string[]
}

export interface StreamingChunk {
  type: 'token' | 'complete' | 'error' | 'usage' | 'start'
  content: string
  message_id?: string
  conversation_id?: string
  metadata?: {
    model?: string
    usage?: {
      input_tokens: number
      output_tokens: number
    }
    finish_reason?: 'end_turn' | 'max_tokens' | 'stop_sequence'
  }
}

export interface StreamingOptions {
  model?: ClaudeModel
  maxTokens?: number
  temperature?: number
  topP?: number
  systemPrompt?: string
  stopSequences?: string[]
  onToken?: (token: string) => void
  onComplete?: (message: string, messageId?: string) => void
  onError?: (error: ApiError) => void
  onUsage?: (usage: { input_tokens: number; output_tokens: number }) => void
}

export interface ApiError {
  type: 'invalid_request_error' | 'authentication_error' | 'permission_error' | 
        'not_found_error' | 'request_too_large' | 'rate_limit_error' | 
        'api_error' | 'overloaded_error' | 'network_error' | 'timeout_error'
  message: string
  statusCode?: number
  requestId?: string
  retryAfter?: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: {
    type: string
    message: string
    code?: string
  }
  request_id?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  message_id?: string
}

export interface ConversationContext {
  conversation_id?: string
  messages: ChatMessage[]
  title?: string
  created_at?: string
  updated_at?: string
}

export interface RateLimitInfo {
  allowed: boolean
  remainingRequests?: number
  resetTime?: string
  retryAfter?: string
  waitTime?: number
}

export interface UsageMetrics {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  request_id?: string
  model?: string
  conversation_id?: string
}

export interface StreamEventHandlers {
  onStart?: () => void
  onToken?: (token: string) => void
  onComplete?: (message: string, messageId?: string) => void
  onError?: (error: ApiError) => void
  onUsage?: (usage: UsageMetrics) => void
  onRateLimit?: (info: RateLimitInfo) => void
}

export type MessageStreamEvent = 
  | { type: 'message_start'; message: any }
  | { type: 'content_block_start'; index: number; content_block: any }
  | { type: 'content_block_delta'; index: number; delta: { type: 'text_delta'; text: string } }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_delta'; delta: any; usage?: any }
  | { type: 'message_stop' }
  | { type: 'error'; error: any }

export interface ClaudeClientConfig {
  apiKey: string
  maxRetries?: number
  baseDelay?: number
  defaultModel?: ClaudeModel
  defaultMaxTokens?: number
  timeout?: number
}

export interface StreamingSession {
  id: string
  conversationId?: string
  userId: string
  startTime: number
  isActive: boolean
  abortController: AbortController
  totalTokens: number
}

// Extended streaming request for API validation
export interface ValidatedStreamingRequest extends StreamingRequest {
  userId: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
}

// Response wrapper for API routes
export interface StreamingApiResponse {
  success: boolean
  stream?: ReadableStream
  error?: {
    type: string
    message: string
    statusCode: number
  }
  rateLimitInfo?: RateLimitInfo
}