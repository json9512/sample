// Claude API client with comprehensive error handling and retry logic
// Implements robust streaming with exponential backoff and rate limiting

import Anthropic from '@anthropic-ai/sdk'

export interface ApiError {
  type: 'invalid_request_error' | 'authentication_error' | 'permission_error' | 
        'not_found_error' | 'request_too_large' | 'rate_limit_error' | 
        'api_error' | 'overloaded_error' | 'network_error' | 'timeout_error'
  message: string
  statusCode?: number
  requestId?: string
  retryAfter?: number
}

export interface StreamingOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  systemPrompt?: string
  stopSequences?: string[]
}

export interface StreamEventHandlers {
  onStart?: () => void
  onToken?: (token: string) => void
  onComplete?: (message: string, messageId?: string) => void
  onError?: (error: ApiError) => void
  onUsage?: (usage: { input_tokens: number; output_tokens: number }) => void
}

export class ClaudeApiClient {
  private client: Anthropic
  private maxRetries = 3
  private baseDelay = 1000

  constructor() {
    this.validateConfiguration()
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }

  private validateConfiguration(): void {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    
    if (process.env.ANTHROPIC_API_KEY.length < 20) {
      throw new Error('Invalid ANTHROPIC_API_KEY format')
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateBackoffDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) return retryAfter * 1000
    return Math.min(this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000)
  }

  private mapError(error: any): ApiError {
    console.error('Raw Claude API error:', error)

    if (error?.status) {
      const statusCode = error.status
      let type: ApiError['type'] = 'api_error'

      switch (statusCode) {
        case 400: type = 'invalid_request_error'; break
        case 401: type = 'authentication_error'; break
        case 403: type = 'permission_error'; break
        case 404: type = 'not_found_error'; break
        case 413: type = 'request_too_large'; break
        case 429: type = 'rate_limit_error'; break
        case 500: type = 'api_error'; break
        case 529: type = 'overloaded_error'; break
        default: type = 'api_error'
      }

      return {
        type,
        message: error.message || `HTTP ${statusCode} error`,
        statusCode,
        requestId: error.headers?.['request-id'],
        retryAfter: error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : undefined
      }
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

  private shouldRetry(error: ApiError, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false

    return ['rate_limit_error', 'overloaded_error', 'api_error', 'network_error', 'timeout_error']
      .includes(error.type)
  }

  async streamMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: StreamingOptions = {},
    handlers: StreamEventHandlers = {}
  ) {
    let attempt = 0

    while (attempt < this.maxRetries) {
      try {
        handlers.onStart?.()

        const stream = await this.client.messages.stream({
          model: options.model || 'claude-3-5-sonnet-20241022',
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature,
          top_p: options.topP,
          stop_sequences: options.stopSequences,
          messages,
          ...(options.systemPrompt && { system: options.systemPrompt })
        })

        let fullContent = ''
        let messageId: string | undefined

        stream.on('text', (text: string) => {
          fullContent += text
          handlers.onToken?.(text)
        })

        stream.on('message', (message: any) => {
          messageId = message.id
          handlers.onComplete?.(fullContent, messageId)
        })

        stream.on('error', (error: any) => {
          const apiError = this.mapError(error)
          handlers.onError?.(apiError)
        })

        return stream
      } catch (error) {
        const apiError = this.mapError(error)
        attempt++

        if (!this.shouldRetry(apiError, attempt)) {
          handlers.onError?.(apiError)
          throw apiError
        }

        const delay = this.calculateBackoffDelay(attempt - 1, apiError.retryAfter)
        console.warn(`Claude API error (attempt ${attempt}/${this.maxRetries}):`, apiError.message, `Retrying in ${delay}ms`)
        
        await this.delay(delay)
      }
    }

    const maxRetriesError: ApiError = {
      type: 'api_error',
      message: 'Max retries exceeded'
    }
    handlers.onError?.(maxRetriesError)
    throw maxRetriesError
  }

  async createMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: StreamingOptions = {}
  ) {
    let attempt = 0

    while (attempt < this.maxRetries) {
      try {
        return await this.client.messages.create({
          model: options.model || 'claude-3-5-sonnet-20241022',
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature,
          top_p: options.topP,
          stop_sequences: options.stopSequences,
          messages,
          ...(options.systemPrompt && { system: options.systemPrompt })
        })
      } catch (error) {
        const apiError = this.mapError(error)
        attempt++

        if (!this.shouldRetry(apiError, attempt)) {
          throw apiError
        }

        const delay = this.calculateBackoffDelay(attempt - 1, apiError.retryAfter)
        console.warn(`Claude API error (attempt ${attempt}/${this.maxRetries}):`, apiError.message, `Retrying in ${delay}ms`)
        
        await this.delay(delay)
      }
    }

    throw { type: 'api_error' as const, message: 'Max retries exceeded' }
  }
}