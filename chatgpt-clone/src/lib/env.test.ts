import { z } from 'zod'

// Mock process.env for testing
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Environment Configuration', () => {
  describe('when all required environment variables are provided', () => {
    it('should validate successfully', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'test-claude-key'
      }

      // Re-import to get fresh validation
      const { env } = require('./env')
      
      expect(env).toEqual(expect.objectContaining({
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'test-claude-key'
      }))
    })
  })

  describe('when required environment variables are missing', () => {
    it('should throw error for missing Supabase URL', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'test-claude-key'
      }

      expect(() => {
        jest.isolateModules(() => {
          require('./env')
        })
      }).toThrow('Environment validation failed')
    })

    it('should throw error for missing Anthropic API key', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
      }

      expect(() => {
        jest.isolateModules(() => {
          require('./env')
        })
      }).toThrow('Environment validation failed')
    })

    it('should throw error for invalid Supabase URL format', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-valid-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'test-claude-key'
      }

      expect(() => {
        jest.isolateModules(() => {
          require('./env')
        })
      }).toThrow('Invalid Supabase URL')
    })
  })

  describe('client environment variables', () => {
    it('should expose only safe client-side variables', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'test-claude-key'
      }

      const { clientEnv } = require('./env')
      
      expect(clientEnv).toEqual({
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        APP_NAME: 'ChatGPT Clone',
        APP_VERSION: '0.1.0'
      })
    })

    it('should not expose sensitive server variables', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'secret-claude-key'
      }

      const { clientEnv } = require('./env')
      
      expect(clientEnv).not.toHaveProperty('ANTHROPIC_API_KEY')
    })
  })

  describe('server environment variables', () => {
    it('should contain sensitive server-only variables', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'secret-claude-key'
      }

      const { serverEnv } = require('./env')
      
      expect(serverEnv.ANTHROPIC_API_KEY).toBe('secret-claude-key')
    })
  })

  describe('default values', () => {
    it('should apply default values for optional fields', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        ANTHROPIC_API_KEY: 'test-claude-key'
      }

      const { env } = require('./env')
      
      expect(env.APP_NAME).toBe('ChatGPT Clone')
      expect(env.APP_VERSION).toBe('0.1.0')
    })
  })
})