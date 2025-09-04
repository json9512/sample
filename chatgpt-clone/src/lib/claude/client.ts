import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ClaudeStreamResponse {
  content: string
  isComplete: boolean
}

export class ClaudeClient {
  private client = anthropic

  async *streamMessage(messages: Array<{ role: 'user' | 'assistant'; content: string }>): AsyncGenerator<ClaudeStreamResponse> {
    try {
      const stream = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages,
        stream: true,
      })

      let content = ''
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          content += chunk.delta.text
          yield {
            content: chunk.delta.text,
            isComplete: false
          }
        } else if (chunk.type === 'message_stop') {
          yield {
            content: '',
            isComplete: true
          }
        }
      }
    } catch (error) {
      console.error('Claude API Error:', error)
      throw error
    }
  }

  async sendMessage(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages,
      })

      if (response.content[0].type === 'text') {
        return response.content[0].text
      }
      
      return ''
    } catch (error) {
      console.error('Claude API Error:', error)
      throw error
    }
  }
}

export const claudeClient = new ClaudeClient()