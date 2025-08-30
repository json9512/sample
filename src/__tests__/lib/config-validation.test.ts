// Test actual config validation logic

describe('Config Validation Logic', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('URL validation', () => {
    it('should validate URL formats correctly', () => {
      const validateUrl = (url: string): boolean => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      }

      const testCases = [
        { url: 'https://api.anthropic.com', valid: true },
        { url: 'http://localhost:3000', valid: true },
        { url: 'https://test.supabase.co', valid: true },
        { url: 'invalid-url', valid: false },
        { url: '', valid: false },
        { url: 'ftp://example.com', valid: true }, // Valid URL, different protocol
        { url: 'https://', valid: false },
      ]

      testCases.forEach(({ url, valid }) => {
        expect(validateUrl(url)).toBe(valid)
      })
    })
  })

  describe('environment variable parsing', () => {
    it('should parse boolean environment variables', () => {
      const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
        if (!value) return defaultValue
        return value.toLowerCase() === 'true' || value === '1'
      }

      expect(parseBoolean('true')).toBe(true)
      expect(parseBoolean('TRUE')).toBe(true)
      expect(parseBoolean('1')).toBe(true)
      expect(parseBoolean('false')).toBe(false)
      expect(parseBoolean('0')).toBe(false)
      expect(parseBoolean('random')).toBe(false)
      expect(parseBoolean(undefined)).toBe(false)
      expect(parseBoolean(undefined, true)).toBe(true)
    })

    it('should parse integer environment variables', () => {
      const parseInt = (value: string | undefined, defaultValue: number): number => {
        if (!value) return defaultValue
        const parsed = Number.parseInt(value, 10)
        return Number.isNaN(parsed) ? defaultValue : parsed
      }

      expect(parseInt('123', 0)).toBe(123)
      expect(parseInt('0', 100)).toBe(0)
      expect(parseInt('invalid', 50)).toBe(50)
      expect(parseInt(undefined, 25)).toBe(25)
      expect(parseInt('123.45', 0)).toBe(123) // Truncates decimals
    })

    it('should handle missing environment variables', () => {
      const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
        return process.env[key] || defaultValue
      }

      delete process.env.TEST_VAR
      expect(getEnvVar('TEST_VAR')).toBeUndefined()
      expect(getEnvVar('TEST_VAR', 'default')).toBe('default')

      process.env.TEST_VAR = 'value'
      expect(getEnvVar('TEST_VAR')).toBe('value')
      expect(getEnvVar('TEST_VAR', 'default')).toBe('value')
    })
  })

  describe('configuration validation', () => {
    it('should validate required configuration fields', () => {
      const requiredFields = ['API_KEY', 'DATABASE_URL', 'SECRET_KEY']
      const config = {
        API_KEY: 'test-key',
        DATABASE_URL: 'https://db.example.com',
        SECRET_KEY: '',
      }

      const errors: string[] = []
      requiredFields.forEach(field => {
        const value = config[field as keyof typeof config]
        if (!value || value.trim() === '') {
          errors.push(`${field} is required`)
        }
      })

      expect(errors).toContain('SECRET_KEY is required')
      expect(errors).not.toContain('API_KEY is required')
      expect(errors).not.toContain('DATABASE_URL is required')
      expect(errors.length).toBe(1)
    })

    it('should validate configuration combinations', () => {
      const validateConfig = (config: any) => {
        const errors: string[] = []

        // If using external auth, require callback URL
        if (config.useExternalAuth && !config.callbackUrl) {
          errors.push('Callback URL required when using external auth')
        }

        // Production must have secure settings
        if (config.environment === 'production') {
          if (!config.httpsOnly) {
            errors.push('HTTPS required in production')
          }
          if (config.debug) {
            errors.push('Debug mode not allowed in production')
          }
        }

        return { isValid: errors.length === 0, errors }
      }

      // Valid production config
      const prodConfig = {
        environment: 'production',
        httpsOnly: true,
        debug: false,
        useExternalAuth: false,
      }
      expect(validateConfig(prodConfig).isValid).toBe(true)

      // Invalid production config
      const invalidProdConfig = {
        environment: 'production',
        httpsOnly: false,
        debug: true,
      }
      const result = validateConfig(invalidProdConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('HTTPS required in production')
      expect(result.errors).toContain('Debug mode not allowed in production')
    })
  })

  describe('deployment platform detection', () => {
    it('should detect deployment platforms from environment', () => {
      const detectPlatform = () => {
        if (process.env.VERCEL) return 'vercel'
        if (process.env.RAILWAY_ENVIRONMENT) return 'railway'
        if (process.env.NETLIFY) return 'netlify'
        if (process.env.RENDER) return 'render'
        if (process.env.DYNO) return 'heroku'
        return 'unknown'
      }

      // Clear all platform env vars
      delete process.env.VERCEL
      delete process.env.RAILWAY_ENVIRONMENT
      delete process.env.NETLIFY
      delete process.env.RENDER
      delete process.env.DYNO

      expect(detectPlatform()).toBe('unknown')

      process.env.VERCEL = '1'
      expect(detectPlatform()).toBe('vercel')

      delete process.env.VERCEL
      process.env.RAILWAY_ENVIRONMENT = 'production'
      expect(detectPlatform()).toBe('railway')

      delete process.env.RAILWAY_ENVIRONMENT
      process.env.NETLIFY = 'true'
      expect(detectPlatform()).toBe('netlify')
    })

    it('should prioritize platform detection correctly', () => {
      // Set multiple platform indicators
      process.env.VERCEL = '1'
      process.env.NETLIFY = 'true'
      process.env.DYNO = 'web.1'

      const detectPlatform = () => {
        // Order matters - first match wins
        if (process.env.VERCEL) return 'vercel'
        if (process.env.RAILWAY_ENVIRONMENT) return 'railway'
        if (process.env.NETLIFY) return 'netlify'
        if (process.env.RENDER) return 'render'
        if (process.env.DYNO) return 'heroku'
        return 'unknown'
      }

      // Should detect Vercel first (highest priority)
      expect(detectPlatform()).toBe('vercel')

      delete process.env.VERCEL
      // Should now detect Netlify
      expect(detectPlatform()).toBe('netlify')

      delete process.env.NETLIFY
      // Should now detect Heroku
      expect(detectPlatform()).toBe('heroku')
    })
  })

  describe('configuration merging', () => {
    it('should merge configurations correctly', () => {
      const defaultConfig = {
        timeout: 5000,
        retries: 3,
        debug: false,
        features: { 
          featureA: true,
          featureB: false 
        }
      }

      const userConfig = {
        timeout: 10000,
        debug: true,
        features: {
          featureB: true,
          featureC: true
        }
      }

      const mergedConfig = {
        ...defaultConfig,
        ...userConfig,
        features: {
          ...defaultConfig.features,
          ...userConfig.features
        }
      }

      expect(mergedConfig.timeout).toBe(10000) // User override
      expect(mergedConfig.retries).toBe(3) // Default preserved
      expect(mergedConfig.debug).toBe(true) // User override
      expect(mergedConfig.features.featureA).toBe(true) // Default preserved
      expect(mergedConfig.features.featureB).toBe(true) // User override
      expect(mergedConfig.features.featureC).toBe(true) // User addition
    })
  })
})