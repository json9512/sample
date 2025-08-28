// Request validation middleware for Claude API
// Provides security validation and input sanitization

import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import type { StreamingRequest, ValidatedStreamingRequest, RateLimitInfo } from '@/types/claude'

// Validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content exceeds maximum length')
    .transform(content => content.trim())
})

const streamingRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message exceeds maximum length')
    .transform(message => message.trim()),
  conversation_id: z.string().uuid('Invalid conversation ID').optional(),
  messages: z.array(messageSchema)
    .max(50, 'Conversation history exceeds maximum length')
    .optional()
    .default([]),
  model: z.enum([
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ]).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().max(5000).optional(),
  stopSequences: z.array(z.string().max(100)).max(10).optional()
})

export interface ValidationResult {
  success: boolean
  data?: ValidatedStreamingRequest
  error?: {
    type: string
    message: string
    details?: any
  }
  rateLimitInfo?: RateLimitInfo
}

export class RequestValidator {
  
  /**
   * Validate and sanitize streaming request
   */
  static async validateStreamingRequest(req: NextRequest): Promise<ValidationResult> {
    try {
      // Parse request body
      let body: any
      try {
        body = await req.json()
      } catch (error) {
        return {
          success: false,
          error: {
            type: 'invalid_request_error',
            message: 'Invalid JSON in request body'
          }
        }
      }

      // Validate request structure
      const validationResult = streamingRequestSchema.safeParse(body)
      if (!validationResult.success) {
        return {
          success: false,
          error: {
            type: 'invalid_request_error',
            message: 'Request validation failed',
            details: validationResult.error.issues
          }
        }
      }

      // Get user from authentication
      const supabase = getSupabaseServer()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: {
            type: 'authentication_error',
            message: 'Authentication required'
          }
        }
      }

      // Validate conversation ownership if conversation_id provided
      if (validationResult.data.conversation_id) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('user_id')
          .eq('id', validationResult.data.conversation_id)
          .single()

        if (convError || conversation?.user_id !== user.id) {
          return {
            success: false,
            error: {
              type: 'permission_error',
              message: 'Access denied to conversation'
            }
          }
        }
      }

      // Create validated request
      const validatedRequest: ValidatedStreamingRequest = {
        ...validationResult.data,
        userId: user.id,
        sessionId: this.generateSessionId(),
        ipAddress: this.getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined
      }

      return {
        success: true,
        data: validatedRequest
      }

    } catch (error) {
      console.error('Request validation error:', error)
      return {
        success: false,
        error: {
          type: 'api_error',
          message: 'Internal validation error'
        }
      }
    }
  }

  /**
   * Sanitize message content
   */
  static sanitizeContent(content: string): string {
    return content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .trim()
      .slice(0, 10000) // Enforce max length
  }

  /**
   * Validate conversation history
   */
  static validateConversationHistory(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): { valid: boolean; error?: string; sanitized?: Array<{ role: 'user' | 'assistant'; content: string }> } {
    if (!Array.isArray(messages)) {
      return { valid: false, error: 'Messages must be an array' }
    }

    if (messages.length > 50) {
      return { valid: false, error: 'Conversation history too long' }
    }

    const sanitized = messages.map(message => ({
      role: message.role,
      content: this.sanitizeContent(message.content)
    })).filter(message => message.content.length > 0)

    // Ensure alternating roles (optional validation)
    let lastRole: string | null = null
    let hasValidFlow = true
    
    for (const message of sanitized) {
      if (lastRole === message.role && sanitized.length > 1) {
        // Allow consecutive messages but log for monitoring
        console.warn('Non-alternating message roles detected')
        hasValidFlow = false
      }
      lastRole = message.role
    }

    return { 
      valid: true, 
      sanitized,
      ...(hasValidFlow ? {} : { warning: 'Non-standard conversation flow' })
    }
  }

  /**
   * Check content safety (basic implementation)
   */
  static checkContentSafety(content: string): { safe: boolean; reason?: string } {
    // Basic content safety checks
    const suspiciousPatterns = [
      /(?:api[_\s]*key|secret|token|password)/i,
      /(?:credit[_\s]*card|ssn|social[_\s]*security)/i,
      /(?:hack|exploit|vulnerability)/i
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return { 
          safe: false, 
          reason: 'Content contains potentially sensitive information' 
        }
      }
    }

    return { safe: true }
  }

  /**
   * Get client IP address
   */
  private static getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    
    return cfConnectingIP || 
           realIP || 
           forwarded?.split(',')[0].trim() || 
           'unknown'
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Rate limit validation result
   */
  static createRateLimitResult(rateLimitInfo: RateLimitInfo): ValidationResult {
    return {
      success: false,
      error: {
        type: 'rate_limit_error',
        message: `Rate limit exceeded. ${rateLimitInfo.retryAfter ? `Retry after ${rateLimitInfo.retryAfter}` : ''}`
      },
      rateLimitInfo
    }
  }
}