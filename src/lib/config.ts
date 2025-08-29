// Production configuration and environment management
export const config = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',

  // API Configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  },

  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // NextAuth Configuration
  auth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || (
      process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
    ),
  },

  // Performance Configuration
  performance: {
    cacheEnabled: true,
    cacheTTL: parseInt(process.env.CACHE_TTL || '300000', 10), // 5 minutes
    maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '100', 10),
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
  },

  // Rate Limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60', 10),
  },

  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
    enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING === 'true',
    enableConsoleInProduction: false,
  },

  // Security Configuration
  security: {
    csp: process.env.CONTENT_SECURITY_POLICY || 
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com https://*.supabase.co wss://*.supabase.co;",
    enableSecurityHeaders: true,
  },

  // Database Configuration
  database: {
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  // Feature Flags
  features: {
    messageReactions: process.env.FEATURE_MESSAGE_REACTIONS === 'true',
    messageSearch: process.env.FEATURE_MESSAGE_SEARCH === 'true',
    conversationSharing: process.env.FEATURE_CONVERSATION_SHARING === 'true',
    darkMode: process.env.FEATURE_DARK_MODE !== 'false', // enabled by default
  },

  // Deployment Configuration
  deployment: {
    platform: detectDeploymentPlatform(),
    url: getDeploymentUrl(),
    enableAnalytics: !!process.env.GOOGLE_ANALYTICS_ID,
  },
}

function detectDeploymentPlatform(): string {
  if (process.env.VERCEL) return 'vercel'
  if (process.env.RAILWAY_ENVIRONMENT) return 'railway'  
  if (process.env.NETLIFY) return 'netlify'
  if (process.env.RENDER) return 'render'
  if (process.env.DYNO) return 'heroku'
  return 'unknown'
}

function getDeploymentUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.RAILWAY_STATIC_URL) return process.env.RAILWAY_STATIC_URL
  if (process.env.NETLIFY_URL) return process.env.NETLIFY_URL
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL
  if (process.env.APP_URL) return process.env.APP_URL
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

// Configuration validation
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required environment variables
  if (!config.anthropic.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required')
  }

  if (!config.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!config.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (!config.auth.secret && config.isProduction) {
    errors.push('NEXTAUTH_SECRET is required in production')
  }

  // Validate URLs
  try {
    if (config.supabase.url) {
      new URL(config.supabase.url)
    }
  } catch {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  }

  try {
    if (config.auth.url) {
      new URL(config.auth.url)
    }
  } catch {
    errors.push('NEXTAUTH_URL must be a valid URL')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Runtime configuration check
export function checkEnvironment() {
  const validation = validateConfig()
  
  if (!validation.isValid) {
    const errorMessage = `Configuration errors:\n${validation.errors.join('\n')}`
    
    if (config.isProduction) {
      // In production, fail fast
      throw new Error(errorMessage)
    } else {
      // In development, log warnings
      console.warn('⚠️  Configuration warnings:')
      validation.errors.forEach(error => console.warn(`  - ${error}`))
    }
  }

  // Log successful configuration in development
  if (config.isDevelopment) {
    console.log('✅ Environment configuration loaded')
    console.log(`📍 Platform: ${config.deployment.platform}`)
    console.log(`🔗 URL: ${config.deployment.url}`)
  }
}

export default config