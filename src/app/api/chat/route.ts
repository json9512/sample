// Next.js API route for Claude chat streaming
// Implements secure streaming with rate limiting and error handling

import { NextRequest, NextResponse } from 'next/server'
import { ClaudeApiClient } from '@/lib/claude/client'
import { rateLimiter } from '@/lib/claude/rate-limiter'
import { RequestValidator } from '@/lib/claude/validation'
import { MessageService } from '@/lib/database/messages'
import { ConversationService } from '@/lib/database/conversations'
import type { StreamingChunk, ApiError, StreamingSession } from '@/types/claude'

// Track active streaming sessions
const activeSessions = new Map<string, StreamingSession>()

export async function POST(req: NextRequest) {
  let sessionId: string | undefined

  try {
    // Validate and sanitize request
    const validationResult = await RequestValidator.validateStreamingRequest(req)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: validationResult.error,
          ...(validationResult.rateLimitInfo && { rateLimitInfo: validationResult.rateLimitInfo })
        },
        { status: validationResult.error?.type === 'authentication_error' ? 401 : 400 }
      )
    }

    const validatedRequest = validationResult.data!
    sessionId = validatedRequest.sessionId

    // Check rate limits
    const rateLimitResult = await rateLimiter.checkRateLimit(validatedRequest.userId)
    if (!rateLimitResult.allowed) {
      const headers: Record<string, string> = {}
      if (rateLimitResult.retryAfter) {
        headers['Retry-After'] = Math.ceil((rateLimitResult.waitTime || 0) / 1000).toString()
        headers['X-RateLimit-Reset'] = rateLimitResult.retryAfter
      }

      return NextResponse.json(
        { 
          error: {
            type: 'rate_limit_error',
            message: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter
          }
        },
        { status: 429, headers }
      )
    }

    // Initialize Claude API client
    const claudeClient = new ClaudeApiClient()

    // Prepare conversation history
    const conversationHistory = [
      ...(validatedRequest.messages || []),
      { role: 'user' as const, content: validatedRequest.message }
    ]

    // Content safety check
    const safetyCheck = RequestValidator.checkContentSafety(validatedRequest.message)
    if (!safetyCheck.safe) {
      return NextResponse.json(
        { 
          error: {
            type: 'invalid_request_error',
            message: safetyCheck.reason || 'Content safety check failed'
          }
        },
        { status: 400 }
      )
    }

    // Create streaming session
    const streamSession: StreamingSession = {
      id: sessionId,
      conversationId: validatedRequest.conversation_id,
      userId: validatedRequest.userId,
      startTime: Date.now(),
      isActive: true,
      abortController: new AbortController(),
      totalTokens: 0
    }

    activeSessions.set(sessionId, streamSession)

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        let messageId: string | undefined
        let inputTokens = 0
        let outputTokens = 0

        try {
          // Start streaming from Claude
          const claudeStream = await claudeClient.streamMessage(
            conversationHistory,
            {
              model: validatedRequest.model,
              maxTokens: validatedRequest.maxTokens,
              temperature: validatedRequest.temperature,
              topP: validatedRequest.topP,
              systemPrompt: validatedRequest.systemPrompt,
              stopSequences: validatedRequest.stopSequences
            },
            {
              onStart: () => {
                const startChunk: StreamingChunk = {
                  type: 'start',
                  content: '',
                  conversation_id: validatedRequest.conversation_id
                }
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(startChunk)}\n\n`))
              },
              
              onToken: (token: string) => {
                if (streamSession.abortController.signal.aborted) {
                  return
                }

                fullContent += token
                outputTokens += 1 // Approximate token counting

                const chunk: StreamingChunk = {
                  type: 'token',
                  content: token,
                  conversation_id: validatedRequest.conversation_id
                }
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`))
              },
              
              onComplete: async (message: string, msgId?: string) => {
                messageId = msgId

                try {
                  // Save user message to database
                  await MessageService.createMessage({
                    conversation_id: validatedRequest.conversation_id || await createConversation(validatedRequest.userId, validatedRequest.message),
                    role: 'user',
                    content: validatedRequest.message
                  })

                  // Save assistant response to database
                  await MessageService.createMessage({
                    conversation_id: validatedRequest.conversation_id!,
                    role: 'assistant',
                    content: fullContent,
                    metadata: {
                      model: validatedRequest.model,
                      tokens: { input: inputTokens, output: outputTokens },
                      message_id: messageId
                    }
                  })
                } catch (dbError) {
                  console.error('Database save error:', dbError)
                  // Continue with streaming completion - don't fail the whole request
                }

                const completeChunk: StreamingChunk = {
                  type: 'complete',
                  content: fullContent,
                  message_id: messageId,
                  conversation_id: validatedRequest.conversation_id,
                  metadata: {
                    model: validatedRequest.model,
                    usage: {
                      input_tokens: inputTokens,
                      output_tokens: outputTokens
                    }
                  }
                }
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeChunk)}\n\n`))
                controller.close()
              },
              
              onError: (error: ApiError) => {
                console.error('Claude API streaming error:', error)

                const errorChunk: StreamingChunk = {
                  type: 'error',
                  content: error.message || 'Streaming error occurred',
                  conversation_id: validatedRequest.conversation_id
                }
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
                controller.close()
              },
              
              onUsage: (usage) => {
                inputTokens = usage.input_tokens
                outputTokens = usage.output_tokens
                streamSession.totalTokens = inputTokens + outputTokens
              }
            }
          )

          // Handle stream cancellation
          streamSession.abortController.signal.addEventListener('abort', () => {
            try {
              claudeStream.abort()
              controller.close()
            } catch (error) {
              console.warn('Error aborting Claude stream:', error)
            }
          })

        } catch (error) {
          console.error('Streaming initialization error:', error)
          
          const errorChunk: StreamingChunk = {
            type: 'error',
            content: error instanceof Error ? error.message : 'Unknown error',
            conversation_id: validatedRequest.conversation_id
          }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
          controller.close()
        } finally {
          // Cleanup session
          if (sessionId) {
            activeSessions.delete(sessionId)
          }
        }
      },
      
      cancel() {
        if (sessionId && activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)!
          session.abortController.abort()
          activeSessions.delete(sessionId)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Session-Id': sessionId,
      },
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    
    // Cleanup session on error
    if (sessionId && activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId)
    }

    return NextResponse.json(
      { 
        error: {
          type: 'api_error',
          message: 'Failed to process chat request'
        }
      },
      { status: 500 }
    )
  }
}

// Helper function to create new conversation
async function createConversation(userId: string, firstMessage: string): Promise<string> {
  const title = ConversationService.generateConversationTitle(firstMessage)
  const result = await ConversationService.createConversation({ title, user_id: userId })
  
  if (result.error || !result.data) {
    throw new Error('Failed to create conversation')
  }
  
  return result.data.id
}

// Health check endpoint
export async function GET() {
  const activeSessionCount = activeSessions.size
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: activeSessionCount,
    service: 'claude-chat-api'
  })
}

// Endpoint to cancel streaming session
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  
  if (!sessionId || !activeSessions.has(sessionId)) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }
  
  const session = activeSessions.get(sessionId)!
  session.abortController.abort()
  activeSessions.delete(sessionId)
  
  return NextResponse.json({ success: true })
}