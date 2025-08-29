// Production monitoring and logging utilities
import config from './config'

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Structured log entry
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  conversationId?: string
  requestId?: string
}

// Logger class for structured logging
export class Logger {
  private static instance: Logger
  private logLevel: LogLevel
  private enableConsoleOutput: boolean

  private constructor() {
    this.logLevel = this.getLogLevelFromConfig()
    this.enableConsoleOutput = config.isDevelopment || config.logging.enableConsoleInProduction
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private getLogLevelFromConfig(): LogLevel {
    switch (config.logging.level) {
      case 'debug': return LogLevel.DEBUG
      case 'info': return LogLevel.INFO
      case 'warn': return LogLevel.WARN
      case 'error': return LogLevel.ERROR
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const levelName = levelNames[entry.level] || 'UNKNOWN'
    
    let formatted = `[${entry.timestamp}] ${levelName}: ${entry.message}`
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(entry.context)}`
    }
    
    if (entry.error) {
      formatted += ` | Error: ${entry.error.message}`
      if (config.logging.enableDetailedLogging) {
        formatted += ` | Stack: ${entry.error.stack}`
      }
    }
    
    return formatted
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      requestId: context?.requestId
    }

    // Console output for development
    if (this.enableConsoleOutput) {
      const formatted = this.formatLogEntry(entry)
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
          console.error(formatted)
          break
      }
    }

    // Send to external logging service in production
    if (config.isProduction) {
      this.sendToExternalLogging(entry)
    }
  }

  private async sendToExternalLogging(entry: LogEntry) {
    // Placeholder for external logging service integration
    // Examples: Sentry, LogRocket, Datadog, etc.
    
    try {
      // For now, just store critical errors
      if (entry.level === LogLevel.ERROR && typeof window !== 'undefined') {
        // Could integrate with services like Sentry here
        // Sentry.captureException(entry.error || new Error(entry.message), {
        //   extra: entry.context,
        //   tags: { requestId: entry.requestId }
        // })
      }
    } catch (error) {
      // Fail silently to avoid logging loops
      console.warn('Failed to send log to external service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error)
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map()
  
  static startTimer(key: string): void {
    if (config.performance.enablePerformanceMonitoring) {
      this.metrics.set(key, performance.now())
    }
  }

  static endTimer(key: string): number {
    if (!config.performance.enablePerformanceMonitoring) return 0
    
    const startTime = this.metrics.get(key)
    if (startTime === undefined) return 0
    
    const duration = performance.now() - startTime
    this.metrics.delete(key)
    
    // Log slow operations
    if (duration > 1000) { // Log operations taking more than 1 second
      Logger.getInstance().warn(`Slow operation detected: ${key}`, { duration })
    }
    
    return duration
  }

  static measureAsync<T>(key: string, operation: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startTimer(key)
      try {
        const result = await operation()
        const duration = this.endTimer(key)
        Logger.getInstance().debug(`Operation completed: ${key}`, { duration })
        resolve(result)
      } catch (error) {
        this.endTimer(key)
        Logger.getInstance().error(`Operation failed: ${key}`, error as Error)
        reject(error)
      }
    })
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }
}

// Error boundary helper for React components
export class ErrorReporter {
  static reportError(error: Error, context?: Record<string, any>) {
    const logger = Logger.getInstance()
    
    logger.error('Application error', error, {
      ...context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      timestamp: Date.now(),
    })
  }

  static reportApiError(endpoint: string, error: Error, context?: Record<string, any>) {
    this.reportError(error, {
      ...context,
      type: 'api_error',
      endpoint,
    })
  }

  static reportDatabaseError(operation: string, error: Error, context?: Record<string, any>) {
    this.reportError(error, {
      ...context,
      type: 'database_error',
      operation,
    })
  }
}

// Health check utilities for production monitoring
export class HealthChecker {
  static async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy'
    checks: Record<string, boolean>
    timestamp: string
  }> {
    const checks: Record<string, boolean> = {}
    
    // Check database connectivity
    try {
      // This would typically check your database connection
      checks.database = true
    } catch {
      checks.database = false
    }

    // Check external API availability
    try {
      // This would check Claude API connectivity
      checks.claude_api = true
    } catch {
      checks.claude_api = false
    }

    const allHealthy = Object.values(checks).every(Boolean)
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    }
  }
}

// Export singleton logger instance
export const logger = Logger.getInstance()