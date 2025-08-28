// Comprehensive logging system for Claude API interactions
// Provides structured logging with different levels and persistence options

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: Record<string, any>
  userId?: string
  conversationId?: string
  sessionId?: string
  requestId?: string
  duration?: number
  error?: {
    type: string
    message: string
    stack?: string
    statusCode?: number
  }
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enablePersistence: boolean
  maxLogEntries: number
  enablePerformanceLogging: boolean
}

class Logger {
  private config: LoggerConfig
  private logs: LogEntry[] = []
  private performanceMarks = new Map<string, number>()

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enablePersistence: false,
      maxLogEntries: 1000,
      enablePerformanceLogging: true,
      ...config
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical']
    return levels.indexOf(level) >= levels.indexOf(this.config.level)
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: Record<string, any>,
    error?: any
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    }

    // Add error information if provided
    if (error) {
      entry.error = {
        type: error.type || error.name || 'Unknown',
        message: error.message || 'Unknown error',
        statusCode: error.statusCode || error.status,
        ...(error.stack && { stack: error.stack })
      }
    }

    return entry
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const logFn = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      critical: console.error
    }[entry.level]

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    
    if (entry.error) {
      logFn(prefix, entry.message, entry.error, entry.data)
    } else {
      logFn(prefix, entry.message, entry.data)
    }
  }

  private persistLog(entry: LogEntry): void {
    if (!this.config.enablePersistence) return

    this.logs.push(entry)

    // Maintain max log entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift()
    }
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: Record<string, any>,
    error?: any
  ): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, category, message, data, error)
    
    this.logToConsole(entry)
    this.persistLog(entry)
  }

  // Public logging methods
  debug(category: string, message: string, data?: Record<string, any>): void {
    this.log('debug', category, message, data)
  }

  info(category: string, message: string, data?: Record<string, any>): void {
    this.log('info', category, message, data)
  }

  warn(category: string, message: string, data?: Record<string, any>, error?: any): void {
    this.log('warn', category, message, data, error)
  }

  error(category: string, message: string, data?: Record<string, any>, error?: any): void {
    this.log('error', category, message, data, error)
  }

  critical(category: string, message: string, data?: Record<string, any>, error?: any): void {
    this.log('critical', category, message, data, error)
  }

  // Specialized logging methods for Claude API
  apiRequest(requestId: string, userId: string, data: Record<string, any>): void {
    this.info('api_request', 'Claude API request initiated', {
      requestId,
      userId,
      model: data.model,
      messageCount: data.messages?.length,
      conversationId: data.conversation_id
    })
  }

  apiResponse(requestId: string, userId: string, duration: number, data: Record<string, any>): void {
    this.info('api_response', 'Claude API request completed', {
      requestId,
      userId,
      duration,
      inputTokens: data.input_tokens,
      outputTokens: data.output_tokens,
      totalTokens: (data.input_tokens || 0) + (data.output_tokens || 0)
    })
  }

  apiError(requestId: string, userId: string, error: any, duration?: number): void {
    this.error('api_error', 'Claude API request failed', {
      requestId,
      userId,
      duration,
      errorType: error.type,
      statusCode: error.statusCode
    }, error)
  }

  streamingStart(sessionId: string, userId: string, conversationId?: string): void {
    this.info('streaming_start', 'Streaming session started', {
      sessionId,
      userId,
      conversationId
    })
  }

  streamingToken(sessionId: string, tokenCount: number): void {
    if (tokenCount % 100 === 0) { // Log every 100 tokens to avoid spam
      this.debug('streaming_progress', 'Streaming progress', {
        sessionId,
        tokenCount
      })
    }
  }

  streamingComplete(sessionId: string, userId: string, duration: number, stats: Record<string, any>): void {
    this.info('streaming_complete', 'Streaming session completed', {
      sessionId,
      userId,
      duration,
      totalTokens: stats.totalTokens,
      wordsPerMinute: stats.totalTokens && duration ? (stats.totalTokens * 60000 / duration).toFixed(2) : undefined
    })
  }

  streamingError(sessionId: string, userId: string, error: any, duration?: number): void {
    this.error('streaming_error', 'Streaming session failed', {
      sessionId,
      userId,
      duration,
      errorType: error.type
    }, error)
  }

  rateLimitHit(userId: string, endpoint: string, retryAfter?: number): void {
    this.warn('rate_limit', 'Rate limit exceeded', {
      userId,
      endpoint,
      retryAfter
    })
  }

  databaseOperation(operation: string, table: string, userId: string, success: boolean, duration: number): void {
    const level = success ? 'debug' : 'error'
    this.log(level, 'database', `Database ${operation} on ${table}`, {
      operation,
      table,
      userId,
      success,
      duration
    })
  }

  // Performance monitoring
  startPerformanceTimer(label: string): void {
    if (this.config.enablePerformanceLogging) {
      this.performanceMarks.set(label, Date.now())
    }
  }

  endPerformanceTimer(label: string, category: string = 'performance', additionalData?: Record<string, any>): number | undefined {
    if (!this.config.enablePerformanceLogging) return

    const startTime = this.performanceMarks.get(label)
    if (!startTime) return

    const duration = Date.now() - startTime
    this.performanceMarks.delete(label)

    this.debug(category, `Performance timer: ${label}`, {
      duration,
      ...additionalData
    })

    return duration
  }

  // Utility methods
  getLogs(level?: LogLevel, category?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit)
    }

    return filteredLogs
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2)
    }

    // CSV format
    if (this.logs.length === 0) return ''

    const headers = Object.keys(this.logs[0]).join(',')
    const rows = this.logs.map(log => 
      Object.values(log).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ).join(',')
    )

    return [headers, ...rows].join('\n')
  }

  clearLogs(): void {
    this.logs = []
  }

  getStats(): {
    totalLogs: number
    logsByLevel: Record<LogLevel, number>
    logsByCategory: Record<string, number>
  } {
    const logsByLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {} as Record<LogLevel, number>)

    const logsByCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      logsByCategory
    }
  }
}

// Create global logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enablePersistence: true,
  maxLogEntries: 1000,
  enablePerformanceLogging: true
})

// Helper functions for common logging patterns
export function logApiCall<T>(
  operation: string,
  fn: () => Promise<T>,
  context: { userId: string; requestId?: string }
): Promise<T> {
  const requestId = context.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  logger.startPerformanceTimer(requestId)
  logger.info('api_call', `Starting ${operation}`, { requestId, userId: context.userId })

  return fn()
    .then(result => {
      const duration = logger.endPerformanceTimer(requestId)
      logger.info('api_call', `Completed ${operation}`, { 
        requestId, 
        userId: context.userId, 
        duration 
      })
      return result
    })
    .catch(error => {
      const duration = logger.endPerformanceTimer(requestId)
      logger.error('api_call', `Failed ${operation}`, { 
        requestId, 
        userId: context.userId, 
        duration 
      }, error)
      throw error
    })
}

export function createRequestLogger(userId: string, conversationId?: string) {
  return {
    debug: (message: string, data?: Record<string, any>) => 
      logger.debug('request', message, { userId, conversationId, ...data }),
    info: (message: string, data?: Record<string, any>) => 
      logger.info('request', message, { userId, conversationId, ...data }),
    warn: (message: string, data?: Record<string, any>, error?: any) => 
      logger.warn('request', message, { userId, conversationId, ...data }, error),
    error: (message: string, data?: Record<string, any>, error?: any) => 
      logger.error('request', message, { userId, conversationId, ...data }, error)
  }
}